export interface MissionBoardProps {
  campaign: string;
  objective: string;
  condition: string;
  commandAuthority: string;
  currentState?: string;
}

export function MissionBoard(props: MissionBoardProps) {
  return (
    <section aria-label="Mission Board">
      <h1>Mission Board</h1>
      <dl>
        <dt>Campaign</dt><dd>{props.campaign}</dd>
        <dt>Mission Objective</dt><dd>{props.objective}</dd>
        <dt>Condition</dt><dd>{props.condition}</dd>
        <dt>Command Authority</dt><dd>{props.commandAuthority}</dd>
        {props.currentState ? (
          <>
            <dt>Current State</dt><dd>{props.currentState}</dd>
          </>
        ) : null}
      </dl>
    </section>
  );
}
