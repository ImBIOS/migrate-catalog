#!/usr/bin/env node

import { parseArgs } from "./args.js";
import { findPackageFiles } from "./find.js";
import { readJsonFile, readYamlFile, writeJsonFile } from "./io.js";
import { migrateCatalog } from "./migrate.js";
import { updatePackageFile } from "./update.js";

export type {
  CatalogMap,
  CatalogsMap,
  PackageJson,
  WorkspaceData,
} from "./types.js";

export {
  findPackageFiles,
  migrateCatalog,
  readJsonFile,
  readYamlFile,
  updatePackageFile,
  writeJsonFile,
};

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

if (
  typeof process !== "undefined" &&
  process.argv &&
  (import.meta.url === `file://${process.argv[1]}` ||
    process.argv[1].endsWith("migrate-catalog"))
) {
  main();
}
