import path from "node:path";

export function parseArgs(): {
  workspace: string;
  pattern: string;
  dryRun: boolean;
} {
  const args = process.argv.slice(2);
  const result = {
    workspace: path.join(process.cwd(), "pnpm-workspace.yaml"),
    pattern: "**/package.json",
    dryRun: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--workspace" && i + 1 < args.length) {
      result.workspace = args[++i];
    } else if (arg === "--pattern" && i + 1 < args.length) {
      result.pattern = args[++i];
    } else if (arg === "--dry-run") {
      result.dryRun = true;
    }
  }

  return result;
}


