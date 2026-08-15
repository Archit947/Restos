'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { query } = require('../config/database');

async function run() {
  console.log('🎨 Adding Pearl theme support...\n');

  try {
    await query(`ALTER TABLE restaurants ADD COLUMN hero_video_url VARCHAR(500) DEFAULT NULL`);
    console.log('✅ restaurants.hero_video_url column added');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️  restaurants.hero_video_url already exists — skipped');
    } else throw e;
  }

  console.log('\n🎉 Done!');
  process.exit(0);
}

run().catch((e) => { console.error('❌', e.message); process.exit(1); });
