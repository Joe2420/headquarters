export type UUID = string;
export type ISODateTime = string;

export type MissionState =
  | 'created'
  | 'briefing'
  | 'ready'
  | 'observation'
  | 'authorization_requested'
  | 'authorized'
  | 'deployed'
  | 'management'
  | 'return_to_base'
  | 'debrief_pending'
  | 'archived'
  | 'closed';

export type OperatorIdentity =
  | 'professional_joe'
  | 'civilian_joe'
  | 'impatient_joe'
  | 'greedy_joe'
  | 'fearful_joe'
  | 'guardian_joe'
  | 'observer_joe'
  | 'research_joe';

export interface Mission {
  id: UUID;
  codename: string;
  state: MissionState;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface OperatorSnapshot {
  id: UUID;
  missionId?: UUID;
  capturedAt: ISODateTime;
  identity: OperatorIdentity;
  professionalAlignment: number;
  mentalNoise: number;
  judgmentReserve: number;
  commandStability: number;
}
