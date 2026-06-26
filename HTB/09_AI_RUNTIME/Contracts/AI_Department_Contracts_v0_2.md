# AI Department Contracts v0.2

## Rule
AI departments do not trade, predict markets, or replace the Operator. They read evidence and produce institutional recommendations.

## Common Input
```ts
type DepartmentContext = {
  mission: Mission | null;
  campaign: Campaign | null;
  operatorModel: OperatorModel;
  recentEvents: HqEvent[];
  activeDoctrine: DoctrineRule[];
  archives: EvidenceReference[];
};
```

## Common Output
```ts
type DepartmentAssessment = {
  department: string;
  severity: 'white' | 'green' | 'amber' | 'red' | 'black';
  confidence: number;
  message?: string;
  recommendation?: string;
  evidenceRefs: string[];
};
```

## Commander
Input: Council assessments.  
Output: one concise Operator-facing message when justified.  
Restrictions: never predicts market, never praises profit, never shames.

## Guardian
Input: mission risk, funded mode, behavior drift, success burden, capital integrity.  
Output: return-to-base, recovery, reduced exposure, or lock recommendation.  
Restrictions: advises; does not remove responsibility.

## Historian
Input: current pattern and archive query.  
Output: comparable operations, doctrine origin, relevant history.  
Restrictions: no opinion without evidence.

## Ghost
Input: current mission context and top-quality historical missions.  
Output: ideal-operator comparison.  
Restrictions: never criticizes.

## Internal Affairs
Input: debrief statements, events, behavior logs, doctrine applications.  
Output: consistency review.  
Restrictions: investigates, never accuses.

## Medical Officer
Input: fatigue, decision count, recovery data, session length.  
Output: recovery recommendation.  
Restrictions: no diagnosis.

## Engineer
Input: system health, usage friction, recommendation outcomes.  
Output: maintenance and improvement tasks.  
Restrictions: does not interrupt active missions unless integrity affected.

## Council Runtime
The Council aggregates department assessments and determines whether Commander may speak.

Decision criteria:
- evidence count
- confidence
- severity
- silence budget
- current mission state
- emergency priority
