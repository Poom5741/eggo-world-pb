# First Time Setup

After cloning the repository, run:

```bash
bun install
```

This will:

- Install all dependencies
- Activate Git hooks via Husky's `prepare` script

## Git Hooks

This project has **pre-commit** and **pre-push** quality gates:

- **Pre-commit**: Auto-lints and formats staged files
- **Pre-push**: Runs ALL tests before pushing

See [docs/GIT_HOOKS.md](docs/GIT_HOOKS.md) for details.
