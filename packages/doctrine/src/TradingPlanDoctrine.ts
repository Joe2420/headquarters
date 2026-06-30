import type { DoctrineRecord } from './DoctrineRecord';

export interface TradingPlanContext {
  readonly id: string;
  readonly name: string;
}

export interface TradingPlanDoctrineReference {
  readonly tradingPlanId: string;
  readonly tradingPlanName: string;
  readonly doctrineId: string;
  readonly title: string;
  readonly summary: string;
  readonly sourceId: string;
}

export function buildTradingPlanDoctrineReferences(
  context: TradingPlanContext,
  records: readonly DoctrineRecord[],
): TradingPlanDoctrineReference[] {
  return records
    .filter((record) => record.confidence === 'validated')
    .map((record) => ({
      tradingPlanId: context.id,
      tradingPlanName: context.name,
      doctrineId: record.id,
      title: record.title,
      summary: record.summary,
      sourceId: record.source.sourceId,
    }));
}
