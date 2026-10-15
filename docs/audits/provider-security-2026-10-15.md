# Provider security and Sonar coverage follow-up — 15 October 2026

## Provider checks

Read-only checks on La Maison 1888 used the live catalogue. No booking was submitted, no booking terms were accepted and no catalogue data changed. The follow-up compared production with a temporary local proxy enforcing the candidate script/connect policy. That proxy is not shipped or deployed.

- La Maison video `lS2GKpbnBWw` played to its 34-second end in production and with the candidate restrictions. This supersedes the initial inconclusive local blank-frame observation.
- The real Gourmand PDF rendered both pages in production and with the candidate restrictions.
- The TableCheck booking landing screen now rendered in production and with the candidate restrictions, including the restaurant, policy and booking controls. The initial blank modal was not consistently reproducible. Validation stopped before accepting the policy or submitting a booking; a completed reservation is not verified.
- Instagram post `DbNEUtJiSro` was available on Instagram and through its direct official embed. In the hub, its initially blank player remained unchanged after clicking Try again: Instagram had already marked the placeholder as processed. Recreating only that post's markup on retry produced a new player and successfully displayed its image and caption with the candidate restrictions. The shared script and neighbouring posts are preserved.
- A second carousel defect retained a hidden vertical scroll offset after player layout/focus changes, cropping the top of a post. The horizontal track now resets that vertical offset. Its height still follows the active post.
- Instagram itself reported that `DdQWW42D91g` might be unavailable or removed. This is not proof that it has been deleted, and its catalogue association remains unchanged. Other blank provider frames were not conclusively diagnosed; this is not a full catalogue post audit.
- The home MICHELIN film `dLBRyZ0SIdg` remained blank and exposed its fallback link both in production and with the candidate restrictions. The direct YouTube Short played. This does not establish CSP as the cause or verify the hub's API-driven film player. The parent candidate-policy audit also recorded a blocked dynamic evaluation without conclusive attribution.

Frame, worker, inline-event-handler and baseline protections remain enforced. Script/connect restrictions remain report-only pending conclusive provider checks. The candidate connect policy no longer lists Supabase: catalogue requests go through same-origin Worker endpoints. An isolated browser regression test enforces the candidate policy and checks allowed provider scripts/local requests, rejected unknown scripts/requests and rejected dynamic evaluation. It does not substitute for live provider validation.

## SonarCloud

Before CI activation, the last confirmed main analysis (15 October, 01:36) reported 216 open maintenance issues and 0.8% duplication. These are the pre-transition figures, not a new measurement after the scanner change.

The existing automatic analysis cannot import LCOV. The workflow now prepares authenticated CI analysis using the pinned official action, full Git history, scanner signature verification and `coverage/lcov.info`. Application, tooling and SQL remain in scope. Tests are classified separately. Existing editorial duplication exceptions are preserved. Only binary WebP, PNG and ICO images are additionally excluded from source scanning; SVG, application code, SQL and tooling remain analyzed.

The owner added `SONAR_TOKEN`, and `SONAR_CI_ENABLED=true` was configured on 15 October. Automatic analysis was replaced by CI analysis. [PR 111 validation attempt 2](https://github.com/minedorfbm/icdn/actions/runs/38691694398) passed, including signature verification and authenticated analysis. The scanner explicitly imported `coverage/lcov.info` and reported `QUALITY GATE STATUS: PASSED`. PR 111 was merged in `9d1c1c77dc70dcdf0aca5ad70ec5715bd365a481`.

The [subsequent main run](https://github.com/minedorfbm/icdn/actions/runs/38696013331) passed its tests and build but failed the Sonar quality gate: coverage on new code was 56.64%, below the configured 80% threshold (3,554 lines to cover; 1,541 uncovered). Overall coverage was 57.4%. LCOV import succeeded, so this was a coverage gap, not an authentication failure. At that revision, the 52 passing WebKit mobile tests did not contribute instrumented coverage.

The scanner logs also identified the previous encoding warning: 34 binary image assets were being interpreted as UTF-8 text. The fix excludes only their three binary extensions, not their directories or source neighbors. Images remain shipped by the application and checked by the existing image audit. No translation file is converted or discarded. The PL/SQL analyzer's missing data-dictionary warning is separate; this is a PostgreSQL project, and SQL remains in scope without pretending that the analyzer validates all PostgreSQL semantics.

Fork PRs never receive the Sonar secret. Missing authentication fails clearly when CI analysis is enabled. Coverage remains partial: Bun measures imported modules; the generated report lists unmeasured application files. No whole-application coverage claim is made.

## Browser coverage and Android follow-up

The follow-up runs the same 55 mobile scenarios on iPhone/WebKit and Pixel 7/Chromium. Three additional cases exercise PDF load failure/reopening, pinch commit/cancellation, and map modes/filters/tour navigation. Android emulation checks responsive layout and browser interactions; it does not certify every physical Android device or third-party provider state.

The test-only build enables Istanbul explicitly with `HUB_BROWSER_COVERAGE=1` and writes to `.output/browser-coverage`, separately from production. Playwright collects snapshots on document navigation and context teardown. Reports remap execution back to TypeScript source lines and fail if key lazy features were not measured. Sonar imports both unit and browser LCOV, retaining the existing scope and 80% new-code threshold. Unmeasured server execution and provider internals are not claimed as browser coverage.

CI checks the ordinary production build on both browser engines, then repeats those assertions with instrumentation. A separate guard rejects coverage counters in production JavaScript. Tests of the reporting tools verify that uncovered lines remain uncovered, paths stay within application source, and missing/inert collection fails clearly. Generated coverage, browser output and local Worker caches are ignored by lint, while all hand-written source stays included.

The cross-browser run exposed two stacking problems: card description text could intercept the expanded-card opener on Chromium, and the map canvas intercepted the photo-index buttons on both engines. Explicit stacking keeps the opener above descriptive text, separate action links above the opener, and the photo index above the map artwork. Colors and card content are unchanged.

The new coverage plugin brought a legacy YAML parser chain containing unpatched `sprintf-js` (GHSA-hp3w-g68c-fv3c). Pinning the already-used `js-yaml` 4.3.2 removes that obsolete chain. The coverage loader's YAML configuration path was verified with the retained `load` API; the resulting dependency audit reports no known vulnerabilities.

## Debt disposition

The prior triage remains applicable: historical SQL constants are not rewritten for cosmetic scoring, third-party embed/reduced-motion overrides remain intentional, generated route files remain generated, and sequential operations are not parallelized when ordering is required. No production migration or backup operation is included.

## Validation

PR 112 was merged as `0b80c2846f4c3960818acd53e51040f546e3e69a`. Its [main validation](https://github.com/minedorfbm/icdn/actions/runs/38714497762) passed with both coverage reports imported; the broader main quality gate now passes (85.3% new-code coverage, 0.9% duplication, zero security hotspots). The ordinary build passed 55 mobile scenarios on each browser engine and 128 unit tests. One instrumented WebKit scenario passed on retry after a browser crash. Production deployment of that revision was confirmed.

For the provider reliability follow-up, both new regression assertions first failed against the previous implementation: retry kept player attempt 1, and the carousel retained a 37-pixel vertical offset. With the fixes, the nine targeted Instagram, layout, swipe and security scenarios pass on both iPhone/WebKit and Pixel 7/Chromium. The 128 unit tests and production build pass. Emulated browser tests do not certify physical devices or third-party availability.

Earlier validation history:

125 unit tests, typecheck, lint and production build passed. The 52-test mobile suite passed with the candidate policy initially enforced. After retaining report-only rollout, the three targeted policy tests also passed. Authenticated Sonar activation is verified. Live-provider limitations above remain open.

[PR 112 validation](https://github.com/minedorfbm/icdn/actions/runs/38696825294), at revision `ded19397e45838afa66cc817553e83ed544d8281`, passed all 125 unit tests, 52 mobile tests and its Sonar quality gate. The scanner imported LCOV and no longer reported invalid UTF-8 characters in binary images. The separate PL/SQL data-dictionary warning remains. A passing PR gate does not resolve the broader main-branch coverage condition above.

References: [Sonar JavaScript coverage](https://docs.sonarsource.com/sonarqube-cloud/analyzing-source-code/test-coverage/javascript-typescript-test-coverage), [official scan action](https://github.com/SonarSource/sonarqube-scan-action).

## Remaining work

1. Diagnose the home film's API-driven player and attribute remaining candidate-policy violations before enforcing further script/connect restrictions. Keep provider availability distinct from hub defects; do not remove catalogue associations based on a transient embed failure.
2. Refresh the pinned GitHub Actions that still target deprecated Node 20 runtimes in a separate CI maintenance change, preserving immutable commit pins.
3. Continue prioritising actionable Sonar issues using the now-passing main coverage gate; retain the existing threshold and scope.
4. Resume the private catalogue export and test an isolated restore only when the owner is ready. The PostgreSQL export is postponed after authentication failures; it is not a completed backup. Storage file bytes require a separate copy.

Historical SQL literal duplication, justified Instagram/reduced-motion overrides and generated route files do not warrant cosmetic rewrites. No recurring Cloudflare polling was found in the prior idle checks; third-party iframe requests go directly to their providers.
