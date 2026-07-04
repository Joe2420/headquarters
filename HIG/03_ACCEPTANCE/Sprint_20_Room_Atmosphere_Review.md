# Sprint 20 Room Atmosphere Review

## Scope

Sprint 20 added restrained ambient room atmosphere layers to the existing Headquarters desktop experience. The work preserved the green Commander chat, room routing, mission progression, and existing subsystem behavior.

## RoomAtmosphere Runtime Summary

`RoomAtmosphere` provides a passive visual layer behind room content. It renders by room variant, does not block interaction, and uses CSS-only ambient effects so it can remain lightweight inside the current desktop renderer.

The runtime supports:

- command
- ready-room
- observation
- war-room
- debrief
- archive
- journal
- doctrine
- academy
- guardian
- intelligence

## Observation Room Atmosphere

Observation uses calm blue and grey ambient systems: subtle radar sweep, slow horizon movement, and low-opacity scan lines. The room tone remains analytical and quiet.

Commander tone:

> Observe. Do not interfere.

## War Room Atmosphere

War Room uses tactical accents, red and amber authorization indicators, cockpit/HUD-inspired overlays, and countdown-ready rails. The room supports decision pressure without becoming arcade-like.

Commander tone:

> Authorization must come from doctrine, not pressure.

## Debrief Theater Atmosphere

Debrief Theater uses subdued warm lighting and replay/timeline visual accents. Reflection prompts receive stronger visual priority, and the room reads as evidence review rather than a dashboard.

Commander tone:

> The trade is over. The lesson is not.

## Archive Vault Atmosphere

Archive uses vault and permanent-record language with dim gold, stone, and steel tones. Archive records are visually framed as preserved evidence rather than ordinary list items.

Commander tone:

> Evidence secured. History preserved.

## Journal And Doctrine Atmosphere

Journal now has a focused writing/logbook tone with warm lamp-like treatment and quiet linework behind the writing surface.

Doctrine now has an institutional memory chamber tone, with formal visual framing around doctrine candidates and records.

## Academy, Guardian, And Intelligence Atmosphere

Academy uses training-grid and recognition glow accents so progress feels earned rather than numeric-first.

Guardian uses security-grid and risk-beacon accents so warnings feel serious without panic.

Intelligence uses map and connection-line visual language for pattern analysis.

## Reduced Motion Confirmation

All atmosphere layers rely on CSS transforms, opacity, and background effects. The existing `prefers-reduced-motion: reduce` rules disable continuous animation and preserve static room identity.

## Remaining Gaps

- Atmospheres are visual-only and do not include audio.
- Room-specific sound hooks remain future work.
- Commander voice style can be further refined per room.
- Atmosphere tokens can be consolidated if the design system grows.

## Sprint 21 Recommendation

Sprint 21 should focus on Commander Voice and Audio Hooks. Audio should remain event-driven and opt-in, with no shipped sounds until the hook contract and reduced-motion/reduced-sound behavior are approved.
