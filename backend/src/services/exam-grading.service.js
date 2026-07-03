import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/connection.js';

// Helper to grade correct answers
export function gradeQuestion(type, correct, submitted) {
  if (submitted === undefined || submitted === null) return false;
  
  const cleanStr = (val) => val.toString().trim().toLowerCase();
  
  if (type === 'mcq' || type === 'truefalse') {
    return cleanStr(correct) === cleanStr(submitted);
  }
  if (type === 'fib') {
    return cleanStr(correct) === cleanStr(submitted);
  }
  if (type === 'msq') {
    try {
      const correctArr = Array.isArray(correct) ? correct : JSON.parse(correct);
      const submittedArr = Array.isArray(submitted) ? submitted : JSON.parse(submitted);
      
      if (!Array.isArray(correctArr) || !Array.isArray(submittedArr)) {
        return cleanStr(correct) === cleanStr(submitted);
      }
      if (correctArr.length !== submittedArr.length) return false;
      
      const cleanAndSort = (arr) => arr.map(x => cleanStr(x)).sort();
      const cSorted = cleanAndSort(correctArr);
      const sSorted = cleanAndSort(submittedArr);
      
      return cSorted.every((val, idx) => val === sSorted[idx]);
    } catch (e) {
      return cleanStr(correct) === cleanStr(submitted);
    }
  }
  return false;
}

/**
 * Submits an exam attempt, grades it, and generates results.
 * @param {string} attemptId 
 * @param {Array} guestAnswers Array of { question_id, answer }
 * @returns {Object} result object containing result_id, score, percentage, passed
 */
export async function submitExamAttempt(attemptId, guestAnswers = []) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [attempts] = await connection.query(`
      SELECT a.*, e.passing_marks, e.total_marks, e.negative_marking, e.pass_percentage
      FROM public_exam_attempts a
      JOIN public_exams e ON a.exam_id = e.id
      WHERE a.id = ?
    `, [attemptId]);

    if (attempts.length === 0) {
      throw new Error('Attempt not found');
    }

    const attempt = attempts[0];
    if (attempt.status !== 'in_progress') {
      throw new Error('Attempt already submitted');
    }

    // Fetch all questions with correct answers to grade
    const [questions] = await connection.query(
      'SELECT id, type, correct_answer, marks FROM public_exam_questions WHERE exam_id = ?',
      [attempt.exam_id]
    );

    let correctAnswersCount = 0;
    let wrongAnswersCount = 0;
    let calculatedScore = 0;

    for (const q of questions) {
      const gAns = guestAnswers.find(ga => ga.question_id === q.id);
      
      if (gAns && gAns.answer !== undefined && gAns.answer !== null && gAns.answer !== '') {
        const isCorrect = gradeQuestion(q.type, q.correct_answer, gAns.answer);
        if (isCorrect) {
          correctAnswersCount++;
          calculatedScore += q.marks;
        } else {
          wrongAnswersCount++;
          // Apply negative marking if configured
          if (attempt.negative_marking > 0) {
            calculatedScore -= parseFloat(attempt.negative_marking);
          }
        }
      } else {
        // Unanswered questions do not incur negative marking in standard exams
        wrongAnswersCount++;
      }
    }

    // Capping score to 0 to avoid negative totals
    calculatedScore = Math.max(0, calculatedScore);

    const totalMarks = attempt.total_marks || 1;
    const percentage = parseFloat(((calculatedScore / totalMarks) * 100).toFixed(2));
    
    // Evaluate pass status based on score or pass percentage
    let passed = false;
    if (attempt.pass_percentage > 0) {
      passed = percentage >= attempt.pass_percentage;
    } else {
      passed = calculatedScore >= attempt.passing_marks;
    }

    // Time Taken calculation (for auto-submission, it might be past expiration, so cap it at duration if needed, but for simplicity use exact time)
    const startedAt = new Date(attempt.started_at);
    let submittedAt = new Date();
    
    // If auto-completing, limit the time_taken_seconds to the max session time approximately, 
    // but using actual timestamps is safer to avoid negative times.
    const maxAllowedTime = new Date(attempt.session_expires_at);
    if (submittedAt > maxAllowedTime) {
      submittedAt = maxAllowedTime;
    }

    const timeTakenSec = Math.max(0, Math.floor((submittedAt - startedAt) / 1000));

    // Update attempt
    await connection.query(`
      UPDATE public_exam_attempts 
      SET status = 'submitted', submitted_at = ?, answers_json = ?
      WHERE id = ?
    `, [new Date(), JSON.stringify(guestAnswers), attemptId]);

    // Create result
    const resultId = uuidv4();
    await connection.query(`
      INSERT INTO public_exam_results (id, attempt_id, exam_id, score, percentage, correct_answers, wrong_answers, time_taken_seconds, passed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      resultId,
      attemptId,
      attempt.exam_id,
      calculatedScore,
      percentage,
      correctAnswersCount,
      wrongAnswersCount,
      timeTakenSec,
      passed
    ]);

    await connection.commit();
    return {
      result_id: resultId,
      score: calculatedScore,
      percentage,
      passed
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
