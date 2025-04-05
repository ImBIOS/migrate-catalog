# Publishing Guide for Migrate Catalog

This package is published to both npm and GitHub Package Registry. Follow these steps to ensure smooth publishing:

## Setting Up Repository Secrets

For the GitHub Actions workflow to publish to both registries, you need to set up two secrets:

1. `NPM_TOKEN`: An access token for npm registry
2. `GITHUB_TOKEN`: This is automatically provided by GitHub Actions

### Creating an npm Access Token

1. Go to [npmjs.com](https://www.npmjs.com/) and log in to your account
2. Click on your profile picture and select "Access Tokens"
3. Click "Generate New Token" and select "Publish"
4. Copy the generated token

### Adding Secrets to GitHub Repository

1. Go to your repository on GitHub
2. Click on "Settings" > "Secrets and variables" > "Actions"
3. Click "New repository secret"
4. Add a secret named `NPM_TOKEN` with the value being your npm token

## Publishing Process

1. Create a new release on GitHub
2. The GitHub Actions workflow will automatically:
   - Publish to npm registry first
   - Then publish to GitHub Package Registry

## Verifying Publication

Check both registries to confirm successful publication:

- npm: https://www.npmjs.com/package/migrate-catalog
- GitHub: https://github.com/ImBIOS/migrate-catalog/packages

## Troubleshooting

- If publishing to npm fails, check if your npm token has expired
- If publishing to GitHub fails, ensure the package.json has the correct GitHub registry URL in publishConfig
- Check the GitHub Actions logs for detailed error messages
