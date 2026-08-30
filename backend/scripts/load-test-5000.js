import autocannon from 'autocannon';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const targetUrl = process.env.TEST_TARGET_URL || 'http://localhost:5003';
const connections = parseInt(process.env.TEST_CONNECTIONS || '500', 10); // Simulated concurrent connections
const duration = parseInt(process.env.TEST_DURATION || '30', 10); // Run for 30 seconds

console.log(`====================================================`);
console.log(`🚀 Starting High Concurrency Load Test (5,000 Candidate Simulation)`);
console.log(`Target URL: ${targetUrl}`);
console.log(`Simulated Connections: ${connections}`);
console.log(`Test Duration: ${duration} seconds`);
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
    console.error('❌ Load Test Error:', err);
    process.exit(1);
  }
  
  console.log(`\n====================================================`);
  console.log(`📊 LOAD TEST BENCHMARK RESULTS`);
  console.log(`====================================================`);
  console.log(`Total Requests Sent : ${result.requests.total}`);
  console.log(`Requests/sec (Avg)  : ${result.requests.average}`);
  console.log(`Throughput (MB/sec) : ${(result.throughput.average / (1024 * 1024)).toFixed(2)} MB/s`);
  console.log(`Latency (Average)   : ${result.latency.average} ms`);
  console.log(`Latency (p95)       : ${result.latency.p95} ms`);
  console.log(`Latency (p99)       : ${result.latency.p99} ms`);
  console.log(`2xx Responses       : ${result['2xx']}`);
  console.log(`4xx Responses       : ${result['4xx']} (Rate limited / Not found)`);
  console.log(`5xx Responses       : ${result['5xx']} (Server Errors)`);
  console.log(`====================================================`);

  if (result['5xx'] === 0 && result.latency.p95 < 500) {
    console.log(`✅ EXCELLENT: Application passed high-concurrency benchmarks!`);
  } else {
    console.log(`⚠️ WARNING: Review latency or non-2xx response metrics.`);
  }
});

autocannon.track(instance, { renderProgressBar: true });
