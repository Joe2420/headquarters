# Event Contracts v0.2

Classification: Technical  
Owner: HQOS / Engineering

## Purpose
Defines the event payloads used by HQOS. Events are the operational language of Headquarters.

All events must contain:
- `id`
- `type`
- `source`
- `severity`
- `missionId` when mission-scoped
- `timestamp`
- `payload`

## Event Families

### institution.boot.started
Source: HQOS  
Severity: white
Payload:
```json
{
  "bootMode": "normal | recovery | safe",
  "previousShutdownClean": true
}
```

### institution.boot.completed
Payload:
```json
{
  "archivesOnline": true,
  "departmentsOnline": ["commander", "guardian", "historian"],
  "integrityStatus": "secure"
}
```

### command.assumed
Payload:
```json
{
  "operatorId": "op_001",
  "commandAuthority": "Professional Joe",
  "location": "Command Chair"
}
```

### mission.created
Payload:
```json
{
  "missionId": "mis_001",
  "codename": "Operation Iron Horizon",
  "mode": "training | funded | research | simulation",
  "objective": "Protect Capital"
}
```

### mission.state.changed
Payload:
```json
{
  "missionId": "mis_001",
  "from": "observation",
  "to": "authorization",
  "reason": "Operator requested authorization"
}
```

### authorization.requested
Payload:
```json
{
  "missionId": "mis_001",
  "setupSummary": "string",
  "riskPlanned": 0.5,
  "invalidation": "string",
  "operatorJustification": "string"
}
```

### authorization.resolved
Payload:
```json
{
  "missionId": "mis_001",
  "decision": "authorized | denied | deferred",
  "confidence": 0.82,
  "evidenceRefs": ["evt_001", "beh_002", "doc_014"],
  "commanderMessage": "Mission authorization granted."
}
```

### behavior.signal.detected
Payload:
```json
{
  "signalName": "chart_switch_acceleration",
  "value": 12,
  "baseline": 4,
  "confidence": 0.91,
  "interpretation": "Operational tempo increasing"
}
```

### identity.snapshot.captured
Payload:
```json
{
  "professionalAlignment": 0.94,
  "identityLabel": "Professional Joe",
  "identityDrift": 0.06,
  "commandAuthority": "Professional Joe"
}
```

### guardian.intervention.recommended
Payload:
```json
{
  "interventionType": "stand_down | return_to_base | recovery_window | guardian_lock",
  "reason": "Historical risk profile elevated",
  "confidence": 0.88,
  "evidenceRefs": ["beh_021", "mis_084", "doc_014"]
}
```

### debrief.completed
Payload:
```json
{
  "missionId": "mis_001",
  "honestyConfidence": 0.95,
  "decisionIntegrity": 0.91,
  "missionIntegrity": 0.97
}
```

### archive.artifact.created
Payload:
```json
{
  "missionId": "mis_001",
  "artifactType": "black_box",
  "artifactId": "art_001",
  "importance": 4
}
```

## Event Severity
- white: routine
- green: healthy confirmation
- amber: attention
- red: high risk
- black: emergency / lock condition

## Acceptance Criteria
- Every event can be persisted in `mission_events` when relevant.
- Every AI intervention must cite evidence via event or archive IDs.
- Event schemas must be versioned once the implementation begins.
