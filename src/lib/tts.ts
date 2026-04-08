let spanishVoice: SpeechSynthesisVoice | null = null;
let voiceResolved = false;
let primed = false;

function resolveVoice(): SpeechSynthesisVoice | null {
  if (voiceResolved) return spanishVoice;

  const voices = speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  voiceResolved = true;
  spanishVoice =
    voices.find((v) => v.lang === 'es-MX') ??
    voices.find((v) => v.lang.startsWith('es-')) ??
    null;
  return spanishVoice;
}

function pollVoices(retries = 4) {
  if (resolveVoice() || retries <= 0) return;
  setTimeout(() => pollVoices(retries - 1), 250);
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  speechSynthesis.onvoiceschanged = () => {
    voiceResolved = false;
    resolveVoice();
  };
  resolveVoice();
  pollVoices();
}

export function isTTSSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * iOS Safari silently ignores speechSynthesis.speak() until a user-gesture
 * driven call has been made. Call this once from any tap/click handler
 * (e.g. selecting a warrior, starting training) to unlock the engine.
 */
export function primeTTS(): void {
  if (primed || !isTTSSupported()) return;
  primed = true;
  const u = new SpeechSynthesisUtterance('');
  u.volume = 0;
  speechSynthesis.speak(u);
}

/**
 * Speak a Spanish phrase via the browser SpeechSynthesis API.
 * Handles the iOS WebKit bug where cancel()+speak() drops the utterance
 * by only cancelling when actually speaking and adding a small delay.
 */
export function speakSpanish(text: string, rate = 0.85): Promise<void> {
  return new Promise((resolve) => {
    if (!isTTSSupported()) {
      resolve();
      return;
    }

    if (!primed) primeTTS();

    const doSpeak = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-MX';
      utterance.rate = rate;
      utterance.pitch = 1.0;

      const voice = resolveVoice();
      if (voice) utterance.voice = voice;

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      speechSynthesis.speak(utterance);
    };

    if (speechSynthesis.speaking || speechSynthesis.pending) {
      speechSynthesis.cancel();
      setTimeout(doSpeak, 60);
    } else {
      doSpeak();
    }
  });
}
