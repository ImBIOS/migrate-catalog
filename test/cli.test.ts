import mockFs from "mock-fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    mockFs.restore();
  });

  it("should handle errors in the migrateCatalog function", async () => {
    // Setup an error to be thrown
    const mockError = new Error("Test error");
    (migrateCatalog as any).mockRejectedValueOnce(mockError);

    // Create a main function like the one in the original code
    const main = () => {
      return migrateCatalog().catch((err) => {
        console.error(err);
        process.exit(1);
      });
    };

    // Test the main function
    await expect(() => main()).rejects.toThrow(
      "Process.exit called with code: 1"
    );
    expect(console.error).toHaveBeenCalledWith(mockError);
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});
