/**
 * Database Setup Script
 * Runs schema.sql to create tables, then seeds data via seed.js
 *
 * Usage:
 *   node db/setup.js          # Create tables + seed
 *   node db/setup.js --reset  # Drop + recreate + seed
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { query, end } from './connection.js';
import { seed } from './seed.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function setup() {
  const isReset = process.argv.includes('--reset');

  try {
    console.log(`\n${'='.repeat(60)}`);
    console.log('  Prior Authorization System - Database Setup');
    console.log(`${'='.repeat(60)}\n`);

    // Run schema
    const schemaPath = join(__dirname, 'schema.sql');
    const schemaSql = readFileSync(schemaPath, 'utf-8');

    console.log(isReset ? 'Resetting database (drop + recreate)...' : 'Creating tables...');
    await query(schemaSql);
    console.log('Schema applied successfully.\n');

    // Seed data
    await seed();

    // Verify counts
    console.log('\nVerification:');
    const tables = ['members', 'claims', 'coverage_policies', 'prior_auth_requests', 'workflow_steps', 'trace_logs'];
    for (const table of tables) {
      const result = await query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`  ${table}: ${result.rows[0].count} rows`);
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('  Setup complete!');
    console.log(`${'='.repeat(60)}\n`);
  } catch (err) {
    console.error('Setup failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await end();
  }
}

setup();
