# Campaign State Machine v0.3

Status: Engineering Ready
Owner: Operations

## States
- drafted
- active
- under_review
- completed
- archived
- retired

## Campaign Types
- Iron Patience
- Guardian Protection
- Recovery Campaign
- Doctrine Validation
- Academy Training
- Research Campaign

## Transitions
- drafted -> active: campaign.approved
- active -> under_review: review.window_reached
- under_review -> active: review.continue_approved
- under_review -> completed: objective.completed
- completed -> archived: archive.campaign_book_written
- active -> retired: campaign.superseded

## Acceptance Criteria
Campaigns must support mission assignment, progress metrics, doctrine links, and final archive reports.
