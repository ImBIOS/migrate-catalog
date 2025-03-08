# Migrate Catalog

**Migrate Catalog** is a CLI tool for automating the migration of dependency versions from a centralized `catalog` in your `pnpm-workspace.yaml` file to all `package.json` files in a monorepo. This tool streamlines version updates in pnpm workspaces, saving time and reducing manual errors.

## Features

- **Automated Migration:** Scans all `package.json` files and replaces `"catalog:"` with the correct version from your `pnpm-workspace.yaml` catalog.
- **Monorepo Support:** Built to work seamlessly in multi-package repositories managed by pnpm.
- **Easy Integration:** Ideal for CI/CD pipelines and local development environments.
- **Customizable:** Extendable for additional dependency sections or custom update logic.

## Installation

Install the package globally with npm:

```bash
npm install -g migrate-catalog
```

Or use it via npx:

```bash
npx migrate-catalog
```

## Usage

Run the tool from the root of your monorepo:

```bash
migrate-catalog
```

The script will:

- Read the `catalog` section from `pnpm-workspace.yaml`.
- Recursively locate all `package.json` files (ignoring `node_modules`).
- Update dependencies with the version placeholder `"catalog:"` to the actual version from the catalog.

## Getting Started

1. **Configure Your Monorepo:**
   Ensure your `pnpm-workspace.yaml` includes a valid `catalog` section and that your `package.json` files have dependencies with `"catalog:"` as their version.

2. **Run Migrate Catalog:**
   Execute the tool in your project root and verify that the updates have been applied across your packages.

## Contributing

Contributions are welcome! Fork the repository, create your feature branch, and submit a pull request with your enhancements.

## License

This project is licensed under the [MIT License](LICENSE).

## Keywords

catalog migration, monorepo, pnpm, npm package, dependency management, version automation, node CLI tool, automated version update
