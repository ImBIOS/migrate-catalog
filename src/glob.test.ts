import { describe, expect, it } from "vitest";
import { globSync } from "./glob.js";

describe("globSync", () => {
  it("should find files with basic patterns", () => {
    const result = globSync("*.ts", { ignore: "node_modules/**" });
    expect(result).toContain("vitest.config.ts");
    expect(result.some(f => f.includes("src/"))).toBe(false); // *.ts should not match subdirectories
  });

  it("should find files with recursive patterns", () => {
    const result = globSync("**/*.test.ts", { ignore: "node_modules/**" });
    expect(result.length).toBeGreaterThan(0);
    expect(result.some(f => f.includes("test"))).toBe(true);
    expect(result).toContain("src/glob.test.ts");
  });

  it("should respect ignore patterns", () => {
    const result = globSync("**/*.js", { ignore: "node_modules/**" });
    expect(result.every(f => !f.includes("node_modules"))).toBe(true);
  });
});
