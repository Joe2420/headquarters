# Mission Archive Viewer Desktop Experience

## Scope

HQ-TASK-0068 implements HIG-TASK-031 by adding a read-only viewer for archived mission summaries in the desktop Command Center.

## Boundary

- The viewer displays archived mission summaries only.
- It does not implement amendment flows.
- It does not add new persistence or archive-write behavior.
- Archive summaries remain derived from existing mission archive summary data.

## Acceptance Notes

- Empty archive state is represented safely.
- Archived mission summaries are displayed in append order.
- Summary codename, event count, and archive timestamp are visible.
- The viewer copies summary arrays before display helper output.
