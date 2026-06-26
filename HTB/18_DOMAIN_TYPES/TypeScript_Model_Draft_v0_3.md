# TypeScript Model Draft v0.3

Status: Draft
Owner: Domain

```ts
export type MissionState =
  | 'created'
  | 'briefing'
  | 'ready'
  | 'observation'
  | 'authorization'
  | 'authorized'
  | 'deployed'
  | 'completed'
  | 'debrief'
  | 'archived'
  | 'closed';

export interface Mission {
  id: string;
  campaignId?: string;
  codename: string;
  state: MissionState;
  objective: string;
  createdAt: string;
  updatedAt: string;
}

export interface OperatorModelSnapshot {
  id: string;
  missionId?: string;
  professionalAlignment: number;
  identityDrift: number;
  judgmentReserve: number;
  mentalNoise: number;
  commandAuthority: 'professional' | 'fear' | 'greed' | 'urgency' | 'hope' | 'unknown';
  createdAt: string;
}
```

This draft will be replaced by source-controlled TypeScript definitions during implementation.
```
