export type UUID = string;
export type ISODateTime = string;

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

export type CampaignState =
  | 'planned'
  | 'active'
  | 'paused'
  | 'completed'
  | 'archived';

export type CommandAuthority =
  | 'professional'
  | 'fear'
  | 'greed'
  | 'urgency'
  | 'hope'
  | 'unknown';

export type OperatorState =
  | 'off_duty'
  | 'reporting'
  | 'in_command'
  | 'observing'
  | 'recovering';

export type Department =
  | 'commander'
  | 'guardian'
  | 'ghost'
  | 'historian'
  | 'engineer'
  | 'medical_officer'
  | 'internal_affairs'
  | 'operations'
  | 'intelligence'
  | 'archives'
  | 'hqos'
  | 'ui';

export type DoctrineConfidence = 'unverified' | 'working' | 'validated' | 'retired';

export interface Mission {
  id: UUID;
  campaignId?: UUID;
  codename: string;
  state: MissionState;
  objective?: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface Campaign {
  id: UUID;
  codename: string;
  state: CampaignState;
  objective?: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface OperatorModelSnapshot {
  id: UUID;
  missionId?: UUID;
  state: OperatorState;
  professionalAlignment: number;
  identityDrift: number;
  judgmentReserve: number;
  mentalNoise: number;
  commandAuthority: CommandAuthority;
  createdAt: ISODateTime;
}

export type OperatorSnapshot = OperatorModelSnapshot;

export interface Doctrine {
  id: UUID;
  title: string;
  summary: string;
  confidence: DoctrineConfidence;
  source: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface DepartmentMessage {
  id: UUID;
  department: Department;
  message: string;
  createdAt: ISODateTime;
  correlationId?: UUID;
}

export interface ArchiveRecord {
  id: UUID;
  missionId?: UUID;
  campaignId?: UUID;
  title: string;
  artifactType: 'event' | 'mission_report' | 'doctrine_snapshot' | 'operator_snapshot';
  createdAt: ISODateTime;
}