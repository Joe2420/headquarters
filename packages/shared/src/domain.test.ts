import { describe, expect, it } from 'vitest';
import type { Campaign, DepartmentMessage, Doctrine, Mission, OperatorModelSnapshot } from './domain';

const timestamp = '2026-06-26T18:00:00.000Z';

describe('shared domain types', () => {
  it('represent serializable mission, campaign, operator, doctrine, and department records', () => {
    const mission: Mission = {
      id: 'mission-1',
      campaignId: 'campaign-1',
      codename: 'Quiet Foundation',
      state: 'created',
      objective: 'Validate the shared domain contract.',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const campaign: Campaign = {
      id: 'campaign-1',
      codename: 'Foundation',
      state: 'active',
      objective: 'Establish repository foundations.',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const operator: OperatorModelSnapshot = {
      id: 'operator-snapshot-1',
      missionId: mission.id,
      state: 'in_command',
      professionalAlignment: 0.9,
      identityDrift: 0.1,
      judgmentReserve: 0.8,
      mentalNoise: 0.2,
      commandAuthority: 'professional',
      createdAt: timestamp,
    };

    const doctrine: Doctrine = {
      id: 'doctrine-1',
      title: 'Behavior Before Outcome',
      summary: 'Process quality is evaluated before outcome quality.',
      confidence: 'validated',
      source: 'HDR',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const message: DepartmentMessage = {
      id: 'message-1',
      department: 'hqos',
      message: 'Domain contract verified.',
      createdAt: timestamp,
    };

    expect(JSON.parse(JSON.stringify({ mission, campaign, operator, doctrine, message }))).toEqual({
      mission,
      campaign,
      operator,
      doctrine,
      message,
    });
  });
});