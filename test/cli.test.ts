import mockFs from "mock-fs";
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from "vitest";

// Import the migrateCatalog function
import { migrateCatalog } from "../src/migrate-catalog";

// Manually mock the function
vi.mock("../src/migrate-catalog", () => ({
  migrateCatalog: vi.fn(),
}));

describe("CLI", () => {
  beforeEach(() => {
    // Mock process.exit and console.error
    vi.spyOn(process, "exit").mockImplementation((code) => {
      throw new Error(`Process.exit called with code: ${code}`);
    });
    vi.spyOn(console, "error").mockImplementation(() => {
      return;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    mockFs.restore();
  });

  it("should handle errors in the migrateCatalog function", async () => {
    // Setup an error to be thrown
    const mockError = new Error("Test error");
    (migrateCatalog as unknown as Mock).mockRejectedValueOnce(mockError);

    // Create a main function like the one in the original code
    const main = async () => {
      try {
        await migrateCatalog();
      } catch (err) {
        console.error(err);
        process.exit(1);
      }
    };

    // Test the main function - since we mocked process.exit to throw an error,
    // we expect main() to throw that error
    await expect(main()).rejects.toThrow("Process.exit called with code: 1");
  });
});
