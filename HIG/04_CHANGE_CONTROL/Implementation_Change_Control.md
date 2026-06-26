# Implementation Change Control

## Purpose

The implementation must not drift away from HDR v1.0 Design Freeze.

## Change Categories

### Patch
Small correction. No architecture impact.

### Amendment
Changes behavior or specification. Requires update to HDR/HTB/HIG references.

### Exception
Temporary deviation from specification. Must include reason and expiry condition.

### Rejection
Proposed change does not fit Headquarters principles.

## Required Change Record

Every non-trivial implementation change must record:

- Change ID
- Reason
- Affected HDR references
- Affected HTB references
- Affected HIG tasks
- Risk
- Approval status

## Rule

Implementation cannot silently become the specification.

If code and specification diverge, either the code is corrected or the specification is amended deliberately.
