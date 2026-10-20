# Release checklist

## Source and dependencies

- Use a clean installation (`npm ci`) on the Node version in `.nvmrc`.
- Run `npm run check`, `npm run test:e2e`, and a production dependency audit.
- Inspect any remaining development-only advisories. Do not apply an incompatible major downgrade just to silence an audit.
- Review the intended diff and files. Exclude environment secrets, browser traces, local paths, personal scenarios, build output, dependencies, and private review notes.
- Keep package metadata, MIT license, and documentation consistent.

## Repository visibility

- Review all branches, tags, history, issues, pull requests, releases, and CI artifacts before making an existing private repository public. Deleting a file from the current tree does not remove it from history.
- Scan the intended source snapshot and full history for credentials and private identifiers. Investigate findings; rotate or restrict any exposed credentials through their provider before publication.
- Confirm author identities and public contact details are intentional.
- Choose an explicitly approved history strategy: cleaned history, or a fresh repository containing a reviewed source snapshot. Keep a private backup before rewriting history.
- Confirm the intended web-app branch is the public default branch.
- Enable private vulnerability reporting and branch protection; require CI before merging.
- Make the visibility change only after the owner approves publication.

## Live deployment

- Set the HTTPS production origin at build time and protect private previews at the host.
- Verify the deployed main flow, saved scenarios, fragment links, mobile layout, reset, privacy text, robots, sitemap, and canonical URL.
- Verify runtime requests do not include financial inputs or analytics calls.
- Check performance on a representative slower device and connection. Browser emulation alone does not establish real-device performance.
- Confirm current tax rules, dated data-source labels, editable loan rates, and limitations are visible.
- Confirm the host's security updates and access-log retention settings.
