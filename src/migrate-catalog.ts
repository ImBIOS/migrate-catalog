#!/usr/bin/env node
"use strict";

import fs from "fs/promises";
import { globSync } from "glob";
import path from "path";
import { fileURLToPath } from "url";
import yaml from "yaml";

// For consistency in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define interfaces for the types
interface CatalogMap {
  [key: string]: string;
}

interface CatalogsMap {
  [key: string]: CatalogMap;
}

interface PackageJson {
  name?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  [key: string]: any;
}

interface WorkspaceData {
  packages?: string[];
  catalog?: CatalogMap;
  catalogs?: CatalogsMap;
  [key: string]: any;
}

/**
 * Read and parse a YAML file
 * @param {string} filePath - Path to the YAML file
 * @returns {Promise<WorkspaceData>} Parsed YAML data
 */
async function readYamlFile(filePath: string): Promise<WorkspaceData> {
  const content = await fs.readFile(filePath, "utf8");
  return yaml.parse(content);
}

/**
 * Read and parse a JSON file
 * @param {string} filePath - Path to the JSON file
 * @returns {Promise<PackageJson>} Parsed JSON data
 */
async function readJsonFile(filePath: string): Promise<PackageJson> {
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content);
}

/**
 * Write a JSON object to a file
 * @param {string} filePath - Path to write the JSON file
 * @param {PackageJson} data - Data to write
 * @returns {Promise<void>}
 */
async function writeJsonFile(
  filePath: string,
  data: PackageJson
): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

/**
 * Find package.json files in the workspace
 * @param {string} pattern - Glob pattern to match
 * @param {Object} options - Options for glob
 * @returns {Promise<string[]>} Array of file paths
 */
async function findPackageFiles(
  pattern: string = "**/package.json",
  options: { ignore: string | string[] } = { ignore: "**/node_modules/**" }
): Promise<string[]> {
  // Using globSync since we've imported globSync directly
  return globSync(pattern, options);
}

/**
 * Update a package.json file with catalog versions
 * @param {string} filePath - Path to package.json
 * @param {CatalogMap} catalog - Main catalog object
 * @param {CatalogsMap} catalogs - Named catalogs object
 * @returns {Promise<boolean>} Whether the file was updated
 */
async function updatePackageFile(
  filePath: string,
  catalog: CatalogMap = {},
  catalogs: CatalogsMap = {}
): Promise<boolean> {
  let pkgJson: PackageJson;
  try {
    pkgJson = await readJsonFile(filePath);
  } catch (err) {
    console.warn(`Skipping ${filePath} (invalid JSON)`);
    return false;
  }

  let updated = false;
  const depSections = [
    "dependencies",
    "devDependencies",
    "peerDependencies",
    "optionalDependencies",
  ] as const;

  for (const section of depSections) {
    if (pkgJson[section]) {
      for (const [dep, version] of Object.entries(pkgJson[section] || {})) {
        if (typeof version === "string" && version.startsWith("catalog:")) {
          const catalogRef = version.slice("catalog:".length).trim();
          let newVersion: string | null = null;

          if (catalogRef === "") {
            // Top-level catalog
            newVersion = catalog[dep];
            if (!newVersion) {
              console.warn(
                `Top-level catalog: No entry for "${dep}" in ${filePath}`
              );
            }
          } else {
            // Named catalog from catalogs
            if (catalogs[catalogRef]) {
              newVersion = catalogs[catalogRef][dep];
              if (!newVersion) {
                console.warn(
                  `Catalog "${catalogRef}": No entry for "${dep}" in ${filePath}`
                );
              }
            } else {
              console.warn(
                `Catalog "${catalogRef}" not found in pnpm-workspace.yaml for ${filePath}`
              );
            }
          }

          if (newVersion) {
            if (pkgJson[section]) {
              pkgJson[section]![dep] = newVersion;
            }
            console.log(`Updated "${dep}" in ${filePath} to "${newVersion}"`);
            updated = true;
          }
        }
      }
    }
  }

  if (updated) {
    await writeJsonFile(filePath, pkgJson);
  }

  return updated;
}

/**
 * Main function to migrate catalog versions to package.json files
 * @param {string} workspacePath - Path to workspace file
 * @returns {Promise<void>}
 */
async function migrateCatalog(
  workspacePath: string = path.join(process.cwd(), "pnpm-workspace.yaml")
): Promise<void> {
  // Read and parse the pnpm-workspace.yaml file
  const workspaceData = await readYamlFile(workspacePath);

  const catalog = workspaceData.catalog || {};
  const catalogs = workspaceData.catalogs || {};

  // Find all package.json files (excluding node_modules)
  const pkgFiles = await findPackageFiles();

  for (const pkgFile of pkgFiles) {
    const fullPath = path.resolve(pkgFile);
    await updatePackageFile(fullPath, catalog, catalogs);
  }
}

function main(): void {
  migrateCatalog().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

// Run main function if this file is executed directly
if (
  typeof process !== "undefined" &&
  process.argv &&
  import.meta.url === `file://${process.argv[1]}`
) {
  main();
}

// Export functions for testing
export {
  findPackageFiles,
  migrateCatalog,
  readJsonFile,
  readYamlFile,
  updatePackageFile,
  writeJsonFile,
};
