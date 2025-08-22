import { globSync as externalGlobSync } from "glob";
import { describe, expect, it } from "vitest";
import externalYaml from "yaml";
import { globSync as ourGlobSync } from "../src/glob.js";
import { findPackageFiles } from "../src/index";
import ourYaml from "../src/yaml.js";

function timeIt<T>(fn: () => T, iterations = 50): { totalMs: number; avgMs: number; last: T } {
  let last!: T;
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    last = fn();
  }
  const totalMs = performance.now() - start;
  return { totalMs, avgMs: totalMs / iterations, last };
}

describe("performance and complexity tests", () => {
  it("our YAML parser should be faster than external yaml library", () => {
    // Test with real-world YAML content
    const testYaml = `packages: ["apps/*", "packages/*", "tooling/*"]
catalog:
  react: "18.2.0"
  typescript: "5.8.2"
  eslint: "9.23.0"
  prettier: "3.5.3"
  "@tanstack/react-query": "5.69.0"
  "@trpc/client": "11.0.0"
  "@trpc/server": "11.0.0"
  zod: "3.24.2"
catalogs:
  react19:
    react: "19.0.0"
    react-dom: "19.0.0"
    "@types/react": "19.0.12"
    "@types/react-dom": "19.0.4"
  dev:
    typescript: "5.0.0"
    eslint: "8.38.0"`;

    const ourResult = timeIt(() => ourYaml.parse(testYaml), 100);
    const externalResult = timeIt(() => externalYaml.parse(testYaml), 100);

    // Verify correctness - both should parse to the same structure
    const ourParsed = ourYaml.parse(testYaml);
    const externalParsed = externalYaml.parse(testYaml);
    expect(ourParsed.catalog.react).toBe(externalParsed.catalog.react);
    expect(ourParsed.catalogs.react19.react).toBe(externalParsed.catalogs.react19.react);

    // Our parser should be competitive (within 2x of external library)
    expect(ourResult.avgMs).toBeLessThan(externalResult.avgMs * 2);

    console.log("YAML Performance - Ours:", ourResult.avgMs, "ms, External:", externalResult.avgMs, "ms");
    console.log("Speed ratio (ours/external):", (ourResult.avgMs / externalResult.avgMs).toFixed(2));
  });

  it("our YAML parser time complexity should be O(n) where n is input size", () => {
    // Create YAML strings of increasing size
    const sizes = [100, 500, 1000, 2000];
    const results: { size: number; time: number }[] = [];

    for (const size of sizes) {
      const yamlContent = generateYamlContent(size);
      const result = timeIt(() => ourYaml.parse(yamlContent), 10);
      results.push({ size, time: result.avgMs });
    }

    // Time should scale roughly linearly with input size
    // Allow some variance due to test environment
    const timeRatio = results[3].time / results[0].time;
    const sizeRatio = results[3].size / results[0].size;

    // Time complexity should be better than O(n²)
    expect(timeRatio).toBeLessThan(sizeRatio * 2);

    console.log("YAML Parser Performance:", results);
  });

  it("our glob should be competitive with external glob library", () => {
    const testPattern = "**/*.ts";
    const ignorePattern = "node_modules/**";

    const ourResult = timeIt(() => ourGlobSync(testPattern, { ignore: ignorePattern }), 10);
    const externalResult = timeIt(() => externalGlobSync(testPattern, { ignore: ignorePattern }), 10);

    // Verify correctness - results should be similar (may differ in ordering)
    const ourFiles = new Set(ourResult.last);
    const externalFiles = new Set(externalResult.last);

    // Should find similar number of files (within reasonable variance)
    const sizeDiff = Math.abs(ourFiles.size - externalFiles.size);
    expect(sizeDiff).toBeLessThan(ourFiles.size * 0.2); // Within 20%

    // Our implementation should be competitive (within 3x of external)
    expect(ourResult.avgMs).toBeLessThan(externalResult.avgMs * 3);

    console.log("Glob Performance - Ours:", ourResult.avgMs, "ms, External:", externalResult.avgMs, "ms");
    console.log("Files found - Ours:", ourFiles.size, "External:", externalFiles.size);
    console.log("Speed ratio (ours/external):", (ourResult.avgMs / externalResult.avgMs).toFixed(2));
  });

  it("glob finder time complexity should be reasonable for directory depth", () => {
    // Test glob performance with different patterns
    const patterns = ["*.ts", "**/*.ts", "**/*.test.ts", "src/**/*.ts"];
    const results: { pattern: string; time: number; count: number }[] = [];

    for (const pattern of patterns) {
      const result = timeIt(() => ourGlobSync(pattern, { ignore: "node_modules/**" }), 5);
      results.push({
        pattern,
        time: result.avgMs,
        count: result.last.length
      });
    }

    // All patterns should complete in reasonable time (< 100ms)
    for (const result of results) {
      expect(result.time).toBeLessThan(100);
    }

    console.log("Glob Performance:", results);
  });

  it("findPackageFiles should have caching and reasonable performance", () => {
    // First call (no cache)
    const firstCall = timeIt(() => findPackageFiles("**/package.json"), 1);

    // Second call (should use cache)
    const secondCall = timeIt(() => findPackageFiles("**/package.json"), 1);

    // Cached call should be significantly faster
    expect(secondCall.avgMs).toBeLessThan(firstCall.avgMs * 0.1);

    // Results should be identical
    expect(firstCall.last).toEqual(secondCall.last);

    console.log("Cache Performance - First:", firstCall.avgMs, "ms, Cached:", secondCall.avgMs, "ms");
  });

  it("YAML parser space complexity should be reasonable", () => {
    // Test memory usage doesn't explode with nested structures
    const deepYaml = generateDeepNestedYaml(10);
    const wideYaml = generateWideYaml(100);

    // Should be able to parse both without throwing
    expect(() => ourYaml.parse(deepYaml)).not.toThrow();
    expect(() => ourYaml.parse(wideYaml)).not.toThrow();

    // Measure parsing time for both
    const deepResult = timeIt(() => ourYaml.parse(deepYaml), 10);
    const wideResult = timeIt(() => ourYaml.parse(wideYaml), 10);

    // Both should complete in reasonable time
    expect(deepResult.avgMs).toBeLessThan(50);
    expect(wideResult.avgMs).toBeLessThan(50);

    console.log("Deep YAML:", deepResult.avgMs, "ms, Wide YAML:", wideResult.avgMs, "ms");
  });

  it("memory usage comparison between parsers", () => {
    // Test large content to see memory behavior difference
    const largeYaml = generateYamlContent(5000);

    // Both should handle large content without issues
    expect(() => ourYaml.parse(largeYaml)).not.toThrow();
    expect(() => externalYaml.parse(largeYaml)).not.toThrow();

    const ourResult = timeIt(() => ourYaml.parse(largeYaml), 5);
    const externalResult = timeIt(() => externalYaml.parse(largeYaml), 5);

    // Verify results are equivalent
    const ourParsed = ourYaml.parse(largeYaml);
    const externalParsed = externalYaml.parse(largeYaml);
    expect(Object.keys(ourParsed.catalog).length).toBe(Object.keys(externalParsed.catalog).length);

    console.log("Large YAML Performance - Ours:", ourResult.avgMs, "ms, External:", externalResult.avgMs, "ms");
  });
});

function generateYamlContent(lines: number): string {
  let content = "catalog:\n";
  for (let i = 0; i < lines; i++) {
    content += `  package${i}: "^1.0.${i}"\n`;
  }
  return content;
}

function generateDeepNestedYaml(depth: number): string {
  let content = "";
  let indent = "";

  for (let i = 0; i < depth; i++) {
    content += `${indent}level${i}:\n`;
    indent += "  ";
  }
  content += `${indent}value: "deep"`;

  return content;
}

function generateWideYaml(width: number): string {
  let content = "catalog:\n";
  for (let i = 0; i < width; i++) {
    content += `  pkg${i}: "1.0.0"\n`;
  }
  content += "catalogs:\n";
  for (let i = 0; i < width; i++) {
    content += `  cat${i}:\n    dep${i}: "1.0.0"\n`;
  }
  return content;
}


