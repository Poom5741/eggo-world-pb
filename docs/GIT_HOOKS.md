# Git Hooks Quality Gates

This project uses **Husky** and **lint-staged** to enforce code quality before every commit and push.

## 📋 Hooks Overview

### Pre-commit Hook

**Location:** `.husky/pre-commit`  
**Triggers:** Before every `git commit`  
**Actions:**

- Runs `lint-staged` on staged files only
- Applies ESLint auto-fixes for TypeScript/React files
- Formats JSON and Markdown with Prettier
- Runs tests only on affected files (fast)

**Lint-staged rules:**

- `apps/web/**/*.{ts,tsx}` → ESLint --fix + Bun test
- `apps/web/**/*.{js,jsx}` → ESLint --fix
- `**/*.{json,md}` → Prettier --write
- `contracts/**/*.sol` → Reminder to run forge fmt
- `wallet-api/**/*.js` → Manual review notice
- `apps/backend/pb_hooks/**/*.js` → Manual review notice

### Pre-push Hook

**Location:** `.husky/pre-push`  
**Triggers:** Before every `git push`  
**Actions:**

- Runs **ALL** tests with Bun test runner
- Blocks push if any test fails
- Ensures nothing broken reaches remote

## 🛠️ Setup (Already Configured)

Dependencies installed in `apps/web/package.json`:

```json
{
  "devDependencies": {
    "husky": "^9.1.7",
    "lint-staged": "^16.4.0",
    "eslint": "^10.1.0",
    "prettier": "^3.8.1",
    "eslint-config-prettier": "^10.1.8",
    "eslint-plugin-react": "^7.37.5",
    "eslint-plugin-react-hooks": "^7.0.1",
    "@typescript-eslint/parser": "^8.58.0",
    "@typescript-eslint/eslint-plugin": "^8.58.0"
  }
}
```

Configuration files:

- `.husky/pre-commit` - Pre-commit hook script
- `.husky/pre-push` - Pre-push hook script
- `package.json` - Contains `lint-staged` config and `"prepare": "husky"` script
- `.prettierrc.json` - Prettier formatting rules
- `apps/web/eslint.config.js` - ESLint v9+ flat configuration

## 🚀 Usage

### Committing Code

```bash
# Stage your changes
git add <files>

# Commit - pre-commit hook runs automatically
git commit -m "Your message"
```

The pre-commit hook will:

1. ✅ Run ESLint with auto-fix on staged TS/TSX files
2. ✅ Run tests on staged files
3. ✅ Format JSON/MD files with Prettier
4. ✅ Block commit if any check fails

### Pushing Code

```bash
# Push - pre-push hook runs automatically
git push
```

The pre-push hook will:

1. ✅ Run ALL tests in the project
2. ✅ Block push if any test fails

## 🔧 Manual Commands

### Run ESLint Manually

```bash
cd apps/web
bun run lint
```

### Run Tests Manually

```bash
cd apps/web
bun run test
bun run test:coverage  # With coverage
```

### Format Files Manually

```bash
bunx prettier --write "**/*.{json,md}"
```

### Bypass Hooks (Emergency Only)

```bash
# Skip pre-commit hook
git commit -m "message" --no-verify

# Skip pre-push hook
git push --no-verify
```

⚠️ **Warning:** Only bypass hooks in emergencies. This bypasses quality gates.

## 📝 ESLint Rules

Key rules enforced:

- TypeScript best practices (`@typescript-eslint/recommended`)
- React best practices (`react/recommended`, `react-hooks/recommended`)
- No console.log (warn) - console.warn and console.error allowed
- No unused variables (error) - prefix with `_` to ignore
- No explicit any (warn)
- Prettier formatting (no conflicts with ESLint)

See `apps/web/eslint.config.js` for full configuration.

## 🎨 Prettier Config

```json
{
  "semi": false,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

## 🐛 Troubleshooting

### Hook Fails but Code is Fine

Sometimes ESLint auto-fix modifies files. Re-stage the fixed files:

```bash
git add <files>
git commit -m "message"
```

### Tests Fail Locally

Fix the failing tests before committing:

```bash
cd apps/web
bun run test
```

### Want to See What Will Run

Check staged files:

```bash
git status
```

Check what lint-staged will process (manually):

```bash
bunx lint-staged --diff="HEAD~1"
```

### Hook Script Errors

Check hook scripts:

```bash
cat .husky/pre-commit
cat .husky/pre-push
```

Reinstall husky if needed:

```bash
bun install
```

## 📚 Best Practices

1. **Commit Often** - Smaller commits = faster pre-commit checks
2. **Fix Lint Errors Early** - Don't wait until pre-commit to run ESLint
3. **Run Tests Locally** - Don't rely on pre-push to catch test failures
4. **Use Auto-fix** - Let ESLint/Prettier fix formatting automatically
5. **Don't Bypass** - Only use `--no-verify` in true emergencies

## 🔄 Modifying Hooks

To modify hooks, edit files in `.husky/`:

- `.husky/pre-commit` - Pre-commit logic
- `.husky/pre-push` - Pre-push logic

To add new hooks:

```bash
bunx husky add .husky/pre-merge-commit "bun test"
```

## 📖 Resources

- [Husky Documentation](https://typicode.github.io/husky/)
- [lint-staged Documentation](https://github.com/lint-staged/lint-staged)
- [ESLint Documentation](https://eslint.org/)
- [Prettier Documentation](https://prettier.io/)
