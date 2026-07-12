import type { MissionReplay, ReplayEvent, ReplaySection } from '@headquarters/hqos';

export interface MissionReplayTimelineProps {
  readonly replay: MissionReplay;
  readonly expandedSections?: readonly ReplaySection[] | undefined;
  readonly currentEventId?: string | undefined;
  readonly onJump?: ((eventId: string) => void) | undefined;
}

export function MissionReplayTimeline({
  replay,
  expandedSections = replay.lifecycle,
  currentEventId,
  onJump,
}: MissionReplayTimelineProps) {
  const expanded = new Set(expandedSections);
  const bySection = groupEventsBySection(replay.timeline.events);

  return (
    <section className="mission-replay-timeline" aria-label="Mission replay timeline">
      <header>
        <p className="section-label">Mission Replay</p>
        <h2>{replay.summary.title}</h2>
        <progress value={getReplayProgress(replay.timeline.events, currentEventId)} max={100} aria-label="Replay progress" />
      </header>
      {replay.lifecycle.map((section) => (
        <details key={section} open={expanded.has(section)} data-replay-section={section}>
          <summary>{formatReplaySection(section)}</summary>
          <ol>
            {(bySection.get(section) ?? []).map((event) => (
              <li key={event.id} data-event-type={event.type} data-current={event.id === currentEventId}>
                <button type="button" onClick={() => onJump?.(event.id)}>
                  <span>{formatActor(event.actor)}</span>
                  <strong>{event.title}</strong>
                  <small>{event.occurredAt}</small>
                </button>
                <p>{event.summary}</p>
              </li>
            ))}
          </ol>
        </details>
      ))}
      {replay.timeline.bookmarks.length > 0 ? (
        <nav className="mission-replay-bookmarks" aria-label="Replay bookmarks">
          {replay.timeline.bookmarks.map((bookmark) => (
            <button key={bookmark.id} type="button" onClick={() => onJump?.(bookmark.eventId)}>
              {bookmark.label}
            </button>
          ))}
        </nav>
      ) : null}
    </section>
  );
}

export function groupEventsBySection(events: readonly ReplayEvent[]): ReadonlyMap<ReplaySection, readonly ReplayEvent[]> {
  const groups = new Map<ReplaySection, ReplayEvent[]>();
  for (const event of events) {
    const sectionEvents = groups.get(event.section) ?? [];
    sectionEvents.push(event);
    groups.set(event.section, sectionEvents);
  }

  return new Map([...groups.entries()].map(([section, sectionEvents]) => [
    section,
    Object.freeze([...sectionEvents].sort((left, right) => left.occurredAt.localeCompare(right.occurredAt) || left.id.localeCompare(right.id))),
  ]));
}

export function getReplayProgress(events: readonly ReplayEvent[], currentEventId: string | undefined): number {
  if (events.length === 0 || currentEventId === undefined) return 0;
  const index = events.findIndex((event) => event.id === currentEventId);
  if (index < 0) return 0;
  return Math.round(((index + 1) / events.length) * 100);
}

function formatReplaySection(section: ReplaySection): string {
  return section.split('-').map((part) => part[0]!.toUpperCase() + part.slice(1)).join(' ');
}

function formatActor(actor: ReplayEvent['actor']): string {
  return actor[0]!.toUpperCase() + actor.slice(1);
}
