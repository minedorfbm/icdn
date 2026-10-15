# Provider security and Sonar coverage follow-up — 15 October 2026

## Provider checks

Read-only checks on La Maison 1888 used the live catalogue. No booking was submitted and no catalogue data changed.

- Production YouTube playback worked. A separate local Worker check with stricter script/connect enforcement left the external frame blank, without an actionable console error. This does not establish CSP as the cause.
- The real Gourmand PDF rendered both pages in production and in the local Worker with the candidate restrictions.
- Instagram fell back for several posts. The provider itself reported that `DdQWW42D91g` might be unavailable or removed. This is not proof that it has been deleted. Other frames remained blank during the check.
- The TableCheck modal remained blank during the production check. Its public redirect reached the www host with HTTP 200 and no frame-denial header observed; booking functionality remains unverified.

Frame, worker, inline-event-handler and baseline protections remain enforced. Script/connect restrictions remain report-only pending conclusive provider checks. The candidate connect policy no longer lists Supabase: catalogue requests go through same-origin Worker endpoints. An isolated browser regression test enforces the candidate policy and checks allowed provider scripts/local requests, rejected unknown scripts/requests and rejected dynamic evaluation. It does not substitute for live provider validation.

## SonarCloud

Before CI activation, the last confirmed main analysis (15 October, 01:36) reported 216 open maintenance issues and 0.8% duplication. These are the pre-transition figures, not a new measurement after the scanner change.

The existing automatic analysis cannot import LCOV. The workflow now prepares authenticated CI analysis using the pinned official action, full Git history, scanner signature verification and `coverage/lcov.info`. Application, tooling and SQL remain in scope. Tests are classified separately. Existing editorial duplication exceptions are preserved. Only binary WebP, PNG and ICO images are additionally excluded from source scanning; SVG, application code, SQL and tooling remain analyzed.

The owner added `SONAR_TOKEN`, and `SONAR_CI_ENABLED=true` was configured on 15 October. Automatic analysis was replaced by CI analysis. [PR 111 validation attempt 2](https://github.com/minedorfbm/icdn/actions/runs/38691694398) passed, including signature verification and authenticated analysis. The scanner explicitly imported `coverage/lcov.info` and reported `QUALITY GATE STATUS: PASSED`. PR 111 was merged in `9d1c1c77dc70dcdf0aca5ad70ec5715bd365a481`.

The [subsequent main run](https://github.com/minedorfbm/icdn/actions/runs/38696013331) passed its tests and build but failed the Sonar quality gate: coverage on new code was 56.64%, below the configured 80% threshold (3,554 lines to cover; 1,541 uncovered). Overall coverage was 57.4%. LCOV import succeeded, so this is a coverage gap, not an authentication failure. The 52 WebKit mobile tests pass but do not currently contribute instrumented coverage. Prioritize meaningful coverage of map navigation, PDF handling, Instagram loading and swipe behavior; do not lower the threshold or exclude application code to hide the gap.

The scanner logs also identified the previous encoding warning: 34 binary image assets were being interpreted as UTF-8 text. The fix excludes only their three binary extensions, not their directories or source neighbors. Images remain shipped by the application and checked by the existing image audit. No translation file is converted or discarded. The PL/SQL analyzer's missing data-dictionary warning is separate; this is a PostgreSQL project, and SQL remains in scope without pretending that the analyzer validates all PostgreSQL semantics.

Fork PRs never receive the Sonar secret. Missing authentication fails clearly when CI analysis is enabled. Coverage remains partial: Bun measures imported modules; the generated report lists unmeasured application files. No whole-application coverage claim is made.

## Debt disposition

The prior triage remains applicable: historical SQL constants are not rewritten for cosmetic scoring, third-party embed/reduced-motion overrides remain intentional, generated route files remain generated, and sequential operations are not parallelized when ordering is required. No production migration or backup operation is included.

## Validation

125 unit tests, typecheck, lint and production build passed. The 52-test mobile suite passed with the candidate policy initially enforced. After retaining report-only rollout, the three targeted policy tests also passed. Authenticated Sonar activation is verified. Live-provider limitations above remain open.

[PR 112 validation](https://github.com/minedorfbm/icdn/actions/runs/38696825294), at revision `ded19397e45838afa66cc817553e83ed544d8281`, passed all 125 unit tests, 52 mobile tests and its Sonar quality gate. The scanner imported LCOV and no longer reported invalid UTF-8 characters in binary images. The separate PL/SQL data-dictionary warning remains. A passing PR gate does not resolve the broader main-branch coverage condition above.

References: [Sonar JavaScript coverage](https://docs.sonarsource.com/sonarqube-cloud/analyzing-source-code/test-coverage/javascript-typescript-test-coverage), [official scan action](https://github.com/SonarSource/sonarqube-scan-action).

## Remaining work

1. Extend coverage collection to UI behavior and add meaningful tests for remaining gaps, prioritizing map navigation, PDF handling, Instagram loading and swipe behavior. Recheck the main-branch 80% new-code threshold without lowering it. The binary-asset correction is verified in PR 112 and awaits merge.
2. Complete live Instagram and reservation checks before enforcing further script/connect restrictions. Provider availability and CSP failures must be distinguished.
3. Resume the private catalogue export and test an isolated restore when the owner is ready. The PostgreSQL export is postponed after authentication failures; it is not a completed backup. Storage file bytes require a separate copy.
4. Refresh the pinned GitHub Actions that still target deprecated Node 20 runtimes in a separate CI maintenance change, preserving immutable commit pins.

Historical SQL literal duplication, justified Instagram/reduced-motion overrides and generated route files do not warrant cosmetic rewrites. No recurring Cloudflare polling was found in the prior idle checks; third-party iframe requests go directly to their providers.
