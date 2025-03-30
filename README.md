# Migrate Catalog

**Migrate Catalog** is a CLI tool for automating the migration of dependency versions from a centralized `catalog` in your `pnpm-workspace.yaml` file to all `package.json` files in a monorepo. This tool streamlines version updates in pnpm workspaces, saving time and reducing manual errors.

## Features

- **Automated Migration:** Scans all `package.json` files and replaces `"catalog:"` with the correct version from your `pnpm-workspace.yaml` catalog.
- **Monorepo Support:** Built to work seamlessly in multi-package repositories managed by pnpm.
- **Easy Integration:** Ideal for CI/CD pipelines and local development environments.
- **TypeScript Support:** Written in TypeScript with full type definitions included.
- **Customizable:** Extendable for additional dependency sections or custom update logic.

## Installation

### From npm Registry

Install the package globally with npm:

```bash
npm install -g @imbios/migrate-catalog
```

Or use it via npx:

```bash
npx @imbios/migrate-catalog
```

### From GitHub Registry

Add this to your `.npmrc` file:

```
@imbios:registry=https://npm.pkg.github.com
```

Then install the package:

```bash
npm install -g @imbios/migrate-catalog
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

## Documentation

- [Publishing Guide](.github/PUBLISHING.md) - Instructions for setting up and using the automated publishing workflow
- [Manual Publishing Guide](.github/MANUAL_PUBLISHING.md) - Instructions for manually publishing to both registries
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues and their solutions

## License

This project is licensed under the [MIT License](LICENSE).

## Keywords

catalog migration, monorepo, pnpm, npm package, dependency management, version automation, node CLI tool, automated version update
