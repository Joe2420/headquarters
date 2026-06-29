export interface MissionBoardProps {
  missionId?: string | undefined;
  campaign: string;
  objective: string;
  condition: string;
  commandAuthority: string;
  currentState?: string | undefined;
  createdAt?: string | undefined;
}

export function MissionBoard(props: MissionBoardProps) {
  return (
    <section aria-label="Mission Board" data-read-only="true">
      <h1>Mission Board</h1>
      <dl>
        {props.missionId ? (
          <>
            <dt>Mission ID</dt><dd>{props.missionId}</dd>
          </>
        ) : null}
        <dt>Campaign</dt><dd>{props.campaign}</dd>
        <dt>Mission Objective</dt><dd>{props.objective}</dd>
        <dt>Condition</dt><dd>{props.condition}</dd>
        <dt>Command Authority</dt><dd>{props.commandAuthority}</dd>
        {props.currentState ? (
          <>
            <dt>Current State</dt><dd>{props.currentState}</dd>
          </>
        ) : null}
        {props.createdAt ? (
          <>
            <dt>Created At</dt><dd>{props.createdAt}</dd>
          </>
        ) : null}
      </dl>
    </section>
  );
}
