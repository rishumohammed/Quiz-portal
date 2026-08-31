import cron from 'node-cron';
import { createDatabaseBackup, cleanOldBackups } from '../services/backup.service.js';

let isBackupRunning = false;

/**
 * Executes a full backup task (creates new backup & purges backups older than 7 days).
 */
export async function runBackupTask() {
  if (isBackupRunning) {
    console.warn('[Backup Job] A backup task is already in progress. Skipping...');
    return null;
  }

  isBackupRunning = true;
  const startTime = Date.now();
  console.log(`[Backup Job] Starting automated backup sequence at ${new Date().toISOString()}...`);

  try {
    // 1. Create database backup
    const backupResult = await createDatabaseBackup();

    // 2. Clean up backups older than 7 days
    const cleanupResult = await cleanOldBackups(7);

    const durationMs = Date.now() - startTime;
    console.log(`[Backup Job] Backup sequence completed in ${durationMs}ms.`);
    console.log(`[Backup Job] File: ${backupResult.filename} (${(backupResult.sizeBytes / (1024 * 1024)).toFixed(2)} MB)`);
    console.log(`[Backup Job] Purged ${cleanupResult.deletedCount} expired backup file(s).`);

    return {
      success: true,
      backup: backupResult,
      cleanup: cleanupResult,
      durationMs
    };
  } catch (error) {
    console.error('[Backup Job] Backup sequence failed:', error);
    throw error;
  } finally {
    isBackupRunning = false;
  }
}

/**
 * Initializes the automated backup cron job.
 * Scheduled to run every day at 02:00 AM ('0 2 * * *').
 */
export function initBackupJob() {
  // Prevent duplicate execution in PM2 cluster mode
  if (process.env.NODE_APP_INSTANCE && process.env.NODE_APP_INSTANCE !== '0') {
    console.log(`[Backup Job] Skipping cron initialization on PM2 worker instance ${process.env.NODE_APP_INSTANCE}`);
    return;
  }

  // Schedule cron job for 02:00 AM daily
  cron.schedule('0 2 * * *', async () => {
    console.log('[Backup Job] Scheduled 02:00 AM cron trigger fired.');
    try {
      await runBackupTask();
    } catch (err) {
      console.error('[Backup Job] Scheduled backup error:', err.message);
    }
  });

  console.log('Automated Daily Backup Job initialized (runs every day at 02:00 AM, retains backups for 7 days)');
}
