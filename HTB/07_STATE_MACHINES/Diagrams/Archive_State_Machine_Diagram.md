# Archive State Machine Diagram

```mermaid
stateDiagram-v2
    [*] --> Pending
    Pending --> Collecting: mission.closed
    Collecting --> GeneratingReports: artifacts.requested
    GeneratingReports --> Verifying: reports.generated
    Verifying --> Archived: integrity.check.passed
    Verifying --> EngineeringReview: integrity.check.failed
    EngineeringReview --> Verifying: issue.resolved
    Archived --> [*]
```
