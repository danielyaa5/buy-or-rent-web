# Contributing

Use the Node version in `.nvmrc`, install with `npm ci`, and follow the verification steps in README.md before opening a pull request.

For a financial-model change, include the assumption being corrected, an authoritative source, and an independently calculated example or invariant. Preserve comparison fairness: equal starting cash, equal monthly spending capacity, and explicit treatment of fees and taxes. Update MODEL.md when behavior changes.

For interface changes, test the actual flow with keyboard navigation and a narrow viewport. Preserve privacy, explicit sharing, and recovery when local storage is unavailable. Use fictional inputs in screenshots and bug reports. Never include someone else's scenario link or private financial inputs.

Keep pull requests focused. Explain the problem, final behavior, and checks performed. Report security issues privately as described in SECURITY.md.
