# Journal System

Status: architecture documentation from ARCH-TASK-0001.
Source: Headquarters Journal Architecture Handoff v0.1, derived from production journal exports dated 2026-06-26.

## Purpose

The Journal System captures the Operator's daily reflection layer without collapsing it into missions, trades, or Academy progress. Its primary responsibility is to preserve the Operator's original voice while making later classification possible.

## Source Evidence

The reviewed production exports separate into three distinct sources:

| Source | Role |
|---|---|
| `journal_entries` | Daily and strategic reflections, mood, market context, motivation, and personal notes. |
| `trade_reviews` | Mission debrief evidence tied to plan adherence, emotion, lessons, and improvement. |
| `journey_entries` | Growth and XP progress records tied to behavioral development. |

## Commander's Log

`journal_entries` map to the Commander's Log and Archive. They are not trade records. They may contain market observations, personal reflection, motivation, emotional state, risk notes, or lesson signals, but those classifications are derived metadata.

Required preserved fields:

- source id
- entry date
- raw content
- raw mood
- raw market conditions
- created timestamp
- updated timestamp
- attachment references
- classification status

## Separation Rule

A daily journal entry is not a mission. A trade review is not a daily journal. A growth entry is not a trade result.

Headquarters may link these records by date, campaign, mission, or trade id, but it must store them as separate entities.

## Archive Rule

Raw journal text is immutable institutional evidence. Headquarters may classify around it, link it, tag it, and derive insight from it, but it must not rewrite or replace the user's original wording.

## Transition Rule

The existing journal remains the production source until a future approved Shadow Mode task validates import quality and operator trust. This document does not authorize import implementation.
