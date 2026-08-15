'use strict';
/**
 * Seed: insert the Pearl website template row into website_templates.
 * Run once: node src/scripts/addPearlTemplate.js
 */

require('dotenv').config();
const { query, queryOne } = require('../config/database');

async function run() {
  // Check if it already exists
  const existing = await queryOne(
    "SELECT id FROM website_templates WHERE slug = 'pearl'",
    []
  );

  if (existing) {
    console.log('✅ Pearl template already exists (id:', existing.id, ')— nothing to do.');
    process.exit(0);
  }

  const [result] = await query(
    `INSERT INTO website_templates
       (name, slug, description, thumbnail, category, version, is_active, is_default, config, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'Pearl',
      'pearl',
      'Premium light editorial theme with optional video hero. Warm cream palette, Cormorant Garamond typography, terracotta accents.',
      null,                // no thumbnail image yet
      'luxury',
      '1.0.0',
      1,                  // active
      0,                  // not default
      JSON.stringify({
        primaryColor: '#b5673d',
        secondaryColor: '#d4a574',
        fontFamily: 'Cormorant Garamond',
        supportsVideo: true,
      }),
      null,               // system seed — no user id
    ]
  );

  console.log('✅ Pearl template inserted with id:', result.insertId);
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
