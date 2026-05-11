import * as piperTTS from '@mintplex-labs/piper-tts-web';

const VOICE_ID = 'es_MX-claude-high';

let currentAudio: HTMLAudioElement | null = null;
let piperFailed = false;

// Single warm-up promise. Resolves when Piper has downloaded the model AND
// completed one silent predict() to fully initialise the ORT/WASM session.
// This means speakSpanish() never cold-starts ONNX Runtime.
let sessionPromise: Promise<void> | null = null;

// ── Browser SpeechSynthesis fallback ─────────────────────────────────────────
// iOS/macOS ships a high-quality es-MX voice ("Paulina") that sounds excellent
// and requires zero downloads — we prefer it as the fallback over generic voices.

let browserVoice: SpeechSynthesisVoice | null = null;
let browserVoiceResolved = false;

function resolveBrowserVoice(): void {
  if (browserVoiceResolved || typeof speechSynthesis === 'undefined') return;
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return;
  browserVoiceResolved = true;
  browserVoice =
    // iOS Paulina — best quality es-MX voice, built into every Apple device
    voices.find((v) => v.lang === 'es-MX' && v.name.toLowerCase().includes('paulina')) ??
    voices.find((v) => v.lang === 'es-MX') ??
    voices.find((v) => v.lang === 'es-US') ??
    voices.find((v) => v.lang.startsWith('es-')) ??
    null;
  console.debug('[TTS] Browser fallback voice:', browserVoice?.name ?? 'none (lang=es-MX will still be used)');
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  speechSynthesis.onvoiceschanged = resolveBrowserVoice;
  resolveBrowserVoice();
}

function speakWithBrowser(text: string, rate: number): Promise<void> {
  return new Promise((resolve) => {
    if (typeof speechSynthesis === 'undefined') { resolve(); return; }
    resolveBrowserVoice();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-MX';
    u.rate = rate;
    if (browserVoice) u.voice = browserVoice;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    if (speechSynthesis.speaking || speechSynthesis.pending) {
      speechSynthesis.cancel();
      setTimeout(() => speechSynthesis.speak(u), 60);
    } else {
      speechSynthesis.speak(u);
    }
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

export function isTTSSupported(): boolean {
  return typeof window !== 'undefined' && typeof Audio !== 'undefined';
}

/** True once the Piper session has fully warmed up and is ready to speak. */
export function isPiperReady(): boolean {
  return !!sessionPromise && !piperFailed;
}

/**
 * Initialise Piper TTS in the background. Call once on first user interaction.
 * This downloads the ~60 MB model, then runs a silent predict() to warm up the
 * ONNX Runtime session so the first real speakSpanish() call is instant.
 * Falls back gracefully to the browser SpeechSynthesis API on any failure.
 */
export function primeTTS(): void {
  if (sessionPromise || piperFailed || typeof window === 'undefined') return;

  sessionPromise = (async () => {
    console.debug('[Piper TTS] Downloading model…');
    await piperTTS.download(VOICE_ID, (progress) => {
      console.debug('[Piper TTS] download:', progress);
    });
    console.debug('[Piper TTS] Model ready. Warming up ORT session…');
    // This predict() fully initialises onnxruntime-web + loads the ONNX graph.
    // Subsequent predict() calls reuse the cached session and are near-instant.
    await piperTTS.predict({ text: 'hola', voiceId: VOICE_ID });
    console.debug('[Piper TTS] ✓ Session warm — ready to speak.');
  })().catch((err: unknown) => {
    console.warn('[Piper TTS] Initialisation failed — using browser voice fallback.', err);
    piperFailed = true;
    sessionPromise = null;
  });
}

/**
 * Speak a Spanish phrase. Uses the Piper es_MX-claude-high neural voice when
 * the session is ready, otherwise falls back to the browser SpeechSynthesis API.
 * Always awaits the session warm-up so ORT is never cold-started mid-speech.
 */
export function speakSpanish(text: string, rate = 0.85): Promise<void> {
  return new Promise((resolve) => {
    if (!isTTSSupported()) { resolve(); return; }

    // Stop whatever is currently playing
    if (currentAudio) {
      currentAudio.pause();
      try { URL.revokeObjectURL(currentAudio.src); } catch { /* ignore */ }
      currentAudio = null;
    }
    if (typeof speechSynthesis !== 'undefined' && speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }

    // Piper unavailable — go straight to browser voice
    if (piperFailed || !sessionPromise) {
      speakWithBrowser(text, rate).then(resolve);
      return;
    }

    // Wait for the warm-up to complete, then speak
    sessionPromise
      .then(() => piperTTS.predict({ text, voiceId: VOICE_ID }))
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
      .catch((err: unknown) => {
        console.warn('[Piper TTS] predict failed — falling back to browser voice.', err);
        piperFailed = true;
        sessionPromise = null;
        speakWithBrowser(text, rate).then(resolve);
      });
  });
}
