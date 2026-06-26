# Core Event Contracts v0.3

Status: Engineering Ready
Owner: HQOS

## Mission Events
- mission.created
- mission.briefing_started
- mission.briefing_completed
- mission.observation_started
- mission.authorization_requested
- mission.authorized
- mission.authorization_denied
- mission.deployment_declared
- mission.objective_achieved
- mission.return_to_base_requested
- mission.completed
- mission.debrief_started
- mission.debrief_completed
- mission.archived

## Operator Events
- operator.command_assumed
- operator.command_released
- operator.identity_snapshot_recorded
- operator.identity_drift_detected
- operator.judgment_reserve_changed
- operator.readiness_report_submitted
- operator.recovery_window_started
- operator.recovery_window_completed

## Guardian Events
- guardian.protocol_activated
- guardian.intervention_recommended
- guardian.vault_secured
- guardian.unlock_requested
- guardian.success_protocol_activated
- guardian.capital_integrity_changed

## Archive Events
- archive.artifact_written
- archive.campaign_book_updated
- archive.doctrine_snapshot_saved
- archive.black_box_closed

## Environment Events
- environment.room_entered
- environment.lighting_profile_changed
- environment.audio_profile_changed
- environment.transition_started
- environment.transition_completed

## Acceptance Criteria
Every event has a schema file, a fixture, a unit test, and an event handler ownership entry.
