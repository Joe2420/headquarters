import type { AudioChannel, AudioEvent } from './AudioEvents';

export interface AudioPreferences {
  readonly audioEnabled: boolean;
  readonly commanderVoiceEnabled: boolean;
  readonly transitionAudioEnabled: boolean;
  readonly ceremonyAudioEnabled: boolean;
  readonly guardianAudioEnabled: boolean;
  readonly ambientAudioEnabled: boolean;
  readonly reducedAudio: boolean;
}

export const defaultAudioPreferences: AudioPreferences = {
  audioEnabled: true,
  commanderVoiceEnabled: false,
  transitionAudioEnabled: true,
  ceremonyAudioEnabled: true,
  guardianAudioEnabled: true,
  ambientAudioEnabled: false,
  reducedAudio: true,
};

export function muteAllAudioPreferences(preferences: AudioPreferences = defaultAudioPreferences): AudioPreferences {
  return {
    ...preferences,
    audioEnabled: false,
    commanderVoiceEnabled: false,
    transitionAudioEnabled: false,
    ceremonyAudioEnabled: false,
    guardianAudioEnabled: false,
    ambientAudioEnabled: false,
  };
}

export function applyReducedAudio(preferences: AudioPreferences = defaultAudioPreferences): AudioPreferences {
  return {
    ...preferences,
    ambientAudioEnabled: false,
    reducedAudio: true,
  };
}

export function isAudioChannelEnabled(channel: AudioChannel, preferences: AudioPreferences): boolean {
  if (!preferences.audioEnabled) return false;
  if (channel === 'commander') return preferences.commanderVoiceEnabled;
  if (channel === 'transition') return preferences.transitionAudioEnabled;
  if (channel === 'ceremony') return preferences.ceremonyAudioEnabled;
  if (channel === 'guardian') return preferences.guardianAudioEnabled;
  if (channel === 'ambient') return preferences.ambientAudioEnabled;
  return true;
}

export function shouldPlayAudioEvent(event: AudioEvent, preferences: AudioPreferences): boolean {
  if (!isAudioChannelEnabled(event.channel, preferences)) return false;
  if (!preferences.reducedAudio) return true;
  if (event.priority === 'critical') return true;
  return event.channel !== 'ambient' && event.priority !== 'low';
}

export function describeAudioPreferenceState(preferences: AudioPreferences): string {
  if (!preferences.audioEnabled) return 'Audio muted';
  if (preferences.reducedAudio) return 'Reduced audio';
  return 'Audio ready';
}
