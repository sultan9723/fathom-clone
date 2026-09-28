# Next worker crash repair

## Evidence and change

The active workspace was on `v2`, with its Next development server on port 3000.
Development and production both used `.next`. Earlier concurrent builds failed
with missing pages manifests and trace files while this development server was
running. This supports a build-output collision as the likely cause of the
reported intermittent Jest worker retry-limit error; the original worker's
underlying exception was not available. The error was not reproduced by the
initial HTTP request.

Updated `next.config.mjs` to use `.next-dev` only for the development-server phase
and `.next` for production build/start. Added the development directory to
`.gitignore` and its generated route types to `tsconfig.json`. Added two regression
tests for directory isolation and production build/start agreement.

Used the documented `distDir` option supported by the installed Next 15.5.26:
https://nextjs.org/docs/pages/api-reference/config/next-config-js/distDir
The installed version does not expose the newer `isolatedDevBuild` option.

Stopped only the two verified Next processes belonging to this workspace, then
restarted development on port 3000. Did not delete caches or change application
routes, shared UI primitives, fonts, motion tokens, or backend files.

## Verification

- `npm.cmd run test:run`: 99 tests pass on the active `v2` checkout.
- `npm.cmd run build`: passes while the development server remains running.
- `/`, `/meetings`, and the user's open meeting-detail URL return HTTP 200 with
  no Jest worker error during the simultaneous production build.
- The dev server log confirms successful compilation and HTTP 200 for the open
  meeting-detail page after restart.
- Existing Next ESLint plugin warning remains; initial font requests retried and
  then succeeded.

The repair is applied on the active workspace and carried onto the requested
`v2-landing` branch through the existing isolated validation worktree. Existing
uncommitted backend changes and untracked DESIGN.md are preserved.
