import autocannon from 'autocannon';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const targetUrl = process.env.TEST_TARGET_URL || 'http://127.0.0.1:5003';
const connections = parseInt(process.env.TEST_CONNECTIONS || '500', 10);
const duration = parseInt(process.env.TEST_DURATION || '45', 10); // 45 seconds run

console.log(`====================================================`);
console.log(`🚀 Starting 500-Candidate Exam Load Benchmark`);
console.log(`Target URL            : ${targetUrl}`);
console.log(`Simultaneous Students : ${connections} concurrent connections`);
console.log(`Benchmark Duration    : ${duration} seconds`);
console.log(`====================================================\n`);

const instance = autocannon({
  url: targetUrl,
  connections: connections,
  duration: duration,
  pipelining: 1,
  requests: [
    {
      method: 'GET',
      path: '/health'
    },
    {
      method: 'GET',
      path: '/api/public/exams/categories'
    },
    {
      method: 'GET',
      path: '/api/public/exams'
    },
    {
      method: 'GET',
      path: '/api/public/exams/terms-privacy'
    }
  ]
}, (err, result) => {
  if (err) {
    console.error('❌ Load Test Execution Error:', err);
    process.exit(1);
  }
  
  console.log(`\n====================================================`);
  console.log(`📊 500 CONCURRENT CANDIDATES BENCHMARK RESULTS`);
  console.log(`====================================================`);
  console.log(`Total Requests Processed : ${result.requests.total.toLocaleString()}`);
  console.log(`Throughput (Requests/sec): ${Math.round(result.requests.average)} req/s`);
  console.log(`Data Transfer Rate       : ${(result.throughput.average / (1024 * 1024)).toFixed(2)} MB/s`);
  console.log(`Average Latency          : ${result.latency.average.toFixed(1)} ms`);
  console.log(`p95 Latency              : ${result.latency.p95} ms`);
  console.log(`p99 Latency              : ${result.latency.p99} ms`);
  console.log(`Successful (2xx) HTTP    : ${result['2xx'].toLocaleString()}`);
  console.log(`Rate Limited (4xx)       : ${result['4xx']}`);
  console.log(`Server Errors (5xx)      : ${result['5xx']}`);
  console.log(`====================================================`);

  const hasNo5xx = result['5xx'] === 0;
  const isFastLatency = result.latency.p95 < 300;

  if (hasNo5xx && isFastLatency) {
    console.log(`🎉 PASS: Server successfully handled 500 concurrent candidates with 0 errors and low latency!`);
  } else if (!hasNo5xx) {
    console.log(`❌ FAIL: Server produced ${result['5xx']} 5xx server errors during load.`);
  } else {
    console.log(`⚠️ WARNING: p95 latency (${result.latency.p95}ms) is higher than recommended 300ms threshold.`);
  }
  console.log(`====================================================\n`);
});

autocannon.track(instance, { renderProgressBar: true });
