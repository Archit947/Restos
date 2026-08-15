'use strict';

const path = require('path');
const fs = require('fs');
const env = require('../config/env');

/**
 * Storage abstraction layer - currently local, future-ready for AWS S3.
 * All methods return public URLs accessible to clients.
 */

const STORAGE_DRIVER = process.env.STORAGE_DRIVER || 'local';

/**
 * Get the full public URL for a stored file.
 */
function getFileUrl(relativePath) {
  if (!relativePath) return null;
  if (relativePath.startsWith('http')) return relativePath;
  return `${env.UPLOAD.BASE_URL}/${relativePath.replace(/\\/g, '/')}`;
}

/**
 * Get the absolute file system path for a relative storage path.
 */
function getFilePath(relativePath) {
  return path.resolve(env.UPLOAD.PATH, relativePath);
}

/**
 * Ensure a directory exists, create if not.
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Delete a file from storage.
 * @param {string} relativePath - Relative path within the uploads directory
 */
async function deleteFile(relativePath) {
  if (!relativePath) return;
  try {
    const absPath = getFilePath(relativePath);
    if (fs.existsSync(absPath)) {
      fs.unlinkSync(absPath);
    }
  } catch (err) {
    // Log but don't throw - file deletion failure is not critical
    console.error(`Failed to delete file: ${relativePath}`, err.message);
  }
}

/**
 * Move a file from one location to another within storage.
 */
async function moveFile(sourcePath, destRelativePath) {
  const destAbsPath = getFilePath(destRelativePath);
  ensureDir(path.dirname(destAbsPath));
  fs.renameSync(sourcePath, destAbsPath);
  return getFileUrl(destRelativePath);
}

/**
 * Get storage directory for a specific tenant/type.
 */
function getTenantStoragePath(tenantId, type = 'media') {
  return path.join('tenants', tenantId, type);
}

/**
 * Calculate directory size in MB.
 */
function getDirSizeMB(dirPath) {
  let totalSize = 0;
  const absPath = path.resolve(env.UPLOAD.PATH, dirPath);
  if (!fs.existsSync(absPath)) return 0;

  function calcSize(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      if (stat.isDirectory()) {
        calcSize(itemPath);
      } else {
        totalSize += stat.size;
      }
    }
  }

  try {
    calcSize(absPath);
  } catch (_) {}
  return Math.round(totalSize / (1024 * 1024) * 100) / 100;
}

module.exports = {
  getFileUrl,
  getFilePath,
  ensureDir,
  deleteFile,
  moveFile,
  getTenantStoragePath,
  getDirSizeMB,
};
