# Troubleshooting Publishing Issues

## Setting Up NPM_TOKEN Secret

The GitHub Actions workflow requires an `NPM_TOKEN` secret to publish to the npm registry. Follow these steps to set it up:

### 1. Create an npm Access Token

1. Go to [npmjs.com](https://www.npmjs.com/) and log in to your account
2. Click on your profile picture in the top-right corner and select "Access Tokens"
3. Click "Generate New Token" and select "Publish"
4. Copy the generated token (it will only be shown once)

### 2. Add the NPM_TOKEN to GitHub Secrets

Using GitHub website:

1. Go to your repository on GitHub
2. Click on "Settings" > "Secrets and variables" > "Actions"
3. Click "New repository secret"
4. Name: `NPM_TOKEN`
5. Value: Paste the npm token you copied earlier
6. Click "Add secret"

Using GitHub CLI:

```bash
# Make sure GitHub CLI is installed and authenticated
gh secret set NPM_TOKEN --body "your-npm-token"
```

## Common Publishing Errors

### Error: ENEEDAUTH

If you see the error:

```
npm error code ENEEDAUTH
npm error need auth This command requires you to be logged in to https://registry.npmjs.org/
```

This means the NPM_TOKEN secret is either:

- Not set in your GitHub repository
- Invalid or expired
- Not correctly configured in the workflow

### Error: Unclean working tree

If you see the error:

```
ERR_PNPM_GIT_UNCLEAN  Unclean working tree. Commit or stash changes first.
```

Make sure to add the `--no-git-checks` flag to your publish command:

```
pnpm publish --no-git-checks
```

## Testing the Workflow

After setting up the secrets, create a new release to trigger the workflow:

```bash
# Increment the version
npm version patch --no-git-tag-version

# Commit the change
git add package.json
git commit -m "chore: bump version"
git push

# Create and push a tag
git tag vX.X.X
git push origin vX.X.X

# Create a GitHub release
gh release create vX.X.X --title "Release vX.X.X" --notes "Your release notes"
```
