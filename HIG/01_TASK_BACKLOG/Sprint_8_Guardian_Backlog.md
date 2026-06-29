# Sprint 8 - Guardian Backlog

Sprint Goal: Implement Guardian protective systems for rule monitoring, risk monitoring, limits, warnings, alerts, and lockouts.

---

## HIG-TASK-059 - Rule Monitoring

Scope:
- Add Guardian rule monitoring foundation.
- Keep rules explicit and deterministic.
- Do not introduce discretionary trading advice.

Acceptance Criteria:
- Rules can be evaluated consistently.
- Rule violations are represented clearly.
- Validation passes.

---

## HIG-TASK-060 - Risk Monitoring

Scope:
- Add risk monitoring behavior.
- Use approved risk inputs only.
- Keep monitoring explainable.

Acceptance Criteria:
- Risk state is deterministic.
- Missing data is handled safely.
- Validation passes.

---

## HIG-TASK-061 - Daily Limits

Scope:
- Add daily limit tracking.
- Keep limit rules configurable through approved contracts.
- Avoid broker integration unless explicitly approved.

Acceptance Criteria:
- Daily limits can be evaluated.
- Limit warnings are deterministic.
- Validation passes.

---

## HIG-TASK-062 - Session Limits

Scope:
- Add session limit tracking.
- Keep session limits separate from daily limits.
- Preserve local-first behavior.

Acceptance Criteria:
- Session limits can be evaluated.
- Session state is deterministic.
- Validation passes.

---

## HIG-TASK-063 - Psychology Warnings

Scope:
- Add psychology warning rules.
- Use behavior and journal evidence only where approved.
- Keep warning language calm and non-moralizing.

Acceptance Criteria:
- Psychology warnings are deterministic.
- Warnings do not predict market direction.
- Validation passes.

---

## HIG-TASK-064 - Guardian Alerts

Scope:
- Add Guardian alert contracts and display behavior.
- Keep alerts typed and traceable.
- Avoid notification systems unless explicitly approved.

Acceptance Criteria:
- Guardian alerts can be represented.
- Alert priority is deterministic.
- Validation passes.

---

## HIG-TASK-065 - Lockout System

Scope:
- Add lockout system foundation.
- Keep lockout rules explicit.
- Preserve future unlock workflow as separate work unless approved.

Acceptance Criteria:
- Lockout state can be represented and enforced through approved boundaries.
- Lockouts are explainable.
- Validation passes.

---

## HIG-TASK-066 - Sprint 8 Review

Scope:
- Review Guardian implementation.
- Confirm rule monitoring, risk monitoring, daily limits, session limits, psychology warnings, alerts, and lockout behavior.

Acceptance Criteria:
- Sprint 8 scope is reviewed against HIG.
- Validation passes.
- Any blockers for Sprint 9 are documented.
