'use strict';

/**
 * Upload middleware — Supabase Storage backend.
 *
 * Replaces multer diskStorage with a custom engine that streams files directly
 * to Supabase Storage and attaches req.file.publicUrl (full HTTPS URL) to each
 * uploaded file. Routes store publicUrl in the DB; no local disk writes occur.
 *
 * Exported API is backward-compatible with the old diskStorage version except
 * that req.file.filename now equals just the generated filename, while
 * req.file.publicUrl is the full Supabase CDN URL that should be stored in DB.
 */

const multer  = require('multer');
const path    = require('path');
const crypto  = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const env     = require('../config/env');
const { badRequest } = require('../utils/apiResponse');

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_DOC_TYPES   = ['application/pdf', 'application/msword', 'text/plain'];
const MAX_SIZE            = env.UPLOAD.MAX_FILE_SIZE_MB * 1024 * 1024;

// ── Supabase client (lazy) ────────────────────────────────────────────────────
let _supabase;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(env.SUPABASE.URL, env.SUPABASE.SERVICE_KEY);
  }
  return _supabase;
}

// ── Custom multer storage engine → Supabase ───────────────────────────────────
class SupabaseStorage {
  constructor(folder = '') {
    this.folder = folder;
  }

  _handleFile(req, file, cb) {
    const chunks = [];
    file.stream.on('data',  chunk => chunks.push(chunk));
    file.stream.on('error', cb);
    file.stream.on('end', async () => {
      try {
        const buffer   = Buffer.concat(chunks);
        const ext      = path.extname(file.originalname).toLowerCase() || '.bin';
        const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
        const filePath = this.folder ? `${this.folder}/${filename}` : filename;

        const supabase = getSupabase();
        const { error } = await supabase.storage
          .from(env.SUPABASE.BUCKET)
          .upload(filePath, buffer, { contentType: file.mimetype, upsert: false });

        if (error) return cb(new Error(`Supabase storage error: ${error.message}`));

        const { data } = supabase.storage
          .from(env.SUPABASE.BUCKET)
          .getPublicUrl(filePath);

        cb(null, { filename, path: filePath, size: buffer.length, publicUrl: data.publicUrl });
      } catch (err) {
        cb(err);
      }
    });
  }

  _removeFile(req, file, cb) {
    // Optionally delete from Supabase on error — no-op for now
    cb(null);
  }
}

// ── createStorage: drop-in replacement ───────────────────────────────────────
function createStorage(folder = '') {
  return new SupabaseStorage(folder);
}

// ── File filters ──────────────────────────────────────────────────────────────
function imageFilter(req, file, cb) {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) cb(null, true);
  else cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only image files (JPEG, PNG, WebP, GIF) are allowed.'), false);
}

function mediaFilter(req, file, cb) {
  if ([...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOC_TYPES].includes(file.mimetype)) cb(null, true);
  else cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Unsupported file type.'), false);
}

// ── Pre-built middleware instances (used by auth, templates) ──────────────────
const uploadLogo = multer({
  storage: createStorage('logos'),
  limits: { fileSize: MAX_SIZE },
  fileFilter: imageFilter,
}).single('logo');

const uploadCover = multer({
  storage: createStorage('covers'),
  limits: { fileSize: MAX_SIZE },
  fileFilter: imageFilter,
}).single('cover_image');

const uploadTemplateThumbnail = multer({
  storage: createStorage('templates'),
  limits: { fileSize: MAX_SIZE },
  fileFilter: imageFilter,
}).single('thumbnail');

const uploadMedia = (tenantId) => multer({
  storage: createStorage(`tenants/${tenantId}/media`),
  limits: { fileSize: MAX_SIZE },
  fileFilter: mediaFilter,
}).array('files', 10);

// ── Error-handling wrapper ────────────────────────────────────────────────────
function handleUpload(uploadMiddleware) {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return err.code === 'LIMIT_FILE_SIZE'
          ? badRequest(res, `File too large. Maximum size is ${env.UPLOAD.MAX_FILE_SIZE_MB}MB.`)
          : badRequest(res, err.message || 'File upload error.');
      }
      if (err) return badRequest(res, err.message || 'File upload failed.');
      next();
    });
  };
}

module.exports = {
  createStorage,
  uploadLogo,
  uploadCover,
  uploadTemplateThumbnail,
  uploadMedia,
  handleUpload,
};
