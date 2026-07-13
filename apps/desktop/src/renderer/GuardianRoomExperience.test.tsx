import { describe, expect, it } from 'vitest';
import { buildGuardianRoomModel, GuardianRoom } from './App';
import { renderToStaticMarkup } from 'react-dom/server';

describe('GuardianRoom experience', () => {
  it('renders a secure protection center empty state', () => {
    const html = renderToStaticMarkup(<GuardianRoom />);

    expect(html).toContain('Guardian Wing');
    expect(html).toContain('No active Guardian consequence.');
    expect(html).toContain('Capital Vault');
    expect(html).toContain('Judgment Reserve');
  });

  it('shows capital vault and judgment reserve without numeric scoring', () => {
    const model = buildGuardianRoomModel({
      mission: {
        id: 'mission-1',
        campaign: 'NQ Session',
        objective: 'Observe NQ',
        condition: 'active',
        commandAuthority: 'Commander',
        currentState: 'authorization',
        createdAt: '2026-07-13T00:00:00.000Z',
        briefingContext: {
          missionObjective: 'Observe NQ',
          marketEnvironment: 'High volatility',
          highImpactNews: 'CPI',
          personalReadiness: 'tired',
          riskParameters: '0.5%',
          successCriteria: 'Follow plan',
        },
      },
    });

    expect(model.vault.allocation).toBe('0.5%');
    expect(model.judgmentReserve.available).toBe('Reduced');
    expect(model.judgmentReserve.available).not.toMatch(/%/u);
  });

  it('renders active caution and restriction details', () => {
    const html = renderToStaticMarkup(
      <GuardianRoom
        mission={{
          id: 'mission-1',
          campaign: 'NQ Session',
          objective: 'Observe NQ',
          condition: 'active',
          commandAuthority: 'Commander',
          currentState: 'authorization',
          createdAt: '2026-07-13T00:00:00.000Z',
          briefingContext: {
            missionObjective: 'Observe NQ',
            marketEnvironment: 'High volatility',
            highImpactNews: 'CPI',
            personalReadiness: 'stressed',
            riskParameters: '',
            successCriteria: 'Follow plan',
          },
        }}
      />,
    );

    expect(html).toContain('Guardian intervention active.');
    expect(html).toContain('Risk must be declared before clean authorization.');
    expect(html).toContain('Guardian consequence requires review.');
  });

  it('keeps Guardian timeline ordered and includes recovery surface', () => {
    const model = buildGuardianRoomModel({
      journalEntries: [{
        id: 'journal-1',
        entryDate: '2026-07-13',
        rawContent: 'Recovery reviewed.',
        source: 'manual',
        attachmentReferences: [],
        classificationStatus: 'unclassified',
        createdAt: '2026-07-13T01:00:00.000Z',
        updatedAt: '2026-07-13T01:00:00.000Z',
      }],
    });

    expect(model.timeline[0]?.event).toBe('Guardian online');
    expect(model.timeline.at(-1)?.event).toBe('Lockout clear');
    expect(model.memory).toContain('Journal evidence available for behavior review');
  });
});
