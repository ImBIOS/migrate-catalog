import { readJsonFile, writeJsonFile } from "./io.js";
import type { CatalogMap, CatalogsMap, PackageJson } from "./types.js";

export async function updatePackageFile(
  filePath: string,
  catalog: CatalogMap = {},
  catalogs: CatalogsMap = {},
  dryRun = false
): Promise<boolean> {
  let pkgJson: PackageJson;
  try {
    pkgJson = await readJsonFile(filePath);
    console.log("Package JSON before update:", JSON.stringify(pkgJson, null, 2));
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
    console.log("Writing updated package.json:", JSON.stringify(pkgJson, null, 2));
    await writeJsonFile(filePath, pkgJson);
  } else {
    console.log(`No updates needed for ${filePath}`);
  }

  return updated;
}


