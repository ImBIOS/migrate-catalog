import fs from "node:fs/promises";
import type { PackageJson, WorkspaceData } from "./types.js";
import yaml from "./yaml.js";

export async function readYamlFile(filePath: string): Promise<WorkspaceData> {
  const content = await fs.readFile(filePath, "utf8");
  return yaml.parse(content) as WorkspaceData;
}

export async function readJsonFile(filePath: string): Promise<PackageJson> {
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content) as PackageJson;
}

export async function writeJsonFile(
  filePath: string,
  data: PackageJson
): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}


