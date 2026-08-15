import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { query, execute } from './connection';
import { config } from '../config';
import { logger } from '../config/logger';

/**
 * Seed initial data: Super Admin + Default Template
 */
async function seed(): Promise<void> {
  logger.info('🌱 Seeding initial data...');

  // 1. Super Admin
  const existingAdmin = await query(
    'SELECT id FROM super_admins WHERE email = ?',
    [config.admin.email]
  );

  if (existingAdmin.length === 0) {
    const passwordHash = await bcrypt.hash(config.admin.password, 12);
    const adminId = uuidv4();
    await execute(
      `INSERT INTO super_admins (id, name, email, password_hash, role)
       VALUES (?, ?, ?, ?, 'super_admin')`,
      [adminId, 'Super Admin', config.admin.email, passwordHash]
    );
    logger.info(`✅ Super Admin created: ${config.admin.email}`);
  } else {
    logger.info('⏩ Super Admin already exists, skipping');
  }

  // 2. Default Template
  const existingTemplate = await query(
    'SELECT id FROM templates WHERE slug = ?',
    ['classic-restaurant']
  );

  if (existingTemplate.length === 0) {
    await execute(
      `INSERT INTO templates (id, name, slug, description, category, version, is_active, is_default, config_json)
       VALUES (?, ?, ?, ?, ?, ?, TRUE, TRUE, ?)`,
      [
        uuidv4(),
        'Classic Restaurant',
        'classic-restaurant',
        'A clean, modern template perfect for any restaurant',
        'general',
        '1.0.0',
        JSON.stringify({
          primaryColor: '#6366f1',
          secondaryColor: '#8b5cf6',
          fontFamily: 'Inter',
          headerStyle: 'centered',
          footerStyle: 'minimal',
        }),
      ]
    );
    logger.info('✅ Default template seeded');
  }

  logger.info('🌱 Seeding complete!');
}

// Import connection
import './connection';

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error(err);
    process.exit(1);
  });
