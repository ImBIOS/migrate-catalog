#!/usr/bin/env node
"use strict";

import fs from "fs/promises";
import { globSync } from "glob";
import path from "path";
import yaml from "yaml";

// Define interfaces for the types
type CatalogMap = Record<string, string>;

type CatalogsMap = Record<string, CatalogMap>;

export type PackageJson = {
  name?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  [key: string]: unknown;
};

type WorkspaceData = {
  packages?: string[];
  catalog?: CatalogMap;
  catalogs?: CatalogsMap;
  [key: string]: unknown;
};

/**
 * Read and parse a YAML file
 * @param {string} filePath - Path to the YAML file
 * @returns {Promise<WorkspaceData>} Parsed YAML data
 */
async function readYamlFile(filePath: string): Promise<WorkspaceData> {
  const content = await fs.readFile(filePath, "utf8");
  return yaml.parse(content) as WorkspaceData;
}

/**
 * Read and parse a JSON file
 * @param {string} filePath - Path to the JSON file
 * @returns {Promise<PackageJson>} Parsed JSON data
 */
async function readJsonFile(filePath: string): Promise<PackageJson> {
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content) as PackageJson;
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
function findPackageFiles(
  pattern = "**/package.json",
  options: { ignore: string | string[] } = { ignore: "**/node_modules/**" }
): string[] {
  // Using globSync since we've imported globSync directly
  return globSync(pattern, options);
}

/**
 * Parse command line arguments
 * @returns {Object} Parsed arguments
 */
function parseArgs(): {
  workspace: string;
  pattern: string;
  dryRun: boolean;
} {
  const args = process.argv.slice(2);
  const result = {
    workspace: path.join(process.cwd(), "pnpm-workspace.yaml"),
    pattern: "**/package.json",
    dryRun: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--workspace" && i + 1 < args.length) {
      result.workspace = args[++i];
    } else if (arg === "--pattern" && i + 1 < args.length) {
      result.pattern = args[++i];
    } else if (arg === "--dry-run") {
      result.dryRun = true;
    }
  }

  return result;
}

/**
 * Update a package.json file with catalog versions
 * @param {string} filePath - Path to package.json
 * @param {CatalogMap} catalog - Main catalog object
 * @param {CatalogsMap} catalogs - Named catalogs object
 * @param {boolean} dryRun - Whether to perform a dry run (no file writes)
 * @returns {Promise<boolean>} Whether the file was updated
 */
async function updatePackageFile(
  filePath: string,
  catalog: CatalogMap = {},
  catalogs: CatalogsMap = {},
  dryRun = false
): Promise<boolean> {
  let pkgJson: PackageJson;
  try {
    pkgJson = await readJsonFile(filePath);
    console.log(
      `Package JSON before update:`,
      JSON.stringify(pkgJson, null, 2)
    );
  } catch (err) {
    console.warn(`Skipping ${filePath} (invalid JSON)`, err);
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
      console.log(`Processing section ${section} in ${filePath}`);
      for (const [dep, version] of Object.entries(pkgJson[section] || {})) {
        console.log(`Checking dependency: "${dep}" with version "${version}"`);
        if (typeof version === "string" && version.startsWith("catalog:")) {
          const catalogRef = version.slice("catalog:".length).trim();
          let newVersion: string | null = null;

          if (catalogRef === "") {
            // Top-level catalog
            newVersion = catalog[dep];
            console.log(
              `Looking up "${dep}" in top-level catalog. Result: ${
                newVersion || "not found"
              }`
            );
            if (!newVersion) {
              console.warn(
                `Top-level catalog: No entry for "${dep}" in ${filePath}`
              );
            }
          } else {
            // Named catalog from catalogs
            console.log(
              `Looking up "${dep}" in catalog "${catalogRef}". Catalog exists: ${Boolean(
                catalogs[catalogRef]
              )}`
            );
            if (catalogs[catalogRef]) {
              newVersion = catalogs[catalogRef][dep];
              console.log(
                `Result for "${dep}" in catalog "${catalogRef}": ${
                  newVersion || "not found"
                }`
              );
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
              if (dryRun) {
                console.log(
                  `Would update "${dep}" in ${filePath} to "${newVersion}"`
                );
              } else {
                pkgJson[section][dep] = newVersion;
                console.log(
                  `Updated "${dep}" in ${filePath} to "${newVersion}"`
                );
              }
              updated = true;
            }
          }
        }
      }
    }
  }

  if (updated && !dryRun) {
    console.log(
      `Writing updated package.json:`,
      JSON.stringify(pkgJson, null, 2)
    );
    await writeJsonFile(filePath, pkgJson);
  } else {
    console.log(`No updates needed for ${filePath}`);
  }

  return updated;
}

/**
 * Main function to migrate catalog versions to package.json files
 * @param {Object} options - Migration options
 * @returns {Promise<void>}
 */
async function migrateCatalog(
  options: {
    workspacePath?: string;
    pattern?: string;
    dryRun?: boolean;
  } = {}
): Promise<void> {
  const workspacePath =
    options.workspacePath ?? path.join(process.cwd(), "pnpm-workspace.yaml");
  const pattern = options.pattern ?? "**/package.json";
  const dryRun = options.dryRun ?? false;

  // Read and parse the pnpm-workspace.yaml file
  const workspaceData = await readYamlFile(workspacePath);

  const catalog = workspaceData.catalog ?? {};
  const catalogs = workspaceData.catalogs ?? {};

  // Find all package.json files (excluding node_modules)
  const pkgFiles = findPackageFiles(pattern);

  // If no package files are found, quietly exit without logging
  if (pkgFiles.length === 0) {
    return;
  }

  console.log(`Found package files:`, pkgFiles);

  for (const pkgFile of pkgFiles) {
    const fullPath = path.resolve(pkgFile);
    console.log(`Processing: ${fullPath}`);
    await updatePackageFile(fullPath, catalog, catalogs, dryRun);
  }
}

function main(): void {
  const args = parseArgs();

  migrateCatalog({
    workspacePath: args.workspace,
    pattern: args.pattern,
    dryRun: args.dryRun,
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

// Run main function if this file is executed directly
if (
  typeof process !== "undefined" &&
  process.argv &&
  (import.meta.url === `file://${process.argv[1]}` ||
    process.argv[1].endsWith("migrate-catalog"))
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
