/**
 * In-house YAML implementation for basic parsing and stringifying
 * Supports the basic subset of YAML needed for pnpm-workspace.yaml files
 */

export interface YamlValue {
  [key: string]: any;
}

/**
 * Simple YAML parser that handles basic YAML structures
 * Supports:
 * - Key-value pairs
 * - Arrays (with - syntax)
 * - Nested objects
 * - Basic string values (quoted and unquoted)
 * - Numbers and booleans
 */
export function parse(yamlString: string): YamlValue {
  const lines = yamlString.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));
  const result: YamlValue = {};

  // Use a simpler approach - track path to current location
  let currentPath: string[] = [];

  for (const line of lines) {
    const indent = line.length - line.trimStart().length;
    const trimmed = line.trim();

    // Calculate how deep we should be based on indentation
    const depth = Math.floor(indent / 2); // Assuming 2-space indentation

    // Trim path to match current depth
    currentPath = currentPath.slice(0, depth);

    if (trimmed.startsWith('- ')) {
      // Array item
      const value = trimmed.substring(2).trim();
      const parsedValue = parseValue(value);

      // Get the parent object
      const parent = getNestedValue(result, currentPath);
      if (!Array.isArray(parent)) {
        // Convert to array if it's not already
        setNestedValue(result, currentPath, []);
      }
      const targetArray = getNestedValue(result, currentPath);
      targetArray.push(parsedValue);

    } else if (trimmed.includes(':')) {
      // Key-value pair
      const colonIndex = trimmed.indexOf(':');
      const key = trimmed.substring(0, colonIndex).trim();
      const valueStr = trimmed.substring(colonIndex + 1).trim();

      const keyPath = [...currentPath, key];

      if (valueStr) {
        // Simple key-value
        if (valueStr.startsWith('[') && valueStr.endsWith(']')) {
          // Handle inline arrays like packages: ["packages/*"]
          const arrayContent = valueStr.slice(1, -1);
          const items = arrayContent.split(',').map(item =>
            parseValue(item.trim())
          );
          setNestedValue(result, keyPath, items);
        } else {
          setNestedValue(result, keyPath, parseValue(valueStr));
        }
      } else {
        // Object coming next
        setNestedValue(result, keyPath, {});
        currentPath.push(key);
      }
    }
  }

  return result;
}

function getNestedValue(obj: any, path: string[]): any {
  let current = obj;
  for (const key of path) {
    if (current[key] === undefined) {
      current[key] = {};
    }
    current = current[key];
  }
  return current;
}

function setNestedValue(obj: any, path: string[], value: any): void {
  if (path.length === 0) return;

  let current = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (current[key] === undefined) {
      current[key] = {};
    }
    current = current[key];
  }

  const lastKey = path[path.length - 1];
  current[lastKey] = value;
}

function parseValue(value: string): any {
  // Remove quotes if present
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }

  // Boolean values
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;

  // Numbers
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return value.includes('.') ? parseFloat(value) : parseInt(value, 10);
  }

  // String value
  return value;
}

/**
 * Simple YAML stringifier for basic YAML structures
 */
export function stringify(obj: YamlValue, indent = 0): string {
  const indentStr = '  '.repeat(indent);
  const lines: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      lines.push(`${indentStr}${key}:`);
      for (const item of value) {
        if (typeof item === 'object' && item !== null) {
          lines.push(`${indentStr}  -`);
          const itemLines = stringify(item, indent + 2).split('\n');
          lines.push(...itemLines.map(line => line ? `  ${line}` : ''));
        } else {
          lines.push(`${indentStr}  - ${formatValue(item)}`);
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      lines.push(`${indentStr}${key}:`);
      lines.push(stringify(value, indent + 1));
    } else {
      lines.push(`${indentStr}${key}: ${formatValue(value)}`);
    }
  }

  return lines.join('\n');
}

function formatValue(value: any): string {
  if (typeof value === 'string') {
    // Quote strings that contain special characters or start with special chars
    if (/[:[\]{}#&*!|>'"%@`]/.test(value) || /^\s/.test(value) || /\s$/.test(value)) {
      return `"${value.replace(/"/g, '\\"')}"`;
    }
    return value;
  }

  if (value === null) return 'null';
  if (typeof value === 'boolean') return value.toString();
  if (typeof value === 'number') return value.toString();

  return String(value);
}

// Default export for compatibility
export default { parse, stringify };