import { describe, expect, it } from "vitest";
import { parse, stringify } from "./yaml.js";

describe("YAML parser", () => {
  it("should parse simple key-value pairs", () => {
    const yaml = `key: value
number: 42
boolean: true`;
    const result = parse(yaml);
    expect(result).toEqual({
      key: "value",
      number: 42,
      boolean: true,
    });
  });

  it("should parse arrays", () => {
    const yaml = `packages:
  - apps/*
  - packages/*`;
    const result = parse(yaml);
    expect(result).toEqual({
      packages: ["apps/*", "packages/*"],
    });
  });

  it("should parse nested objects", () => {
    const yaml = `catalog:
  react: 18.2.0
  react-dom: 18.2.0`;
    const result = parse(yaml);
    expect(result).toEqual({
      catalog: {
        react: "18.2.0",
        "react-dom": "18.2.0",
      },
    });
  });

  it("should handle comments", () => {
    const yaml = `# This is a comment
catalog:
  # Another comment
  react: 18.2.0`;
    const result = parse(yaml);
    expect(result).toEqual({
      catalog: {
        react: "18.2.0",
      },
    });
  });

  it("should parse complex structures", () => {
    const yaml = `packages: ["packages/*"]
catalog:
  react: 18.2.0
  react-dom: 18.2.0
catalogs:
  dev:
    typescript: 5.0.0`;
    const result = parse(yaml);
    expect(result).toEqual({
      packages: ["packages/*"],
      catalog: {
        react: "18.2.0",
        "react-dom": "18.2.0",
      },
      catalogs: {
        dev: {
          typescript: "5.0.0",
        },
      },
    });
  });
});

describe("YAML stringifier", () => {
  it("should stringify simple objects", () => {
    const obj = { key: "value", number: 42 };
    const result = stringify(obj);
    expect(result).toBe("key: value\nnumber: 42");
  });

  it("should stringify nested objects", () => {
    const obj = {
      catalog: {
        react: "18.2.0",
      },
    };
    const result = stringify(obj);
    expect(result).toBe("catalog:\n  react: 18.2.0");
  });
});
