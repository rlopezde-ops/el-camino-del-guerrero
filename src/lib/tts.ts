import * as piperTTS from '@mintplex-labs/piper-tts-web';

const VOICE_ID = 'es_MX-claude-high';

let currentAudio: HTMLAudioElement | null = null;
let downloadStarted = false;

export function isTTSSupported(): boolean {
  // Piper needs OPFS (Origin Private File System) for model caching
  return (
    typeof window !== 'undefined' &&
    typeof AudioContext !== 'undefined' &&
    typeof navigator?.storage?.getDirectory === 'function'
  );
}

/**
 * Pre-download the Piper voice model in the background.
 * Call this once on the first user interaction so the model is cached
 * before the learner hits their first TTS button.
 */
export function primeTTS(): void {
  if (downloadStarted || !isTTSSupported()) return;
  downloadStarted = true;
  piperTTS.download(VOICE_ID, () => {
    // silent background download — no UI needed
  }).catch(() => {
    downloadStarted = false; // allow a retry next interaction
  });
}

/**
 * Speak a Spanish phrase using the Piper es_MX-claude-high voice.
 * Stops any currently playing utterance before starting the new one.
 * The `rate` parameter maps to HTMLAudioElement.playbackRate (0.85 = slightly
 * slower than normal, good for learners).
 */
export function speakSpanish(text: string, rate = 0.85): Promise<void> {
  return new Promise((resolve) => {
    if (!isTTSSupported()) {
      resolve();
      return;
    }

    // Stop whatever is currently playing
    if (currentAudio) {
      currentAudio.pause();
      try { URL.revokeObjectURL(currentAudio.src); } catch { /* ignore */ }
      currentAudio = null;
    }

    piperTTS.predict({ text, voiceId: VOICE_ID })
      .then((wav: Blob) => {
        const audio = new Audio();
        currentAudio = audio;
        audio.src = URL.createObjectURL(wav);
        audio.playbackRate = rate;

        audio.onended = () => {
          try { URL.revokeObjectURL(audio.src); } catch { /* ignore */ }
          if (currentAudio === audio) currentAudio = null;
          resolve();
        };
        audio.onerror = () => {
          try { URL.revokeObjectURL(audio.src); } catch { /* ignore */ }
          if (currentAudio === audio) currentAudio = null;
          resolve();
        };

        audio.play().catch(() => resolve());
      })
      .catch(() => resolve());
  });
}
