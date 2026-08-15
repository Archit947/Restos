'use strict';

const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const env = require('../config/env');
const { badRequest } = require('../utils/apiResponse');

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_DOC_TYPES = ['application/pdf', 'application/msword', 'text/plain'];
const MAX_SIZE = env.UPLOAD.MAX_FILE_SIZE_MB * 1024 * 1024;

/**
 * Dynamic disk storage — files saved to uploads/<subPath>/<filename>
 */
function createStorage(subPath = '') {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const dest = path.resolve(env.UPLOAD.PATH, subPath);
      require('fs').mkdirSync(dest, { recursive: true });
      cb(null, dest);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
      cb(null, uniqueName);
    },
  });
}

/**
 * File filter for images only.
 */
function imageFilter(req, file, cb) {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only image files (JPEG, PNG, WebP, GIF) are allowed.'), false);
  }
}

/**
 * File filter for images and documents.
 */
function mediaFilter(req, file, cb) {
  if ([...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOC_TYPES].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Unsupported file type.'), false);
  }
}

/**
 * Upload middleware for restaurant logos.
 */
const uploadLogo = multer({
  storage: createStorage('logos'),
  limits: { fileSize: MAX_SIZE },
  fileFilter: imageFilter,
}).single('logo');

/**
 * Upload middleware for restaurant cover images.
 */
const uploadCover = multer({
  storage: createStorage('covers'),
  limits: { fileSize: MAX_SIZE },
  fileFilter: imageFilter,
}).single('cover_image');

/**
 * Upload middleware for template thumbnails.
 */
const uploadTemplateThumbnail = multer({
  storage: createStorage('templates'),
  limits: { fileSize: MAX_SIZE },
  fileFilter: imageFilter,
}).single('thumbnail');

/**
 * Generic media upload (images + docs) for CMS.
 */
const uploadMedia = (tenantId) => multer({
  storage: createStorage(`tenants/${tenantId}/media`),
  limits: { fileSize: MAX_SIZE },
  fileFilter: mediaFilter,
}).array('files', 10);

/**
 * Wrap multer in a promise with proper error handling.
 */
function handleUpload(uploadMiddleware) {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return badRequest(res, `File too large. Maximum size is ${env.UPLOAD.MAX_FILE_SIZE_MB}MB.`);
        }
        return badRequest(res, err.message || 'File upload error.');
      }
      if (err) {
        return badRequest(res, err.message || 'File upload failed.');
      }
      next();
    });
  };
}

module.exports = { uploadLogo, uploadCover, uploadTemplateThumbnail, uploadMedia, handleUpload, createStorage };
