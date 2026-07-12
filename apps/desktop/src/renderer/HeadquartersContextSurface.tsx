export interface HeadquartersContextItem {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly room?: string | undefined;
}

export interface HeadquartersContextSection {
  readonly id: string;
  readonly title: string;
  readonly items: readonly HeadquartersContextItem[];
  readonly advanced?: boolean | undefined;
}

export interface HeadquartersContextSurfaceProps {
  readonly sections: readonly HeadquartersContextSection[];
  readonly showAdvanced?: boolean | undefined;
}

export function HeadquartersContextSurface({
  sections,
  showAdvanced = false,
}: HeadquartersContextSurfaceProps) {
  const visibleSections = sections.filter((section) => !section.advanced || showAdvanced);

  return (
    <section className="headquarters-context-surface" aria-label="Secondary Headquarters context">
      <p className="section-label">Context</p>
      {visibleSections.length === 0 ? (
        <p className="headquarters-context-surface__empty">No secondary context requires attention.</p>
      ) : (
        visibleSections.map((section) => (
          <details key={section.id} open={!section.advanced}>
            <summary>{section.title}</summary>
            <ul>
              {section.items.map((item) => (
                <li key={item.id}>
                  <strong>{item.title}</strong>
                  {item.room ? <span>{item.room}</span> : null}
                  <p>{item.summary}</p>
                </li>
              ))}
            </ul>
          </details>
        ))
      )}
    </section>
  );
}
