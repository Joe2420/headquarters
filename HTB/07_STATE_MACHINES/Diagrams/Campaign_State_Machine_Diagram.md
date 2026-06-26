# Campaign State Machine Diagram

```mermaid
stateDiagram-v2
    [*] --> Planned
    Planned --> Active: campaign.started
    Active --> Review: weekly.review
    Review --> Active: campaign.continues
    Active --> Paused: recovery.required
    Paused --> Active: recovery.completed
    Active --> Completed: objective.completed
    Completed --> Archived: campaign.archived
    Archived --> [*]
```
