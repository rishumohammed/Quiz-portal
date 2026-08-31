import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { pool } from '../db/connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKUP_DIR = path.join(__dirname, '../../backups');

/**
 * Ensures the backup directory exists.
 */
export function getBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  return BACKUP_DIR;
}

/**
 * Formats a Date object into YYYY-MM-DD_HH-mm-ss
 */
function getTimestampString(date = new Date()) {
  const pad = (num) => String(num).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

/**
 * Escapes SQL string values safely.
 */
function escapeSqlValue(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? '1' : '0';
  if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
  if (Buffer.isBuffer(val)) return `0x${val.toString('hex')}`;
  if (typeof val === 'object') {
    val = JSON.stringify(val);
  }

  // Escape string
  const str = String(val)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\0/g, '\\0')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\x1a/g, '\\Z');
  return `'${str}'`;
}

/**
 * Attempts to backup database using system mysqldump binary.
 */
function backupWithMysqldump(dbConfig, dbName, targetGzPath) {
  return new Promise((resolve, reject) => {
    const args = [
      `--host=${dbConfig.host}`,
      `--port=${dbConfig.port}`,
      `--user=${dbConfig.user}`,
      `--single-transaction`,
      `--quick`,
      `--lock-tables=false`
    ];

    if (dbConfig.password) {
      args.push(`--password=${dbConfig.password}`);
    }

    args.push(dbName);

    const mysqldumpProcess = spawn('mysqldump', args, {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    const gzip = zlib.createGzip();
    const writeStream = fs.createWriteStream(targetGzPath);

    let stderrData = '';
    mysqldumpProcess.stderr.on('data', (chunk) => {
      stderrData += chunk.toString();
    });

    mysqldumpProcess.on('error', (err) => {
      reject(err);
    });

    mysqldumpProcess.on('close', (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        reject(new Error(`mysqldump exited with code ${code}: ${stderrData}`));
      }
    });

    mysqldumpProcess.stdout.pipe(gzip).pipe(writeStream).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Native Node.js fallback exporter when mysqldump is missing or fails.
 */
async function backupWithNativeExporter(dbName, targetGzPath) {
  let connection;
  try {
    connection = await pool.getConnection();

    // Fetch all tables
    const [tables] = await connection.query('SHOW FULL TABLES WHERE Table_type = "BASE TABLE"');
    const tableNames = tables.map((t) => Object.values(t)[0]);

    async function* generateSqlStream() {
      yield `-- Kefta Talent Hunt Database Backup\n`;
      yield `-- Database: \`${dbName}\`\n`;
      yield `-- Backup Time: ${new Date().toISOString()}\n`;
      yield `-- Engine: Native Node.js MySQL Exporter\n\n`;
      yield `SET FOREIGN_KEY_CHECKS=0;\n\n`;

      for (const table of tableNames) {
        // Table Structure
        const [createRows] = await connection.query(`SHOW CREATE TABLE \`${table}\``);
        const createSql = createRows[0]['Create Table'] || createRows[0]['Create View'];
        yield `--\n-- Table structure for table \`${table}\`\n--\n`;
        yield `DROP TABLE IF EXISTS \`${table}\`;\n`;
        yield `${createSql};\n\n`;

        // Table Data
        yield `--\n-- Dumping data for table \`${table}\`\n--\n`;
        const [rows] = await connection.query(`SELECT * FROM \`${table}\``);
        
        if (rows.length > 0) {
          const columns = Object.keys(rows[0]).map((col) => `\`${col}\``).join(', ');
          
          // Batch insert statements into chunks of 200
          const chunkSize = 200;
          for (let i = 0; i < rows.length; i += chunkSize) {
            const chunk = rows.slice(i, i + chunkSize);
            const valuesSql = chunk.map((row) => {
              const vals = Object.values(row).map(escapeSqlValue).join(', ');
              return `(${vals})`;
            }).join(',\n');

            yield `INSERT INTO \`${table}\` (${columns}) VALUES\n${valuesSql};\n`;
          }
        }
        yield `\n`;
      }

      yield `SET FOREIGN_KEY_CHECKS=1;\n`;
      yield `-- Backup Completed --\n`;
    }

    const readStream = Readable.from(generateSqlStream());
    const gzip = zlib.createGzip();
    const writeStream = fs.createWriteStream(targetGzPath);

    await pipeline(readStream, gzip, writeStream);
    return true;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Creates a database backup file (.sql.gz) in the backups folder.
 */
export async function createDatabaseBackup() {
  const backupDir = getBackupDir();
  const dbName = process.env.DB_NAME || 'kefta_talent_hunt';
  const timestamp = getTimestampString();
  const filename = `backup_${dbName}_${timestamp}.sql.gz`;
  const filePath = path.join(backupDir, filename);

  const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  };

  let engine = 'mysqldump';
  let success = false;

  console.log(`[Backup Service] Starting backup for database '${dbName}'...`);

  // Attempt mysqldump first
  try {
    await backupWithMysqldump(dbConfig, dbName, filePath);
    success = true;
    console.log(`[Backup Service] Successfully created backup using mysqldump: ${filename}`);
  } catch (err) {
    console.warn(`[Backup Service] mysqldump failed or not available (${err.message}). Falling back to native exporter...`);
    // Clean up partial file if created
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) {}
    }
  }

  // Fallback to native Node.js exporter if mysqldump didn't succeed
  if (!success) {
    engine = 'native_js';
    await backupWithNativeExporter(dbName, filePath);
    console.log(`[Backup Service] Successfully created backup using native Node.js exporter: ${filename}`);
  }

  const stats = await fs.promises.stat(filePath);
  
  return {
    filename,
    filePath,
    sizeBytes: stats.size,
    createdAt: stats.birthtime || stats.mtime,
    engine
  };
}

/**
 * Helper to determine file time accurately from filename or file stats.
 */
function getFileTimestamp(file, stats) {
  const match = file.match(/(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2}-\d{2})/);
  if (match) {
    const datePart = match[1];
    const timePart = match[2].replace(/-/g, ':');
    const parsedTime = Date.parse(`${datePart}T${timePart}`);
    if (!isNaN(parsedTime)) return parsedTime;
  }
  return stats.mtimeMs || stats.birthtimeMs || Date.now();
}

/**
 * Deletes backup files older than retentionDays (default: 7 days).
 */
export async function cleanOldBackups(retentionDays = 7) {
  const backupDir = getBackupDir();
  const files = await fs.promises.readdir(backupDir);
  const now = Date.now();
  const cutoffTime = now - retentionDays * 24 * 60 * 60 * 1000;

  const deletedFiles = [];

  for (const file of files) {
    // Only target backup files
    if (!file.startsWith('backup_') || (!file.endsWith('.sql.gz') && !file.endsWith('.sql'))) {
      continue;
    }

    const filePath = path.join(backupDir, file);
    try {
      const stats = await fs.promises.stat(filePath);
      const fileTime = getFileTimestamp(file, stats);

      if (fileTime < cutoffTime) {
        await fs.promises.unlink(filePath);
        deletedFiles.push({
          filename: file,
          ageDays: Number(((now - fileTime) / (1000 * 60 * 60 * 24)).toFixed(1)),
          sizeBytes: stats.size
        });
        console.log(`[Backup Service] Deleted expired backup file (${file}) older than ${retentionDays} days.`);
      }
    } catch (err) {
      console.error(`[Backup Service] Error inspecting/deleting backup file ${file}:`, err.message);
    }
  }

  return {
    retentionDays,
    deletedCount: deletedFiles.length,
    deletedFiles
  };
}

/**
 * Lists all existing database backup files.
 */
export async function listBackups() {
  const backupDir = getBackupDir();
  const files = await fs.promises.readdir(backupDir);
  const now = Date.now();

  const backupList = [];

  for (const file of files) {
    if (!file.startsWith('backup_') || (!file.endsWith('.sql.gz') && !file.endsWith('.sql'))) {
      continue;
    }

    const filePath = path.join(backupDir, file);
    try {
      const stats = await fs.promises.stat(filePath);
      const fileTime = getFileTimestamp(file, stats);
      const createdAt = new Date(fileTime).toISOString();
      const ageDays = Number(((now - fileTime) / (1000 * 60 * 60 * 24)).toFixed(2));

      backupList.push({
        filename: file,
        sizeBytes: stats.size,
        createdAt,
        ageDays
      });
    } catch (err) {
      console.error(`[Backup Service] Error reading stats for backup file ${file}:`, err.message);
    }
  }

  // Sort newest first
  backupList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return backupList;
}

/**
 * Deletes a single backup file by filename.
 */
export async function deleteBackup(filename) {
  // Prevent directory traversal attacks
  const safeFilename = path.basename(filename);
  if (safeFilename !== filename || !safeFilename.startsWith('backup_')) {
    throw new Error('Invalid backup filename');
  }

  const backupDir = getBackupDir();
  const filePath = path.join(backupDir, safeFilename);

  if (!fs.existsSync(filePath)) {
    throw new Error('Backup file not found');
  }

  await fs.promises.unlink(filePath);
  console.log(`[Backup Service] Manually deleted backup file: ${safeFilename}`);
  return true;
}
