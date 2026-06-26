# Event Catalog

## Introduction

The Event Catalog defines the governance standard for Headquarters events. The source-controlled event registry in `packages/shared/src/eventRegistry.ts` is the implementation source of truth for event identifiers, categories, metadata, and payload mappings.

## Event Ownership Standard

Every event must define:

* Owner
* Producers
* Consumers
* Category
* Priority
* Version
* Payload Type
* Validation Rules

No event may exist without a clearly defined owner.

The owner is responsible for the event's lifecycle and semantic meaning.

---

## Implementation Reference

Event ownership metadata is maintained in `EVENT_REGISTRY`. Runtime buses, services, departments, repositories, and UI surfaces must consume event identifiers from the registry rather than redefining event names locally.