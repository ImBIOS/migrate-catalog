import { globSync } from "./glob.js";

const cache = new Map<string, string[]>();

export function findPackageFiles(
  pattern = "**/package.json",
  options: { ignore: string | string[] } = { ignore: "**/node_modules/**" }
): string[] {
  const key = `${pattern}::${JSON.stringify(options)}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const result = globSync(pattern, options);
  cache.set(key, result);
  return result;
}


