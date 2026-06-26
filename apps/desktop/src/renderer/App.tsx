import { MissionBoard } from '@headquarters/ui';

export function App() {
  return (
    <main className="hq-shell">
      <section className="security-checkpoint">
        <p className="classification">HEADQUARTERS // DEVELOPMENT BUILD</p>
        <h1>Report for Duty</h1>
        <p>Institution secure. Commander available. Guardian standing by.</p>
      </section>

      <MissionBoard
        campaign="Operation Iron Patience"
        objective="Protect Capital"
        condition="GREEN"
        commandAuthority="Professional Joe"
      />
    </main>
  );
}
