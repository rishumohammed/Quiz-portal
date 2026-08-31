import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import { runBackupTask } from '../src/jobs/backup.job.js';

console.log('--- Starting Manual CLI Backup Trigger ---');

runBackupTask()
  .then((res) => {
    console.log('--- Backup Summary ---');
    console.log(`Status: Success`);
    console.log(`File: ${res.backup.filename}`);
    console.log(`Engine: ${res.backup.engine}`);
    console.log(`Size: ${(res.backup.sizeBytes / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`Cleaned Expired Files: ${res.cleanup.deletedCount}`);
    console.log(`Duration: ${res.durationMs}ms`);
    process.exit(0);
  })
  .catch((err) => {
    console.error('--- Backup Failed ---');
    console.error(err);
    process.exit(1);
  });
