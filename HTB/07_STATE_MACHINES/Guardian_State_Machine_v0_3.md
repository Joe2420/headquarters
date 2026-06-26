# Guardian State Machine v0.3

Status: Engineering Ready
Owner: Guardian

## States
- inactive
- standby
- monitoring
- success_protocol
- intervention_recommended
- vault_secured
- unlock_pending
- lockdown
- recovered

## Transitions

### inactive -> standby
Trigger: funded_mode.enabled

### standby -> monitoring
Trigger: mission.observation_started or mission.deployment_declared

### monitoring -> success_protocol
Trigger: mission.objective_achieved and funded_mode.enabled

### monitoring -> intervention_recommended
Trigger: guardian.risk_threshold_exceeded

### success_protocol -> vault_secured
Trigger: operator.secure_vault_confirmed

### vault_secured -> unlock_pending
Trigger: operator.unlock_requested

### unlock_pending -> monitoring
Trigger: unlock.justification_accepted

### any -> lockdown
Trigger: sentinel.emergency_lockdown_requested

### lockdown -> recovered
Trigger: recovery.requirements_completed

## Guard Conditions
- daily loss limit proximity
- success burden active
- historical cascade match
- command authority compromised
- operator readiness compromised

## Acceptance Criteria
The Guardian state machine must be deterministic and fully covered by transition tests.
