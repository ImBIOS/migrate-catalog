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
npm install -g migrate-catalog
```

Or use it via npx:

```bash
npx migrate-catalog
```

### From GitHub Registry

Add this to your `.npmrc` file:

```
@imbios:registry=https://npm.pkg.github.com
```

Then install the package:

```bash
npm install -g migrate-catalog
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

### CLI Options

The tool supports several command-line options for customizing its behavior:

```bash
# Use a custom workspace file location
migrate-catalog --workspace ./custom-workspace.yaml

# Process only specific package.json files matching a pattern
migrate-catalog --pattern "packages/*/package.json"

# Perform a dry run without actually modifying files
migrate-catalog --dry-run
```

### Named Catalogs Support

The tool supports named catalogs as defined in the `catalogs` section of your `pnpm-workspace.yaml`. To reference a named catalog in your package.json, use the format `"catalog:catalog-name"`:

```json
{
  "dependencies": {
    "react": "catalog:react19",
    "react-dom": "catalog:react19"
  }
}
```

## Getting Started

1. **Configure Your Monorepo:**
   Ensure your `pnpm-workspace.yaml` includes a valid `catalog` section and that your `package.json` files have dependencies with `"catalog:"` as their version.

2. **Run Migrate Catalog:**
   Execute the tool in your project root and verify that the updates have been applied across your packages.

## Example Configuration

### pnpm-workspace.yaml

```yaml
packages:
  - apps/*
  - packages/*
  - tooling/*

catalog:
  # Auth
  "@auth/core": 0.37.2
  "@auth/drizzle-adapter": ~1.7.4

  # Dev tooling
  eslint: ^9.23.0
  prettier: ^3.5.3

catalogs:
  react19:
    react: 19.0.0
    react-dom: 19.0.0
    "@types/react": ^19.0.12
    "@types/react-dom": ^19.0.4
```

### package.json

```json
{
  "name": "@my-app/web",
  "dependencies": {
    "@auth/core": "catalog:",
    "react": "catalog:react19",
    "react-dom": "catalog:react19"
  },
  "devDependencies": {
    "eslint": "catalog:",
    "prettier": "catalog:",
    "@types/react": "catalog:react19"
  }
}
```

## Testing

The tool includes a comprehensive test suite:

```bash
# Run all tests
npm test

# Run only the end-to-end tests
npm run test:e2e

# Generate test coverage report
npm run test:coverage
```

The end-to-end tests validate the tool's functionality using a real monorepo structure with catalog definitions.

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
