#!/usr/bin/env node
'use strict';

const fs = require('fs/promises');
const path = require('path');
const { promisify } = require('util');
const glob = promisify(require('glob'));
const yaml = require('yaml');

async function main() {
  // Read and parse the pnpm-workspace.yaml file
  const workspacePath = path.join(process.cwd(), 'pnpm-workspace.yaml');
  const workspaceContent = await fs.readFile(workspacePath, 'utf8');
  const workspaceData = yaml.parse(workspaceContent);

  const catalog = workspaceData.catalog || {};
  const catalogs = workspaceData.catalogs || {};

  // Find all package.json files (excluding node_modules)
  const pkgFiles = await glob('**/package.json', {
    ignore: '**/node_modules/**'
  });

  for (const pkgFile of pkgFiles) {
    const fullPath = path.resolve(pkgFile);
    const fileContent = await fs.readFile(fullPath, 'utf8');
    let pkgJson;
    try {
      pkgJson = JSON.parse(fileContent);
    } catch (err) {
      console.warn(`Skipping ${fullPath} (invalid JSON)`);
      continue;
    }
    let updated = false;
    const depSections = [
      'dependencies',
      'devDependencies',
      'peerDependencies',
      'optionalDependencies'
    ];
    for (const section of depSections) {
      if (pkgJson[section]) {
        for (const [dep, version] of Object.entries(pkgJson[section])) {
          if (typeof version === 'string' && version.startsWith('catalog:')) {
            const catalogRef = version.slice('catalog:'.length).trim();
            let newVersion = null;
            if (catalogRef === '') {
              // Top-level catalog
              newVersion = catalog[dep];
              if (!newVersion) {
                console.warn(`Top-level catalog: No entry for "${dep}" in ${fullPath}`);
              }
            } else {
              // Named catalog from catalogs
              if (catalogs[catalogRef]) {
                newVersion = catalogs[catalogRef][dep];
                if (!newVersion) {
                  console.warn(`Catalog "${catalogRef}": No entry for "${dep}" in ${fullPath}`);
                }
              } else {
                console.warn(`Catalog "${catalogRef}" not found in pnpm-workspace.yaml for ${fullPath}`);
              }
            }
            if (newVersion) {
              pkgJson[section][dep] = newVersion;
              console.log(`Updated "${dep}" in ${fullPath} to "${newVersion}"`);
              updated = true;
            }
          }
        }
      }
    }
    if (updated) {
      await fs.writeFile(fullPath, JSON.stringify(pkgJson, null, 2) + '\n', 'utf8');
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
