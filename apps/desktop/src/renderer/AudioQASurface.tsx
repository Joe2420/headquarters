import type { AudioEvent } from './AudioEvents';
import { defaultAudioPreferences, describeAudioPreferenceState, type AudioPreferences } from './AudioPreferences';

export function AudioQASurface({
  events,
  preferences = defaultAudioPreferences,
}: {
  readonly events: readonly AudioEvent[];
  readonly preferences?: AudioPreferences | undefined;
}) {
  const preferenceState = describeAudioPreferenceState(preferences);

  return (
    <details className="audio-qa-surface" aria-label="Audio QA surface">
      <summary>Audio cue inspection</summary>
      <div className="audio-qa-surface__body">
        <p className="muted">Preference state: {preferenceState}</p>
        {events.length === 0 ? (
          <p className="muted">No pending audio events.</p>
        ) : (
          <ol aria-label="Recent audio events">
            {events.map((event) => (
              <li key={event.id}>
                <span>{event.cueId}</span>
                <small>{event.channel} / {event.priority} / {event.room}</small>
              </li>
            ))}
          </ol>
        )}
      </div>
    </details>
  );
}
