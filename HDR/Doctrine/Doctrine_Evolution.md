# Doctrine Evolution

Status: architecture documentation from ARCH-TASK-0001.
Source: Headquarters Journal Architecture Handoff v0.1.

## Purpose

Doctrine Evolution defines how repeated lessons from journal and trade review evidence become Doctrine Candidates. It does not authorize automatic doctrine creation.

## Candidate Sources

Doctrine Candidates may originate from:

- `trade_reviews.lessons_learned`
- `trade_reviews.what_to_improve`
- `journal_entries.content` when lesson or rule language appears
- `journey_entries.description` when it contains a behavioral insight

## Candidate Lifecycle

```text
Raw Entry
-> Lesson Extracted
-> Doctrine Candidate
-> Evidence Collection
-> Validated Doctrine or Retired Candidate
```

## Detected Repeated Lesson Themes

The handoff identified recurring themes that justify candidate tracking:

- Wait for FVG or confirmation before entering.
- Trust the stop loss when the plan is valid.
- Avoid chasing evening moves.
- Reduce position size when certainty is lower.
- Do not trade distracted or during school/class context.
- Wait around market open and do not force pre-market entries.
- Use BTC sweep/context for alt decisions.
- Follow the trading plan instead of improvising.

## Doctrine Guardrail

One repeated phrase is not doctrine. Doctrine requires evidence, review, and approval. The first system output is always `DoctrineCandidate`, never `Doctrine`.

## Non-Implementation Rule

This document is architecture only. It does not add a doctrine engine, persistence, classifier, queue, or promotion workflow.
