#!/usr/bin/env node

/**
 * Validates docs/data/clients.json against the MCP Client Registry schema.
 *
 * Usage: node scripts/validate-clients.js [path-to-clients.json]
 *
 * If no path is provided, validates docs/data/clients.json by default.
 *
 * Exit codes:
 *   0 - Validation passed
 *   1 - Validation failed or file not found
 *
 * Dependencies:
 *   npm install ajv ajv-formats
 */

import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');

// Load schema
const schemaPath = join(ROOT_DIR, 'docs', 'schemas', 'client-registry.json');
if (!existsSync(schemaPath)) {
  console.error(`Error: Schema not found: ${schemaPath}`);
  process.exit(1);
}
const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));

// Determine data file path
const dataPath = process.argv[2] || join(ROOT_DIR, 'docs', 'data', 'clients.json');

if (!existsSync(dataPath)) {
  console.error(`Error: Data file not found: ${dataPath}`);
  console.error('Please create the clients.json file first.');
  process.exit(1);
}

// Load data
const data = JSON.parse(readFileSync(dataPath, 'utf-8'));

// Create validator with format support (using 2020-12 draft)
const ajv = new Ajv2020({
  allErrors: true,
  strict: false,  // Allow additional keywords
  allowUnionTypes: true  // For oneOf patterns
});
addFormats(ajv);

// Compile and validate
const validate = ajv.compile(schema);
const valid = validate(data);

if (valid) {
  const clientCount = Object.keys(data).length;
  console.log(`Validation passed. ${clientCount} clients validated.`);

  // Print summary statistics
  const stats = {
    categories: {},
    capabilities: {
      tools: 0,
      resources: 0,
      prompts: 0,
      sampling: 0,
      elicitation: 0,
      roots: 0,
      completions: 0,
      logging: 0,
      instructions: 0,
      tasks: 0
    },
    transports: {
      stdio: 0,
      sse: 0,
      streamableHttp: 0
    }
  };

  for (const [id, client] of Object.entries(data)) {
    // Count categories
    const category = client.category || 'other';
    stats.categories[category] = (stats.categories[category] || 0) + 1;

    // Count capabilities
    if (client.tools) stats.capabilities.tools++;
    if (client.resources) stats.capabilities.resources++;
    if (client.prompts) stats.capabilities.prompts++;
    if (client.sampling) stats.capabilities.sampling++;
    if (client.elicitation) stats.capabilities.elicitation++;
    if (client.roots) stats.capabilities.roots++;
    if (client.completions) stats.capabilities.completions++;
    if (client.logging) stats.capabilities.logging++;
    if (client.instructions) stats.capabilities.instructions++;
    if (client.tasks) stats.capabilities.tasks++;

    // Count transports
    if (client.transports?.stdio) stats.transports.stdio++;
    if (client.transports?.sse) stats.transports.sse++;
    if (client.transports?.streamableHttp) stats.transports.streamableHttp++;
  }

  console.log('\n--- Summary ---\n');

  console.log('Capabilities:');
  for (const [cap, count] of Object.entries(stats.capabilities)) {
    const pct = Math.round((count / clientCount) * 100);
    const bar = '='.repeat(Math.round(pct / 5)) + ' '.repeat(20 - Math.round(pct / 5));
    console.log(`  ${cap.padEnd(14)} [${bar}] ${count}/${clientCount} (${pct}%)`);
  }

  console.log('\nTransports:');
  for (const [transport, count] of Object.entries(stats.transports)) {
    const pct = Math.round((count / clientCount) * 100);
    console.log(`  ${transport.padEnd(14)} ${count}/${clientCount} (${pct}%)`);
  }

  console.log('\nCategories:');
  for (const [cat, count] of Object.entries(stats.categories).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat.padEnd(18)} ${count}`);
  }

  process.exit(0);
} else {
  console.error('Validation failed:\n');
  for (const error of validate.errors) {
    const path = error.instancePath || '(root)';
    console.error(`  ${path}: ${error.message}`);
    if (error.params) {
      console.error(`    params: ${JSON.stringify(error.params)}`);
    }
  }
  process.exit(1);
}
