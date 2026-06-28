import axios from 'axios';

async function run() {
  try {
    console.log('Logging in as student...');
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'student@aems.local',
      password: 'Student@123'
    });
    
    const token = loginRes.data.accessToken;
    console.log('Login successful. Token acquired.');

    console.log('Fetching courses list...');
    const coursesRes = await axios.get('http://localhost:5000/api/lms/courses', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('Courses count:', coursesRes.data.length);
    console.log('Courses list:', JSON.stringify(coursesRes.data, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
    process.exit(1);
  }
}

run();
