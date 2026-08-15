import { Router, Request } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../config';
import { 
  getWebsiteConfig, 
  updateWebsiteConfig, 
  togglePublishStatus,
  uploadWebsiteImage,
  updateCmsContent,
  togglePageVisibility,
} from './website.controller';

const router = Router();

// ── File upload config ───────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => cb(null, config.storage.uploadDir),
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: config.storage.maxFileSize },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

router.get('/', getWebsiteConfig);
router.put('/', updateWebsiteConfig);
router.post('/publish', togglePublishStatus);

// Image uploads
router.post('/upload-logo', upload.single('image'), uploadWebsiteImage('logo'));
router.post('/upload-cover', upload.single('image'), uploadWebsiteImage('cover'));

// CMS content (contact info, hours, social links)
router.put('/cms', updateCmsContent);

// Page visibility toggle
router.patch('/pages/:pageId/toggle', togglePageVisibility);

export { router as websiteRoutes };
