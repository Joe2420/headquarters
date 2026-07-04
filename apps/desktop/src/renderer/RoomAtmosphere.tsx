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
    </div>
  );
}
