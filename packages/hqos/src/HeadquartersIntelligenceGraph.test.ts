import {
  createHeadquartersIntelligenceGraph,
  createIntelligenceEdge,
  createIntelligenceGraphSnapshot,
  createIntelligenceNode,
} from './HeadquartersIntelligenceGraph';
import { describe, expect, it } from 'vitest';

const evidence = {
  evidenceId: 'mission-1:evaluation',
  sourceSubsystem: 'mission',
  sourceEntityId: 'mission-1',
  description: 'Mission evaluation exists.',
};

describe('HeadquartersIntelligenceGraph', () => {
  it('creates deterministic nodes from authoritative source evidence', () => {
    const first = createIntelligenceNode({
      nodeType: 'mission',
      sourceEntityId: 'mission-1',
      sourceSubsystem: 'mission',
      missionId: 'mission-1',
      title: 'Mission 1',
      summary: 'Archived mission.',
      createdAt: '2026-07-13T00:00:00.000Z',
      evidenceReferences: [evidence],
      tags: ['archive', 'mission'],
    });
    const second = createIntelligenceNode({ ...first, nodeId: undefined });

    expect(first.nodeId).toBe('node:mission:mission:mission-1:mission-1');
    expect(second.nodeId).toBe(first.nodeId);
    expect(first.evidenceReferences[0]).not.toBe(evidence);
  });

  it('creates deterministic edges and preserves directionality', () => {
    const edge = createIntelligenceEdge({
      fromNodeId: 'node:mission',
      toNodeId: 'node:evaluation',
      edgeType: 'produced',
      direction: 'directed',
      explanation: 'Mission produced its evaluation.',
      evidenceReferences: [evidence],
      strength: 'supported',
      createdAt: '2026-07-13T00:00:00.000Z',
      sourceRule: 'mission-evaluation-link',
      status: 'active',
    });

    expect(edge.edgeId).toBe('edge:node-mission:node-evaluation:produced:directed:mission-evaluation-link');
    expect(edge.direction).toBe('directed');
  });

  it('rejects unsupported edges and missing evidence references', () => {
    expect(() => createIntelligenceEdge({
      fromNodeId: 'a',
      toNodeId: 'b',
      edgeType: 'supported_by',
      direction: 'directed',
      explanation: 'Invalid strength.',
      evidenceReferences: [evidence],
      strength: 'certain' as never,
      createdAt: '2026-07-13T00:00:00.000Z',
      sourceRule: 'test',
      status: 'active',
    })).toThrow('Unsupported intelligence edge strength');

    expect(() => createIntelligenceNode({
      nodeType: 'mission',
      sourceEntityId: 'mission-1',
      sourceSubsystem: 'mission',
      title: 'Mission 1',
      summary: 'No evidence.',
      createdAt: '2026-07-13T00:00:00.000Z',
      evidenceReferences: [],
      tags: [],
    })).toThrow('requires evidence references');
  });

  it('deduplicates nodes and edges in immutable graph snapshots', () => {
    const node = {
      nodeType: 'mission' as const,
      sourceEntityId: 'mission-1',
      sourceSubsystem: 'mission',
      missionId: 'mission-1',
      title: 'Mission 1',
      summary: 'Archived mission.',
      createdAt: '2026-07-13T00:00:00.000Z',
      evidenceReferences: [evidence],
      tags: ['mission'],
    };
    const edge = {
      fromNodeId: 'node:mission:mission:mission-1:mission-1',
      toNodeId: 'node:mission:mission:mission-1:mission-1',
      edgeType: 'referenced' as const,
      direction: 'bidirectional' as const,
      explanation: 'Self-reference for dedupe test.',
      evidenceReferences: [evidence],
      strength: 'weak' as const,
      createdAt: '2026-07-13T00:00:00.000Z',
      sourceRule: 'dedupe-test',
      status: 'active' as const,
    };

    const snapshot = createIntelligenceGraphSnapshot({
      createdAt: '2026-07-13T00:00:00.000Z',
      nodes: [node, node],
      edges: [edge, edge],
    });
    const graph = createHeadquartersIntelligenceGraph(snapshot);

    expect(graph.nodes).toHaveLength(1);
    expect(graph.edges).toHaveLength(1);
    expect(Object.isFrozen(graph.nodes)).toBe(true);
    expect(Object.isFrozen(graph.query({ missionId: 'mission-1' }).nodes)).toBe(true);
  });
});
