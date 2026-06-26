export type DepartmentId =
  | 'commander'
  | 'guardian'
  | 'historian'
  | 'ghost'
  | 'medical'
  | 'engineer'
  | 'internal_affairs'
  | 'operations'
  | 'intelligence';

export interface DepartmentSignal {
  department: DepartmentId;
  priority: 'white' | 'green' | 'amber' | 'red' | 'black';
  confidence: number;
  message: string;
  evidence: string[];
}
