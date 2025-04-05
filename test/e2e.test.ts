import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";
import { promisify } from "util";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PackageJson } from "../src/migrate-catalog";

const execAsync = promisify(exec);

// Test directory paths
const testDir = path.join(process.cwd(), "test");
const monorepoDir = path.join(testDir, "fixtures", "monorepo");
const backupDir = path.join(testDir, "fixtures", "monorepo_backup");
const cliPath = path.join(process.cwd(), "dist", "migrate-catalog.js");

// Create monorepo structure with catalog features
async function setupMonorepo(): Promise<void> {
  // Create fixtures directory
  await fs.mkdir(path.join(testDir, "fixtures"), { recursive: true });

  // Create monorepo structure
  await fs.mkdir(monorepoDir, { recursive: true });
  await fs.mkdir(path.join(monorepoDir, "apps", "nextjs"), { recursive: true });
  await fs.mkdir(path.join(monorepoDir, "packages", "ui"), { recursive: true });
  await fs.mkdir(path.join(monorepoDir, "tooling", "eslint"), {
    recursive: true,
  });

  // Create pnpm-workspace.yaml with catalog
  const workspaceYaml = `packages:
  - apps/*
  - packages/*
  - tooling/*

catalog:
  # Auth
  "@auth/core": 0.37.2
  "@auth/drizzle-adapter": ~1.7.4
  "next-auth": 5.0.0-beta.25

  # Dev tooling
  eslint: ^9.23.0
  prettier: ^3.5.3
  tailwindcss: ^3.4.15
  typescript: ^5.8.2

  # Misc
  zod: ^3.24.2

  # Tanstack & tRPC
  "@tanstack/react-query": ^5.69.0
  "@trpc/client": ^11.0.0
  "@trpc/tanstack-react-query": ^11.0.0
  "@trpc/server": ^11.0.0

catalogs:
  react19:
    react: 19.0.0
    react-dom: 19.0.0
    "@types/react": ^19.0.12
    "@types/react-dom": ^19.0.4
`;

  await fs.writeFile(
    path.join(monorepoDir, "pnpm-workspace.yaml"),
    workspaceYaml
  );

  // Create package.json for root
  const rootPackageJson = {
    name: "test-monorepo",
    version: "1.0.0",
    private: true,
    workspaces: ["apps/*", "packages/*", "tooling/*"],
    devDependencies: {
      typescript: "catalog:",
      eslint: "catalog:",
      prettier: "catalog:",
    },
  };

  await fs.writeFile(
    path.join(monorepoDir, "package.json"),
    JSON.stringify(rootPackageJson, null, 2) + "\n"
  );

  // Create package.json for nextjs app
  const nextjsPackageJson = {
    name: "@test/nextjs",
    version: "0.1.0",
    private: true,
    type: "module",
    scripts: {
      build: "next build",
      dev: "next dev",
      start: "next start",
    },
    dependencies: {
      "@test/ui": "workspace:*",
      "@tanstack/react-query": "catalog:",
      "@trpc/client": "catalog:",
      "@trpc/server": "catalog:",
      "@trpc/tanstack-react-query": "catalog:",
      next: "^15.2.3",
      react: "catalog:react19",
      "react-dom": "catalog:react19",
      zod: "catalog:",
    },
    devDependencies: {
      "@types/react": "catalog:react19",
      "@types/react-dom": "catalog:react19",
      eslint: "catalog:",
      prettier: "catalog:",
      tailwindcss: "catalog:",
      typescript: "catalog:",
    },
  };

  await fs.writeFile(
    path.join(monorepoDir, "apps", "nextjs", "package.json"),
    JSON.stringify(nextjsPackageJson, null, 2) + "\n"
  );

  // Create package.json for UI package
  const uiPackageJson = {
    name: "@test/ui",
    version: "0.1.0",
    private: true,
    main: "index.ts",
    dependencies: {
      react: "catalog:react19",
      "react-dom": "catalog:react19",
    },
    devDependencies: {
      "@types/react": "catalog:react19",
      "@types/react-dom": "catalog:react19",
      typescript: "catalog:",
      tailwindcss: "catalog:",
    },
  };

  await fs.writeFile(
    path.join(monorepoDir, "packages", "ui", "package.json"),
    JSON.stringify(uiPackageJson, null, 2) + "\n"
  );

  // Create package.json for eslint config
  const eslintPackageJson = {
    name: "@test/eslint-config",
    version: "0.1.0",
    private: true,
    main: "index.js",
    dependencies: {
      eslint: "catalog:",
    },
    devDependencies: {
      typescript: "catalog:",
    },
  };

  await fs.writeFile(
    path.join(monorepoDir, "tooling", "eslint", "package.json"),
    JSON.stringify(eslintPackageJson, null, 2) + "\n"
  );
}

// Backup monorepo for restoration
async function backupMonorepo(): Promise<void> {
  await fs.cp(monorepoDir, backupDir, { recursive: true });
}

// Restore monorepo from backup
async function restoreMonorepo(): Promise<void> {
  await fs.rm(monorepoDir, { recursive: true, force: true });
  await fs.cp(backupDir, monorepoDir, { recursive: true });
}

// Cleanup all test directories
async function cleanupTestDirectories(): Promise<void> {
  await fs.rm(path.join(testDir, "fixtures"), { recursive: true, force: true });
}

// Take a snapshot of package.json files
async function takePackageJsonSnapshot(): Promise<Record<string, PackageJson>> {
  const rootPkg = JSON.parse(
    await fs.readFile(path.join(monorepoDir, "package.json"), "utf8")
  ) as PackageJson;

  const nextjsPkg = JSON.parse(
    await fs.readFile(
      path.join(monorepoDir, "apps", "nextjs", "package.json"),
      "utf8"
    )
  ) as PackageJson;

  const uiPkg = JSON.parse(
    await fs.readFile(
      path.join(monorepoDir, "packages", "ui", "package.json"),
      "utf8"
    )
  ) as PackageJson;

  const eslintPkg = JSON.parse(
    await fs.readFile(
      path.join(monorepoDir, "tooling", "eslint", "package.json"),
      "utf8"
    )
  ) as PackageJson;

  return {
    root: rootPkg,
    nextjs: nextjsPkg,
    ui: uiPkg,
    eslint: eslintPkg,
  };
}

describe("migrate-catalog e2e test", () => {
  beforeAll(async () => {
    // Build the project
    await execAsync("npm run build");

    // Setup test monorepo
    await setupMonorepo();

    // Backup monorepo for later restoration
    await backupMonorepo();
  }, 30000); // Increase timeout to 30 seconds for build process

  afterAll(async () => {
    // Clean up test directories
    await cleanupTestDirectories();
  });

  it("should correctly migrate catalog versions to package.json files", async () => {
    // Run the migrate-catalog command on the test monorepo
    await execAsync(`node ${cliPath}`, {
      cwd: monorepoDir,
    });

    // Take snapshot of package.json files after migration
    const snapshot = await takePackageJsonSnapshot();

    // Verify root package.json
    expect(snapshot.root.devDependencies).toEqual({
      typescript: "^5.8.2",
      eslint: "^9.23.0",
      prettier: "^3.5.3",
    });

    // Verify nextjs package.json
    expect(snapshot.nextjs.dependencies).toMatchObject({
      "@tanstack/react-query": "^5.69.0",
      "@trpc/client": "^11.0.0",
      "@trpc/server": "^11.0.0",
      "@trpc/tanstack-react-query": "^11.0.0",
      react: "19.0.0",
      "react-dom": "19.0.0",
      zod: "^3.24.2",
    });

    expect(snapshot.nextjs.devDependencies).toMatchObject({
      "@types/react": "^19.0.12",
      "@types/react-dom": "^19.0.4",
      eslint: "^9.23.0",
      prettier: "^3.5.3",
      tailwindcss: "^3.4.15",
      typescript: "^5.8.2",
    });

    // Verify UI package.json
    expect(snapshot.ui.dependencies).toEqual({
      react: "19.0.0",
      "react-dom": "19.0.0",
    });

    expect(snapshot.ui.devDependencies).toEqual({
      "@types/react": "^19.0.12",
      "@types/react-dom": "^19.0.4",
      typescript: "^5.8.2",
      tailwindcss: "^3.4.15",
    });

    // Verify eslint config package.json
    expect(snapshot.eslint.dependencies).toEqual({
      eslint: "^9.23.0",
    });

    expect(snapshot.eslint.devDependencies).toEqual({
      typescript: "^5.8.2",
    });

    // Restore monorepo from backup for next tests
    await restoreMonorepo();
  });

  it("should handle non-existing catalog entries gracefully", async () => {
    // Modify nextjs package.json to include a non-existent catalog entry
    const nextjsPkgPath = path.join(
      monorepoDir,
      "apps",
      "nextjs",
      "package.json"
    );
    const nextjsPkg = JSON.parse(
      await fs.readFile(nextjsPkgPath, "utf8")
    ) as PackageJson;
    // Add a dependency with a non-existent catalog reference
    nextjsPkg.dependencies = nextjsPkg.dependencies ?? {};
    nextjsPkg.dependencies["non-existent-pkg"] = "catalog:";

    // Add a dependency with a non-existent named catalog
    nextjsPkg.dependencies["another-pkg"] = "catalog:non-existent-catalog";

    await fs.writeFile(
      nextjsPkgPath,
      JSON.stringify(nextjsPkg, null, 2) + "\n"
    );

    // Run the migrate-catalog command
    const { stdout, stderr } = await execAsync(`node ${cliPath}`, {
      cwd: monorepoDir,
    });

    // Verify the package.json still has the correct catalog entries migrated
    const updatedPkg = JSON.parse(
      await fs.readFile(nextjsPkgPath, "utf8")
    ) as PackageJson;

    expect(updatedPkg.dependencies?.["@tanstack/react-query"]).toBe("^5.69.0");
    expect(updatedPkg.dependencies?.["non-existent-pkg"]).toBe("catalog:");
    expect(updatedPkg.dependencies?.["another-pkg"]).toBe(
      "catalog:non-existent-catalog"
    );

    // We need to check that the warnings were printed, but we don't
    // need to check exact message format as it might change
    const combinedOutput = stdout + stderr;
    expect(combinedOutput).toMatch(/No entry for.*non-existent-pkg/);
    expect(combinedOutput).toMatch(/Catalog.*non-existent-catalog.*not found/);

    // Restore monorepo from backup
    await restoreMonorepo();
  });

  it("should handle a custom workspace yaml path", async () => {
    // Create a custom workspace yaml file in a different location
    const customWorkspacePath = path.join(monorepoDir, "custom-workspace.yaml");

    // Copy the existing workspace yaml to the custom location
    await fs.copyFile(
      path.join(monorepoDir, "pnpm-workspace.yaml"),
      customWorkspacePath
    );

    // Run the migrate-catalog command with custom workspace path
    await execAsync(`node ${cliPath} --workspace ${customWorkspacePath}`, {
      cwd: monorepoDir,
    });

    // Take a snapshot after migration
    const afterSnapshot = await takePackageJsonSnapshot();

    // Verify that the migration occurred properly with the custom workspace file
    expect(afterSnapshot.root.devDependencies).toEqual({
      typescript: "^5.8.2",
      eslint: "^9.23.0",
      prettier: "^3.5.3",
    });

    expect(afterSnapshot.nextjs.dependencies?.["@tanstack/react-query"]).toBe(
      "^5.69.0"
    );

    // Restore monorepo from backup
    await restoreMonorepo();
  });

  it("should only process specified package patterns", async () => {
    // Run the migrate-catalog command with a pattern that only targets the UI package
    await execAsync(`node ${cliPath} --pattern "packages/ui/package.json"`, {
      cwd: monorepoDir,
    });

    // Take snapshot of package.json files after migration
    const snapshot = await takePackageJsonSnapshot();

    // UI package should be updated
    expect(snapshot.ui.dependencies).toEqual({
      react: "19.0.0",
      "react-dom": "19.0.0",
    });

    // Root and nextjs packages should still have catalog: references
    expect(snapshot.root.devDependencies?.typescript).toBe("catalog:");
    expect(snapshot.nextjs.dependencies?.zod).toBe("catalog:");
    expect(snapshot.eslint.dependencies?.eslint).toBe("catalog:");

    // Restore monorepo from backup
    await restoreMonorepo();
  });

  it("should support dry run mode without modifying files", async () => {
    // Run the migrate-catalog command in dry run mode
    const { stdout } = await execAsync(`node ${cliPath} --dry-run`, {
      cwd: monorepoDir,
    });

    // Take snapshot of package.json files after dry run
    const snapshot = await takePackageJsonSnapshot();

    // Verify that files still have catalog: references (not changed)
    expect(snapshot.root.devDependencies?.typescript).toBe("catalog:");
    expect(snapshot.nextjs.dependencies?.zod).toBe("catalog:");
    expect(snapshot.ui.dependencies?.react).toBe("catalog:react19");

    // But the output should show what would be updated
    expect(stdout).toContain("Would update");
    expect(stdout).toContain("typescript");
    expect(stdout).toContain("^5.8.2");

    // Restore monorepo from backup
    await restoreMonorepo();
  });
});
