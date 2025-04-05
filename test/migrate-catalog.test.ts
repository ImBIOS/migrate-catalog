import fs from "fs/promises";
import mockFs from "mock-fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import yaml from "yaml";

// Import functions to test
import {
  findPackageFiles,
  migrateCatalog,
  PackageJson,
  readJsonFile,
  readYamlFile,
  updatePackageFile,
  writeJsonFile,
} from "../src/migrate-catalog";

describe("migrate-catalog", () => {
  // Setup and teardown for each test
  beforeEach(() => {
    // Mock console methods
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    vi.spyOn(console, "log").mockImplementation(() => {});
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    vi.spyOn(console, "warn").mockImplementation(() => {});
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console methods and file system
    vi.restoreAllMocks();
    mockFs.restore();
  });

  describe("readYamlFile", () => {
    it("should correctly read and parse a YAML file", async () => {
      // Mock file system
      mockFs({
        "test-workspace.yaml": yaml.stringify({
          packages: ["packages/*"],
          catalog: {
            react: "18.2.0",
            "react-dom": "18.2.0",
          },
        }),
      });

      const result = await readYamlFile("test-workspace.yaml");

      expect(result).toEqual({
        packages: ["packages/*"],
        catalog: {
          react: "18.2.0",
          "react-dom": "18.2.0",
        },
      });
    });

    it("should throw error if file does not exist", async () => {
      mockFs({}); // Empty file system

      await expect(readYamlFile("non-existent-file.yaml")).rejects.toThrow();
    });
  });

  describe("readJsonFile", () => {
    it("should correctly read and parse a JSON file", async () => {
      mockFs({
        "package.json": JSON.stringify({
          name: "test-package",
          dependencies: {
            react: "catalog:",
          },
        }),
      });

      const result = await readJsonFile("package.json");

      expect(result).toEqual({
        name: "test-package",
        dependencies: {
          react: "catalog:",
        },
      });
    });

    it("should throw error if file does not exist", async () => {
      mockFs({});

      await expect(readJsonFile("non-existent-file.json")).rejects.toThrow();
    });
  });

  describe("writeJsonFile", () => {
    it("should correctly write a JSON file", async () => {
      mockFs({});

      const data = {
        name: "test-package",
        dependencies: {
          react: "18.2.0",
        },
      };

      await writeJsonFile("test-package.json", data);

      const fileContent = await fs.readFile("test-package.json", "utf8");
      const parsed = JSON.parse(fileContent) as PackageJson;

      expect(parsed).toEqual(data);
      expect(fileContent.endsWith("\n")).toBe(true);
    });
  });

  describe("findPackageFiles", () => {
    it("should find all package.json files excluding node_modules", () => {
      mockFs({
        "package.json": "{}",
        packages: {
          "package-a": {
            "package.json": "{}",
          },
          "package-b": {
            "package.json": "{}",
          },
        },
        node_modules: {
          "some-package": {
            "package.json": "{}",
          },
        },
      });

      const files = findPackageFiles();

      expect(files).toHaveLength(3);
      expect(files).toContain("package.json");
      expect(files).toContain("packages/package-a/package.json");
      expect(files).toContain("packages/package-b/package.json");
      expect(files).not.toContain("node_modules/some-package/package.json");
    });

    it("should respect custom pattern and options", () => {
      mockFs({
        "package.json": "{}",
        packages: {
          "package-a": {
            "package.json": "{}",
          },
        },
      });

      const files = findPackageFiles("packages/**/package.json");

      expect(files).toHaveLength(1);
      expect(files).toContain("packages/package-a/package.json");
      expect(files).not.toContain("package.json");
    });
  });

  describe("updatePackageFile", () => {
    it("should update package dependencies from top-level catalog", async () => {
      mockFs({
        "packages/package-a/package.json": JSON.stringify({
          name: "package-a",
          dependencies: {
            react: "catalog:",
            "react-dom": "catalog:",
            unchanged: "1.0.0",
          },
        }),
      });

      const catalog = {
        react: "18.2.0",
        "react-dom": "18.2.0",
      };

      const updated = await updatePackageFile(
        "packages/package-a/package.json",
        catalog
      );

      expect(updated).toBe(true);

      const result = await readJsonFile("packages/package-a/package.json");
      expect(result).toEqual({
        name: "package-a",
        dependencies: {
          react: "18.2.0",
          "react-dom": "18.2.0",
          unchanged: "1.0.0",
        },
      });

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Updated "react"')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Updated "react-dom"')
      );
    });

    it("should update package dependencies from named catalogs", async () => {
      mockFs({
        "packages/package-b/package.json": JSON.stringify({
          name: "package-b",
          dependencies: {
            react: "catalog:frontend",
            express: "catalog:backend",
          },
        }),
      });

      const catalog = {};
      const catalogs = {
        frontend: { react: "18.2.0" },
        backend: { express: "4.18.2" },
      };

      const updated = await updatePackageFile(
        "packages/package-b/package.json",
        catalog,
        catalogs
      );

      expect(updated).toBe(true);

      const result = await readJsonFile("packages/package-b/package.json");
      expect(result).toEqual({
        name: "package-b",
        dependencies: {
          react: "18.2.0",
          express: "4.18.2",
        },
      });
    });

    it("should handle all dependency sections", async () => {
      mockFs({
        "package.json": JSON.stringify({
          name: "package-c",
          dependencies: {
            react: "catalog:",
          },
          devDependencies: {
            jest: "catalog:",
          },
          peerDependencies: {
            "react-dom": "catalog:",
          },
          optionalDependencies: {
            lodash: "catalog:",
          },
        }),
      });

      const catalog = {
        react: "18.2.0",
        jest: "29.6.0",
        "react-dom": "18.2.0",
        lodash: "4.17.21",
      };

      const updated = await updatePackageFile("package.json", catalog);

      expect(updated).toBe(true);

      const result = await readJsonFile("package.json");
      expect(result).toEqual({
        name: "package-c",
        dependencies: {
          react: "18.2.0",
        },
        devDependencies: {
          jest: "29.6.0",
        },
        peerDependencies: {
          "react-dom": "18.2.0",
        },
        optionalDependencies: {
          lodash: "4.17.21",
        },
      });
    });

    it("should skip files with invalid JSON", async () => {
      mockFs({
        "invalid.json": "{invalid-json",
      });

      const updated = await updatePackageFile("invalid.json", {});

      expect(updated).toBe(false);
      expect(vi.mocked(console.warn).mock.calls[0][0]).toEqual(
        expect.stringContaining("Skipping invalid.json")
      );
    });

    it("should warn but not fail when requested catalog entry is not found", async () => {
      mockFs({
        "package.json": JSON.stringify({
          dependencies: {
            missing: "catalog:",
          },
        }),
      });

      const catalog = {
        react: "18.2.0",
      };

      const updated = await updatePackageFile("package.json", catalog);

      expect(updated).toBe(false);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('No entry for "missing"')
      );
    });

    it("should warn when referenced named catalog is not found", async () => {
      mockFs({
        "package.json": JSON.stringify({
          dependencies: {
            react: "catalog:missing-catalog",
          },
        }),
      });

      const catalog = {};
      const catalogs = {
        frontend: { react: "18.2.0" },
      };

      const updated = await updatePackageFile(
        "package.json",
        catalog,
        catalogs
      );

      expect(updated).toBe(false);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Catalog "missing-catalog" not found')
      );
    });

    it("should warn when missing entry in named catalog", async () => {
      mockFs({
        "package.json": JSON.stringify({
          dependencies: {
            missing: "catalog:frontend",
          },
        }),
      });

      const catalogs = {
        frontend: { react: "18.2.0" },
      };

      const updated = await updatePackageFile("package.json", {}, catalogs);

      expect(updated).toBe(false);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Catalog "frontend": No entry for "missing"')
      );
    });
  });

  describe("migrateCatalog", () => {
    it("should update all package.json files in the workspace", async () => {
      mockFs({
        "pnpm-workspace.yaml": yaml.stringify({
          packages: ["packages/*"],
          catalog: {
            react: "18.2.0",
            "react-dom": "18.2.0",
            typescript: "5.0.4",
          },
          catalogs: {
            backend: {
              express: "4.18.2",
              fastify: "4.19.0",
            },
          },
        }),
        "package.json": JSON.stringify({
          name: "root",
          dependencies: {
            react: "catalog:",
            typescript: "catalog:",
          },
        }),
        packages: {
          "package-a": {
            "package.json": JSON.stringify({
              name: "package-a",
              dependencies: {
                react: "catalog:",
                "react-dom": "catalog:",
              },
            }),
          },
          "package-b": {
            "package.json": JSON.stringify({
              name: "package-b",
              dependencies: {
                express: "catalog:backend",
                fastify: "catalog:backend",
              },
            }),
          },
        },
      });

      await migrateCatalog();

      // Check root package was updated
      const rootPkg = await readJsonFile("package.json");
      expect(rootPkg.dependencies).toEqual({
        react: "18.2.0",
        typescript: "5.0.4",
      });

      // Check package-a was updated
      const packageAPkg = await readJsonFile("packages/package-a/package.json");
      expect(packageAPkg.dependencies).toEqual({
        react: "18.2.0",
        "react-dom": "18.2.0",
      });

      // Check package-b was updated with named catalog
      const packageBPkg = await readJsonFile("packages/package-b/package.json");
      expect(packageBPkg.dependencies).toEqual({
        express: "4.18.2",
        fastify: "4.19.0",
      });
    });

    it("should handle missing catalog in workspace file", async () => {
      mockFs({
        "pnpm-workspace.yaml": yaml.stringify({
          packages: ["packages/*"],
        }),
        "package.json": JSON.stringify({
          name: "root",
          dependencies: {
            react: "catalog:",
          },
        }),
      });

      await migrateCatalog();

      // Check package was not updated due to missing catalog entry
      const rootPkg = await readJsonFile("package.json");
      expect(rootPkg.dependencies?.react).toBe("catalog:");
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('No entry for "react"')
      );
    });
  });
});
