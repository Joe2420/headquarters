# Asset Pipeline v0.3

Status: Engineering Ready
Owner: Assets

## Purpose
Defines how room backgrounds, sounds, icons, textures, and animation assets enter the project.

## Asset Manifest
Every asset receives:
- asset_id
- filename
- type
- owner
- room/system
- license/source
- usage notes
- fallback

## Asset Categories
- audio_mechanical
- audio_ambient
- audio_voice
- lighting_profile
- room_background
- icon
- texture
- motion_preset

## Acceptance Criteria
No asset ships without manifest metadata and license status.
