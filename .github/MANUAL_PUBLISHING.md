# Manual Publishing Guide

If you need to publish the package manually (not using GitHub Actions), follow these steps:

## Prerequisites

- You need to be authenticated with both npm and GitHub Package Registry
- You need to have pnpm installed

## 1. Publishing to npm Registry

```bash
# Log in to npm (if not already logged in)
npm login

# Build the package
pnpm install
pnpm build

# Publish to npm
pnpm publish --registry=https://registry.npmjs.org/
```

## 2. Publishing to GitHub Package Registry

```bash
# Log in to GitHub Package Registry
npm login --registry=https://npm.pkg.github.com --scope=@imbios

# Create or update .npmrc in project root
echo "@imbios:registry=https://npm.pkg.github.com" > .npmrc

# Publish to GitHub
pnpm publish --registry=https://npm.pkg.github.com
```

## Important Notes

- Make sure to increment the version in package.json before publishing
- Ensure the package name in package.json matches the scope (migrate-catalog)
- You can only publish a specific version once to each registry

## Verification

After publishing, verify that your package is available on both:

- npm: https://www.npmjs.com/package/migrate-catalog
- GitHub: https://github.com/ImBIOS/migrate-catalog/packages
