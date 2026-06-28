import { defineStore } from 'pinia';
import { useApi } from '@/composables/useApi';

const STORAGE_KEY = 'aems_exam_state';

export const useExamStore = defineStore('exam', {
  state: () => ({
    attempt: null as any,
    questions: [] as any[],
    answers: {} as Record<string, string>, // questionId -> answer
    flagged: new Set<string>(),
    currentIndex: 0,
    serverRemainingSeconds: 0,
    localTimerSeconds: 0,
    examSessionToken: null as string | null,
    isSubmitting: false,
    isLoaded: false,
    autoSaveInterval: null as any,
    timerSyncInterval: null as any,
    localCountdownInterval: null as any,
  }),

  getters: {
    currentQuestion: (state) => state.questions[state.currentIndex] || null,
    totalQuestions: (state) => state.questions.length,
    answeredCount: (state) => Object.keys(state.answers).filter(k => state.answers[k] !== '' && state.answers[k] !== null && state.answers[k] !== undefined).length,
    answeredPercent: (state) => {
      if (state.questions.length === 0) return 0;
      const answered = Object.keys(state.answers).filter(k => state.answers[k] !== '' && state.answers[k] !== null).length;
      return Math.round((answered / state.questions.length) * 100);
    },
    questionStatus: (state) => (questionId: string) => {
      if (state.flagged.has(questionId)) return 'flagged';
      if (state.answers[questionId] !== undefined && state.answers[questionId] !== '') return 'answered';
      return 'unanswered';
    },
    canSubmit: (state) => {
      if (!state.attempt) return false;
      const minPct = state.attempt.min_submit_pct || 50;
      const answered = Object.keys(state.answers).filter(k => state.answers[k] !== '' && state.answers[k] !== null).length;
      const pct = state.questions.length > 0 ? (answered / state.questions.length) * 100 : 100;
      return pct >= minPct;
    },
    unansweredCount: (state) => {
      return state.questions.filter(q => !state.answers[q.id] || state.answers[q.id] === '').length;
    },
    displayTime: (state) => {
      const s = state.localTimerSeconds;
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      const sec = s % 60;
      if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
      return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    },
    isTimeWarning: (state) => state.localTimerSeconds <= 300 && state.localTimerSeconds > 0,
    isTimeCritical: (state) => state.localTimerSeconds <= 60 && state.localTimerSeconds > 0,
  },

  actions: {
    // ── Load attempt data (pre-exam checklist) ─────────────────────────────────
    async loadAttempt(attemptId: string) {
      const api = useApi();
      const { data } = await api.get(`/exams/attempts/${attemptId}`);
      this.attempt = data;
    },

    // ── Start the exam — get questions + session token ─────────────────────────
    async startExam(attemptId: string) {
      const api = useApi();
      const { data } = await api.post(`/exams/attempts/${attemptId}/start`);

      this.examSessionToken = data.exam_session_token;
      this.questions = data.questions || [];
      this.serverRemainingSeconds = data.remaining_seconds || 0;
      this.localTimerSeconds = this.serverRemainingSeconds;
      this.currentIndex = 0;
      this.isLoaded = true;

      // Restore from localStorage if available
      this.restoreFromStorage(attemptId);

      // Start timers
      this.startLocalCountdown();
      this.startServerSync(attemptId);
      this.startAutoSave(attemptId);
    },

    // ── Answer management ──────────────────────────────────────────────────────
    setAnswer(questionId: string, answer: string) {
      this.answers[questionId] = answer;
    },
    toggleFlag(questionId: string) {
      if (this.flagged.has(questionId)) {
        this.flagged.delete(questionId);
      } else {
        this.flagged.add(questionId);
      }
    },
    goToQuestion(index: number) {
      if (index >= 0 && index < this.questions.length) {
        this.currentIndex = index;
      }
    },
    nextQuestion() { this.goToQuestion(this.currentIndex + 1); },
    prevQuestion() { this.goToQuestion(this.currentIndex - 1); },

    // ── Local countdown ────────────────────────────────────────────────────────
    startLocalCountdown() {
      this.clearLocalCountdown();
      this.localCountdownInterval = setInterval(() => {
        if (this.localTimerSeconds > 0) {
          this.localTimerSeconds--;
        } else {
          this.clearLocalCountdown();
        }
      }, 1000);
    },
    clearLocalCountdown() {
      if (this.localCountdownInterval) {
        clearInterval(this.localCountdownInterval);
        this.localCountdownInterval = null;
      }
    },

    // ── Server timer sync every 60s ────────────────────────────────────────────
    startServerSync(attemptId: string) {
      this.timerSyncInterval = setInterval(async () => {
        try {
          const api = useApi();
          const { data } = await api.get(`/exams/attempts/${attemptId}/timer`, {
            headers: { 'X-Exam-Session': this.examSessionToken }
          });
          // Only adjust if server says < local (prevent manipulation)
          if (data.remaining_seconds < this.localTimerSeconds) {
            this.localTimerSeconds = data.remaining_seconds;
          }
          this.serverRemainingSeconds = data.remaining_seconds;
        } catch {
          // Ignore sync errors silently
        }
      }, 60000);
    },

    // ── Auto-save to localStorage every 60s ───────────────────────────────────
    startAutoSave(attemptId: string) {
      this.autoSaveInterval = setInterval(() => {
        this.persistToStorage(attemptId);
      }, 60000);
    },
    persistToStorage(attemptId: string) {
      if (typeof window === 'undefined') return;
      localStorage.setItem(`${STORAGE_KEY}_${attemptId}`, JSON.stringify({
        answers: this.answers,
        flagged: [...this.flagged],
        currentIndex: this.currentIndex,
        savedAt: Date.now(),
      }));
    },
    restoreFromStorage(attemptId: string) {
      if (typeof window === 'undefined') return;
      const raw = localStorage.getItem(`${STORAGE_KEY}_${attemptId}`);
      if (!raw) return;
      try {
        const saved = JSON.parse(raw);
        // Only restore if saved within last 24h
        if (Date.now() - saved.savedAt < 24 * 60 * 60 * 1000) {
          this.answers = saved.answers || {};
          this.flagged = new Set(saved.flagged || []);
          this.currentIndex = saved.currentIndex || 0;
        }
      } catch { /* ignore */ }
    },
    clearStorage(attemptId: string) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`${STORAGE_KEY}_${attemptId}`);
      }
    },

    // ── Submit exam ────────────────────────────────────────────────────────────
    async submitExam(attemptId: string) {
      this.isSubmitting = true;
      const api = useApi();
      const answers = this.questions.map(q => ({
        question_id: q.id,
        answer: this.answers[q.id] || null,
      }));
      const { data } = await api.post(`/exams/attempts/${attemptId}/submit`, {
        answers,
        exam_session_token: this.examSessionToken,
      });
      this.clearAllIntervals();
      this.clearStorage(attemptId);
      this.isSubmitting = false;
      return data;
    },

    // ── Cleanup ────────────────────────────────────────────────────────────────
    clearAllIntervals() {
      this.clearLocalCountdown();
      if (this.timerSyncInterval) { clearInterval(this.timerSyncInterval); this.timerSyncInterval = null; }
      if (this.autoSaveInterval) { clearInterval(this.autoSaveInterval); this.autoSaveInterval = null; }
    },
    reset() {
      this.clearAllIntervals();
      this.attempt = null;
      this.questions = [];
      this.answers = {};
      this.flagged = new Set();
      this.currentIndex = 0;
      this.serverRemainingSeconds = 0;
      this.localTimerSeconds = 0;
      this.examSessionToken = null;
      this.isLoaded = false;
      this.isSubmitting = false;
    },
  },
});
