import mockFs from "mock-fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import yaml from "yaml";

import { migrateCatalog } from "../src/migrate-catalog";

describe("Error Handling", () => {
  beforeEach(() => {
    // Mock console methods
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockFs.restore();
  });

  describe("File System Errors", () => {
    it("should handle non-existent workspace file", async () => {
      mockFs({}); // Empty file system

      // The function should throw an error when workspace file doesn't exist
      await expect(migrateCatalog()).rejects.toThrow();

      expect(console.error).not.toHaveBeenCalled(); // Error is thrown, not logged
    });

    it("should handle permission errors for workspace file", async () => {
      // Mock a file with no read permissions
      const noReadFile = mockFs.file({
        content: "",
        mode: 0, // No permissions
      });

      mockFs({
        "pnpm-workspace.yaml": noReadFile,
      });

      await expect(migrateCatalog()).rejects.toThrow();
    });

    it("should handle invalid YAML in workspace file", async () => {
      mockFs({
        "pnpm-workspace.yaml": "invalid: yaml: content:", // Invalid YAML content
      });

      await expect(migrateCatalog()).rejects.toThrow();
    });
  });

  describe("Integration Error Handling", () => {
    it("should warn about missing catalog entries but continue", async () => {
      mockFs({
        "pnpm-workspace.yaml": yaml.stringify({
          packages: ["packages/*"],
          catalog: {
            "existing-dep": "1.0.0",
            // missing-dep is not defined
          },
        }),
        "package.json": JSON.stringify({
          dependencies: {
            "missing-dep": "catalog:",
            "existing-dep": "catalog:",
          },
        }),
      });

      await migrateCatalog();

      // Should warn about missing entry but not throw
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('No entry for "missing-dep"')
      );

      // Should still update the existing dependency
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Updated "existing-dep"')
      );
    });

    it("should warn about invalid named catalogs but continue", async () => {
      mockFs({
        "pnpm-workspace.yaml": yaml.stringify({
          packages: ["packages/*"],
          catalog: {
            "some-dep": "1.0.0",
          },
          catalogs: {
            "valid-catalog": {
              "catalog-dep": "2.0.0",
            },
            // missing-catalog is not defined
          },
        }),
        "package.json": JSON.stringify({
          dependencies: {
            "some-dep": "catalog:",
            "catalog-dep": "catalog:valid-catalog",
            "missing-dep": "catalog:missing-catalog",
          },
        }),
      });

      await migrateCatalog();

      // Should warn about missing catalog but not throw
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Catalog "missing-catalog" not found')
      );

      // Should still update the other dependencies
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Updated "some-dep"')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Updated "catalog-dep"')
      );
    });

    it("should handle write errors gracefully", async () => {
      mockFs({
        "pnpm-workspace.yaml": yaml.stringify({
          catalog: { dep: "1.0.0" },
        }),
        "package.json": mockFs.file({
          content: JSON.stringify({
            dependencies: { dep: "catalog:" },
          }),
          mode: 0o444, // Read-only file
        }),
      });

      // Should reject with permission error
      await expect(migrateCatalog()).rejects.toThrow();
    });
  });

  describe("File discovery errors", () => {
    it("should handle no package.json files found", async () => {
      mockFs({
        "pnpm-workspace.yaml": yaml.stringify({
          catalog: { dep: "1.0.0" },
        }),
        // Deliberately no package.json files
      });

      // Should run without errors even when no files are found
      await migrateCatalog();

      // Nothing should be updated
      expect(console.log).not.toHaveBeenCalled();
    });
  });
});
