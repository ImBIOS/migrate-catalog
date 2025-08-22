import path from "node:path";
import { findPackageFiles } from "./find.js";
import { readYamlFile } from "./io.js";
import { updatePackageFile } from "./update.js";

export async function migrateCatalog(
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

  const workspaceData = await readYamlFile(workspacePath);
  const catalog = workspaceData.catalog ?? {};
  const catalogs = workspaceData.catalogs ?? {};
  const pkgFiles = findPackageFiles(pattern);

  if (pkgFiles.length > 0) {
    console.log("Found package files:", pkgFiles);
  }

  for (const pkgFile of pkgFiles) {
    const fullPath = path.resolve(pkgFile);
    console.log(`Processing: ${fullPath}`);
    await updatePackageFile(fullPath, catalog, catalogs, dryRun);
  }
}


