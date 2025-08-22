import fs from "node:fs";
import path from "node:path";

/**
 * In-house glob implementation for finding files matching patterns
 */

export interface GlobOptions {
  ignore?: string | string[];
}

/**
 * Simple glob implementation that supports basic patterns
 * Currently supports:
 * - ** for recursive directory matching
 * - * for single-level wildcard matching
 * - exact file/directory names
 */
export function globSync(pattern: string, options: GlobOptions = {}): string[] {
  const ignore = Array.isArray(options.ignore) ? options.ignore : options.ignore ? [options.ignore] : [];
  const results: string[] = [];

  function shouldIgnore(filePath: string): boolean {
    return ignore.some(ignorePattern => {
      if (ignorePattern.includes('**')) {
        const cleanPattern = ignorePattern.replace(/\*\*/g, '').replace(/\//g, '');
        return filePath.includes(cleanPattern);
      }
      return filePath.includes(ignorePattern.replace(/\*/g, ''));
    });
  }

  function walkDirectory(dir: string): void {
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
      return;
    }

    const relativeDirPath = path.relative(process.cwd(), dir);
    if (shouldIgnore(dir) || shouldIgnore(relativeDirPath)) {
      return;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(process.cwd(), fullPath);

      if (shouldIgnore(fullPath) || shouldIgnore(relativePath)) {
        continue;
      }

      if (entry.isDirectory()) {
        // Recurse into subdirectories
        walkDirectory(fullPath);
      } else if (entry.isFile()) {
        // Check if file matches the pattern
        if (matchesPattern(relativePath.replace(/\\/g, '/'), pattern)) {
          results.push(relativePath.replace(/\\/g, '/'));
        }
      }
    }
  }

  function matchesPattern(filePath: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\./g, '\\.')  // Escape dots
      .replace(/\*\*/g, '.*') // ** matches anything including /
      .replace(/\*/g, '[^/]*'); // * matches anything except /

    const regex = new RegExp('^' + regexPattern + '$');
    return regex.test(filePath);
  }

  // Start walking from current directory
  walkDirectory(process.cwd());

  return results.sort();
}