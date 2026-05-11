// ── Types ─────────────────────────────────────────────────────────────────────
type SpeechResult = {
  transcript: string;
  confidence: number;
};

export type PronunciationScore = 'perfect' | 'good' | 'understood' | 'retry';

// ── Native SpeechRecognition (primary path) ───────────────────────────────────
// Chrome, Safari ≥14.5, Edge — instant, no download, excellent Spanish accuracy.
// Uses the browser's built-in ASR (Google Cloud in Chrome, Apple in Safari).
// This is the right primary for an online learning app; Whisper is the fallback
// for browsers that don't support it (Firefox) or offline sessions.

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

function getNativeSpeechRecognition(): typeof SpeechRecognition | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

function listenWithNativeAPI(timeoutMs: number): Promise<SpeechResult> {
  return new Promise((resolve, reject) => {
    const SpeechRec = getNativeSpeechRecognition();
    if (!SpeechRec) { reject(new Error('not-supported')); return; }

    const recognition = new SpeechRec();
    recognition.lang = 'es-MX';
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;
    recognition.continuous = false;

    let finished = false;
    const finish = (result?: SpeechResult, err?: Error) => {
      if (finished) return;
      finished = true;
      clearTimeout(hardTimeout);
      if (err) reject(err);
      else resolve(result!);
    };

    // Hard ceiling in case the browser never fires onend
    const hardTimeout = setTimeout(() => {
      try { recognition.stop(); } catch { /* ignore */ }
      finish(undefined, new Error('no-speech'));
    }, timeoutMs);

    recognition.onresult = (event) => {
      const best = event.results[0][0];
      finish({
        transcript: best.transcript.toLowerCase().trim(),
        // Native API gives real 0–1 confidence; use it directly
        confidence: best.confidence > 0 ? best.confidence : 0.88,
      });
    };

    recognition.onerror = (event) => {
      const code = event.error as string;
      if (code === 'no-speech') finish(undefined, new Error('no-speech'));
      else if (code === 'not-allowed' || code === 'service-not-allowed')
        finish(undefined, new Error('not-allowed'));
      else if (code === 'network') finish(undefined, new Error('network'));
      else finish(undefined, new Error(code));
    };

    // onend fires after onresult — only reject here if we never got a result
    recognition.onend = () => {
      finish(undefined, new Error('no-speech'));
    };

    try {
      recognition.start();
    } catch (err) {
      finish(undefined, err instanceof Error ? err : new Error(String(err)));
    }
  });
}

// ── Whisper Web Worker (offline fallback) ─────────────────────────────────────
// Used only when native SpeechRecognition is unavailable (Firefox, offline mode).
// whisper-base is ~145 MB — loads once, cached by the browser thereafter.

type WorkerMsg =
  | { type: 'ready' }
  | { type: 'result'; text: string }
  | { type: 'error'; error: string }
  | { type: 'progress'; progress: unknown };

type PendingRequest = {
  resolve: (text: string) => void;
  reject: (err: Error) => void;
};

let worker: Worker | null = null;
let workerReady = false;
let pendingRequest: PendingRequest | null = null;
const readyCallbacks: Array<() => void> = [];

function initWorker(): Worker {
  if (worker) return worker;

  worker = new Worker(new URL('./whisperWorker.ts', import.meta.url), {
    type: 'module',
  });

  worker.onmessage = (event: MessageEvent<WorkerMsg>) => {
    const msg = event.data;
    if (msg.type === 'ready') {
      workerReady = true;
      readyCallbacks.splice(0).forEach((cb) => cb());
    } else if (msg.type === 'result') {
      const req = pendingRequest;
      pendingRequest = null;
      req?.resolve(msg.text);
    } else if (msg.type === 'error') {
      const req = pendingRequest;
      pendingRequest = null;
      req?.reject(new Error(msg.error));
    }
  };

  worker.postMessage({ type: 'preload' });
  return worker;
}

/** True once the Whisper model has been downloaded and is ready for inference. */
export function isWhisperReady(): boolean {
  return workerReady;
}

/**
 * Resolves when the Whisper worker is ready, or rejects after timeoutMs.
 * Never blocks indefinitely — if the model is still downloading we time out.
 */
function waitForWorkerReady(timeoutMs = 20000): Promise<void> {
  if (workerReady) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('whisper-not-ready')),
      timeoutMs,
    );
    readyCallbacks.push(() => {
      clearTimeout(timer);
      resolve();
    });
  });
}

// Silence-detection constants for Whisper path (not used in native API path)
const SPEECH_ONSET_RMS = 0.006;
const SILENCE_RMS      = 0.004;
const SILENCE_GAP_MS   = 1500;
const MIN_SPEECH_MS    = 300;

const PREFERRED_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
  '',
];

function getBestMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  return PREFERRED_MIME_TYPES.find((t) => !t || MediaRecorder.isTypeSupported(t)) ?? '';
}

async function recordAudio(maxMs: number): Promise<Float32Array> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
  });

  return new Promise((resolve, reject) => {
    const chunks: Blob[] = [];
    const mimeType = getBestMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});

    const analyserCtx = new AudioContext();
    const source = analyserCtx.createMediaStreamSource(stream);
    const analyser = analyserCtx.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);

    const timeDomain = new Float32Array(analyser.fftSize);
    let silenceMs = 0;
    let hasSpeech = false;
    let peakRms = 0;

    const silenceInterval = setInterval(() => {
      analyser.getFloatTimeDomainData(timeDomain);
      const rms = Math.sqrt(timeDomain.reduce((s, x) => s + x * x, 0) / timeDomain.length);
      peakRms = Math.max(peakRms * 0.92, rms);

      if (peakRms > SPEECH_ONSET_RMS) {
        hasSpeech = true;
        silenceMs = 0;
      } else if (hasSpeech && peakRms < SILENCE_RMS) {
        silenceMs += 100;
        if (silenceMs >= SILENCE_GAP_MS && recorder.state === 'recording') {
          recorder.stop();
        }
      }
    }, 100);

    const maxTimeout = setTimeout(() => {
      if (recorder.state === 'recording') recorder.stop();
    }, maxMs);

    const cleanup = () => {
      clearInterval(silenceInterval);
      clearTimeout(maxTimeout);
      stream.getTracks().forEach((t) => t.stop());
      analyserCtx.close().catch(() => {});
    };

    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

    recorder.onstop = async () => {
      cleanup();
      try {
        const blob = new Blob(chunks, { type: recorder.mimeType || mimeType });
        if (blob.size < 1000) { reject(new Error('no-speech')); return; }

        const arrayBuf = await blob.arrayBuffer();
        const decodeCtx = new AudioContext();
        let decoded: AudioBuffer;
        try { decoded = await decodeCtx.decodeAudioData(arrayBuf); }
        finally { await decodeCtx.close(); }

        if ((decoded.length / decoded.sampleRate) * 1000 < MIN_SPEECH_MS) {
          reject(new Error('no-speech')); return;
        }

        let pcm: Float32Array;
        if (decoded.sampleRate === 16000) {
          pcm = decoded.getChannelData(0);
        } else {
          const len = Math.max(1, Math.ceil((decoded.length / decoded.sampleRate) * 16000));
          const offline = new OfflineAudioContext(1, len, 16000);
          const src = offline.createBufferSource();
          src.buffer = decoded;
          src.connect(offline.destination);
          src.start();
          pcm = (await offline.startRendering()).getChannelData(0);
        }
        resolve(pcm);
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };

    recorder.onerror = () => { cleanup(); reject(new Error('MediaRecorder error')); };
    recorder.start(100);
  });
}

const WHISPER_NOISE_TOKENS = new Set([
  '[blank_audio]', '[inaudible]', '[silence]', '[noise]',
  '[ blank_audio ]', '[ inaudible ]',
]);

async function listenWithWhisper(timeoutMs: number): Promise<SpeechResult> {
  if (pendingRequest) throw new Error('Already listening');

  const [audio] = await Promise.all([
    recordAudio(timeoutMs),
    waitForWorkerReady(timeoutMs), // times out if model not ready
  ]);

  return new Promise((resolve, reject) => {
    const w = initWorker();
    pendingRequest = {
      resolve: (rawText) => {
        const text = rawText.toLowerCase().trim();
        if (!text || text.length < 2 || WHISPER_NOISE_TOKENS.has(text)) {
          reject(new Error('no-speech'));
        } else {
          resolve({ transcript: text, confidence: 0.88 });
        }
      },
      reject,
    };
    w.postMessage({ type: 'transcribe', audio }, [audio.buffer]);
  });
}

// Start preloading Whisper in background if native API is unavailable.
// This way, if the user is on Firefox, the model will be ready by the time
// they reach a Kiai exercise.
if (typeof window !== 'undefined' && !getNativeSpeechRecognition()) {
  initWorker();
}

// ── Public API ────────────────────────────────────────────────────────────────

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) return false;
  return !!(getNativeSpeechRecognition() || typeof Worker !== 'undefined');
}

/** True when the browser has built-in speech recognition (Chrome, Safari, Edge).
 *  False on Firefox, Samsung Internet, and Amazon Silk — those fall back to Whisper. */
export function isNativeSpeechAvailable(): boolean {
  return !!getNativeSpeechRecognition();
}

export function listenForSpanish(timeoutMs = 8000): Promise<SpeechResult> {
  if (!isSpeechRecognitionSupported()) {
    return Promise.reject(new Error('Speech recognition not supported'));
  }

  // Native API (Chrome/Safari/Edge): instant, no download, real confidence scores
  const NativeRec = getNativeSpeechRecognition();
  if (NativeRec) {
    return listenWithNativeAPI(timeoutMs);
  }

  // Whisper fallback (Firefox / offline)
  return listenWithWhisper(timeoutMs);
}

// ── Spanish phoneme normalisation ─────────────────────────────────────────────

/**
 * Strip accents (but preserve ñ), lowercase, remove punctuation.
 * ñ → "ny" before NFD so the combining tilde is not stripped along with accents.
 */
export function normalizeSpanishPhrase(s: string): string {
  return s
    .replace(/ñ/g, 'ny')
    .replace(/Ñ/g, 'ny')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[.,!?¡¿"'`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Collapse sounds that are identical in Latin American Spanish:
 * seseo, yeísmo, silent-h, b/v merger, etc.
 */
function toPhoneticKey(norm: string): string {
  return norm
    .replace(/v/g, 'b')
    .replace(/c([ei])/g, 's$1')
    .replace(/z/g, 's')
    .replace(/ll/g, 'y')
    .replace(/h/g, '')
    .replace(/qu/g, 'k')
    .replace(/gu([ei])/g, 'g$1')
    .replace(/g([ei])/g, 'j$1')
    .replace(/x/g, 'ks');
}

// ── Levenshtein distance ──────────────────────────────────────────────────────
function levenshtein(a: string, b: string): number {
  const m: number[][] = [];
  for (let i = 0; i <= b.length; i++) m[i] = [i];
  for (let j = 0; j <= a.length; j++) m[0][j] = j;
  for (let i = 1; i <= b.length; i++)
    for (let j = 1; j <= a.length; j++)
      m[i][j] = b[i-1] === a[j-1]
        ? m[i-1][j-1]
        : Math.min(m[i-1][j-1] + 1, m[i][j-1] + 1, m[i-1][j] + 1);
  return m[b.length][a.length];
}

// ── Pronunciation scoring ─────────────────────────────────────────────────────

export function scorePronunciation(
  expected: string,
  result: SpeechResult,
  isJunior = false,
): { score: PronunciationScore; stars: number } {
  const expectedNorm    = normalizeSpanishPhrase(expected);
  const transcriptNorm  = normalizeSpanishPhrase(result.transcript);

  const exactMatch      = expectedNorm === transcriptNorm;
  const phoneticExp     = toPhoneticKey(expectedNorm);
  const phoneticActual  = toPhoneticKey(transcriptNorm);
  const phoneticMatch   = !exactMatch && phoneticExp === phoneticActual;

  const conf            = result.confidence ?? (exactMatch ? 0.88 : 0.45);
  const goodThreshold   = isJunior ? 0.5 : 0.6;

  if (exactMatch && conf >= 0.85) return { score: 'perfect', stars: 3 };
  if (exactMatch && conf >= goodThreshold) return { score: 'good', stars: 2 };
  if (phoneticMatch) return { score: 'good', stars: 2 };

  // Adaptive fuzzy threshold: short words get more leniency because one phoneme
  // error drops similarity disproportionately on a 3–5 char word.
  const dist       = levenshtein(phoneticExp, phoneticActual);
  const maxLen     = Math.max(phoneticExp.length, phoneticActual.length);
  const similarity = maxLen === 0 ? 1 : 1 - dist / maxLen;

  const fuzzyThreshold = phoneticExp.length <= 5
    ? (isJunior ? 0.55 : 0.65)
    : (isJunior ? 0.70 : 0.80);

  if (similarity >= fuzzyThreshold) return { score: 'understood', stars: 1 };
  return { score: 'retry', stars: 0 };
}
