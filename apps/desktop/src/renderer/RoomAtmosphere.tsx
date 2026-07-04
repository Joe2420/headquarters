export const roomAtmosphereVariants = [
  'command',
  'ready-room',
  'observation',
  'war-room',
  'debrief',
  'archive',
  'journal',
  'doctrine',
  'academy',
  'guardian',
  'intelligence',
] as const;

export type RoomAtmosphereVariant = typeof roomAtmosphereVariants[number];

const atmosphereAliases: Record<string, RoomAtmosphereVariant> = {
  command: 'command',
  missions: 'command',
  ready: 'ready-room',
  'ready-room': 'ready-room',
  observation: 'observation',
  war: 'war-room',
  'war-room': 'war-room',
  debrief: 'debrief',
  archive: 'archive',
  journal: 'journal',
  doctrine: 'doctrine',
  academy: 'academy',
  guardian: 'guardian',
  intelligence: 'intelligence',
};

const variantElements: Partial<Record<RoomAtmosphereVariant, readonly string[]>> = {
  observation: ['radar-sweep', 'horizon-drift', 'scan-lines'],
  'war-room': ['authorization-indicator', 'hud-grid', 'countdown-rails'],
  debrief: ['theater-light', 'replay-timeline'],
};

export function normalizeRoomAtmosphereVariant(room: string): RoomAtmosphereVariant {
  return atmosphereAliases[room] ?? 'command';
}

export function RoomAtmosphere({ variant }: { readonly variant: string }) {
  const normalizedVariant = normalizeRoomAtmosphereVariant(variant);

  return (
    <div
      className={`room-atmosphere room-atmosphere--${normalizedVariant}`}
      aria-hidden="true"
      data-room-atmosphere-layer={normalizedVariant}
      data-reduced-motion-safe="true"
    >
      <span className="room-atmosphere__field" />
      <span className="room-atmosphere__signal" />
      <span className="room-atmosphere__focus" />
      {(variantElements[normalizedVariant] ?? []).map((element) => (
        <span
          key={element}
          className={`room-atmosphere__${element}`}
          data-room-atmosphere-element={element}
        />
      ))}
    </div>
  );
}
