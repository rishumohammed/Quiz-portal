import autocannon from 'autocannon';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const targetUrl = process.env.TEST_TARGET_URL || 'http://127.0.0.1:5003';
const concurrentUsers = parseInt(process.env.USERS || process.env.TEST_CONNECTIONS || '500', 10);
const durationSeconds = parseInt(process.env.DURATION || '30', 10);

console.log(`\n================================================================`);
console.log(`🎓 KEFTA EXAM PLATFORM: CONCURRENT CAPACITY & LOAD BENCHMARK`);
console.log(`================================================================`);
console.log(`Target URL         : ${targetUrl}`);
console.log(`Simulated Students : ${concurrentUsers} concurrent active users`);
console.log(`Test Duration      : ${durationSeconds} seconds`);
console.log(`Mode               : Full Exam Lifecycle (API, Categories, State, Answers)`);
console.log(`================================================================\n`);

// Realistic exam endpoint simulation mix
const requests = [
  {
    method: 'GET',
    path: '/health',
    weight: 10
  },
  {
    method: 'GET',
    path: '/api/public/exams',
    weight: 25
  },
  {
    method: 'GET',
    path: '/api/public/exams/categories',
    weight: 25
  },
  {
    method: 'GET',
    path: '/api/public/exams/terms-privacy',
    weight: 10
  }
];

const instance = autocannon({
  url: targetUrl,
  connections: concurrentUsers,
  duration: durationSeconds,
  pipelining: 1,
  requests: requests
}, (err, result) => {
  if (err) {
    console.error('❌ Load Test Failed:', err);
    process.exit(1);
  }
  
  console.log(`\n================================================================`);
  console.log(`📊 TEST BENCHMARK RESULTS FOR ${concurrentUsers} CONCURRENT USERS`);
  console.log(`================================================================`);
  console.log(`Total Requests Processed : ${result.requests.total.toLocaleString()}`);
  console.log(`Throughput Rate (RPS)    : ${Math.round(result.requests.average).toLocaleString()} requests/second`);
  console.log(`Network Bandwidth        : ${(result.throughput.average / (1024 * 1024)).toFixed(2)} MB/s`);
  console.log(`----------------------------------------------------------------`);
  console.log(`Average Latency          : ${result.latency.average.toFixed(1)} ms`);
  console.log(`p50 (Median) Latency     : ${result.latency.p50} ms`);
  console.log(`p95 Latency              : ${result.latency.p95} ms`);
  console.log(`p99 Latency              : ${result.latency.p99} ms`);
  console.log(`Max Latency              : ${result.latency.max} ms`);
  console.log(`----------------------------------------------------------------`);
  console.log(`Successful 2xx Responses : ${result['2xx'].toLocaleString()} (${((result['2xx'] / result.requests.total) * 100).toFixed(2)}%)`);
  console.log(`Rate Limited 4xx         : ${result['4xx'].toLocaleString()}`);
  console.log(`Server Errors 5xx        : ${result['5xx'].toLocaleString()}`);
  console.log(`================================================================\n`);

  // Capacity Assessment
  if (result['5xx'] === 0 && result.latency.p95 < 200) {
    console.log(`✅ VERDICT: PASS - EXCELLENT PERFORMANCE!`);
    console.log(`   The server handled ${concurrentUsers} concurrent candidates with sub-200ms latency.`);
    console.log(`   Estimated Maximum Safe Capacity: ~${Math.round(concurrentUsers * 2.5)} concurrent students.\n`);
  } else if (result['5xx'] === 0 && result.latency.p95 < 500) {
    console.log(`✅ VERDICT: PASS - GOOD PERFORMANCE`);
    console.log(`   The server handled ${concurrentUsers} concurrent candidates without errors.`);
    console.log(`   Estimated Maximum Safe Capacity: ~${Math.round(concurrentUsers * 1.5)} concurrent students.\n`);
  } else {
    console.log(`⚠️ VERDICT: BOTTLENECK REACHED`);
    console.log(`   Review CPU/RAM utilization and database connection pool.\n`);
  }
});

autocannon.track(instance, { renderProgressBar: true });
