# Provider security and Sonar coverage follow-up — 15 October 2026

## Provider checks

Read-only checks on La Maison 1888 used the live catalogue. No booking was submitted and no catalogue data changed.

- Production YouTube playback worked. A separate local Worker check with stricter script/connect enforcement left the external frame blank, without an actionable console error. This does not establish CSP as the cause.
- The real Gourmand PDF rendered both pages in production and in the local Worker with the candidate restrictions.
- Instagram fell back for several posts. The provider itself reported that `DdQWW42D91g` might be unavailable or removed. This is not proof that it has been deleted. Other frames remained blank during the check.
- The TableCheck modal remained blank during the production check. Its public redirect reached the www host with HTTP 200 and no frame-denial header observed; booking functionality remains unverified.

Frame, worker, inline-event-handler and baseline protections remain enforced. Script/connect restrictions remain report-only pending conclusive provider checks. The candidate connect policy no longer lists Supabase: catalogue requests go through same-origin Worker endpoints. An isolated browser regression test enforces the candidate policy and checks allowed provider scripts/local requests, rejected unknown scripts/requests and rejected dynamic evaluation. It does not substitute for live provider validation.

## SonarCloud

The latest main analysis visible on 15 October was successful (01:36), with 216 open maintenance issues, 0.8% duplication and no imported coverage. The latest background-task row offered scanner context but no warning action; this does not prove the earlier encoding warning is resolved. CI explicitly uses UTF-8.

The existing automatic analysis cannot import LCOV. The workflow now prepares authenticated CI analysis using the pinned official action, full Git history, scanner signature verification and `coverage/lcov.info`. Application, tooling and SQL remain in scope. Tests are classified separately. Existing editorial duplication exceptions are preserved; no new debt exclusions were added.

GitHub's repository secrets page showed no secrets. Therefore the new step is opt-in and has not run against SonarCloud. Activation requires:

1. The owner creates a limited Sonar analysis credential and stores it as the GitHub Actions secret `SONAR_TOKEN`, without sharing it in chat.
2. Once this workflow is available, disable automatic analysis for this Sonar project, set repository variable `SONAR_CI_ENABLED=true`, then run Validate hub.
3. Verify a successful CI analysis and imported coverage. If activation fails, turn the variable off and restore automatic analysis while investigating.

Fork PRs never receive the Sonar secret. Missing authentication fails clearly when CI analysis is enabled. Coverage remains partial: Bun measures imported modules; the generated report lists unmeasured application files. No whole-application coverage claim is made.

## Debt disposition

The prior triage remains applicable: historical SQL constants are not rewritten for cosmetic scoring, third-party embed/reduced-motion overrides remain intentional, generated route files remain generated, and sequential operations are not parallelized when ordering is required. No production migration or backup operation is included.

## Validation

125 unit tests, typecheck, lint and production build passed. The 52-test mobile suite passed with the candidate policy initially enforced. After retaining report-only rollout, the three targeted policy tests also passed. Live-provider limitations above remain open, as does authenticated Sonar activation.

References: [Sonar JavaScript coverage](https://docs.sonarsource.com/sonarqube-cloud/analyzing-source-code/test-coverage/javascript-typescript-test-coverage), [official scan action](https://github.com/SonarSource/sonarqube-scan-action).
