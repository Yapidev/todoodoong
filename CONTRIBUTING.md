# Contributing

Thanks for your interest in improving Todo Kanban!

## Getting started

1. Fork the repository and clone your fork.
2. Install dependencies: `npm install`
3. Create a branch for your change: `git checkout -b feat/my-feature`
4. Make your changes.
5. Make sure everything passes before opening a PR:

   ```bash
   npm run lint
   npm run typecheck
   npm test
   npm run build
   ```

## Guidelines

- Keep PRs small and focused — one feature or fix per PR.
- Pure logic belongs in `components/todo-logic.ts` with unit tests in `tests/`.
- UI strings are in Indonesian for now; keep new strings consistent.
- Follow the existing code style; no reformatting of untouched code.
- For new features, open an issue first so we can discuss the approach.

## Reporting bugs

Open an issue with: what you did, what you expected, what happened, and your browser/OS. Screenshots help.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
