import express from 'express';
import path from 'path';
import fs from 'fs';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.js';
import { listBackups, deleteBackup, getBackupDir } from '../services/backup.service.js';
import { runBackupTask } from '../jobs/backup.job.js';

const router = express.Router();

// Apply auth middleware to all admin backup endpoints
router.use(authenticateJWT);
router.use(authorizeRoles('super_admin'));

/**
 * GET /api/admin/backups
 * Returns list of backups and retention schedule configuration.
 */
router.get('/', async (req, res) => {
  try {
    const backups = await listBackups();
    res.json({
      success: true,
      schedule: '0 2 * * *',
      scheduleDescription: 'Every day at 02:00 AM',
      retentionDays: 7,
      totalBackups: backups.length,
      backups
    });
  } catch (error) {
    console.error('[Admin Backups API] Error listing backups:', error);
    res.status(500).json({ message: 'Failed to retrieve backups list', error: error.message });
  }
});

/**
 * POST /api/admin/backups/trigger
 * Triggers a manual database backup & cleanup.
 */
router.post('/trigger', async (req, res) => {
  try {
    const result = await runBackupTask();
    res.json({
      success: true,
      message: 'Backup completed successfully',
      result
    });
  } catch (error) {
    console.error('[Admin Backups API] Manual backup trigger error:', error);
    res.status(500).json({ message: 'Backup execution failed', error: error.message });
  }
});

/**
 * GET /api/admin/backups/download/:filename
 * Downloads a specific backup archive file.
 */
router.get('/download/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const safeFilename = path.basename(filename);

    if (safeFilename !== filename || !safeFilename.startsWith('backup_')) {
      return res.status(400).json({ message: 'Invalid backup filename' });
    }

    const backupDir = getBackupDir();
    const filePath = path.join(backupDir, safeFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Backup file not found' });
    }

    res.setHeader('Content-Type', 'application/gzip');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('[Admin Backups API] Download error:', error);
    res.status(500).json({ message: 'Failed to download backup file', error: error.message });
  }
});

/**
 * DELETE /api/admin/backups/:filename
 * Deletes a specific backup file.
 */
router.delete('/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    await deleteBackup(filename);
    res.json({ success: true, message: `Backup file ${filename} deleted successfully` });
  } catch (error) {
    console.error('[Admin Backups API] Delete error:', error);
    res.status(500).json({ message: 'Failed to delete backup file', error: error.message });
  }
});

export default router;
