// ── Types ─────────────────────────────────────────────────────────────────────
type SpeechResult = {
  transcript: string;
  confidence: number;
};

export type PronunciationScore = 'perfect' | 'good' | 'understood' | 'retry';

// ── Whisper Web Worker ────────────────────────────────────────────────────────
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

  // Start downloading the Whisper model in the background immediately
  worker.postMessage({ type: 'preload' });
  return worker;
}

/** True once the Whisper model has been downloaded and is ready for inference. */
export function isWhisperReady(): boolean {
  return workerReady;
}

// Kick off the model download as soon as this module is imported
if (typeof window !== 'undefined') {
  initWorker();
}

// ── Audio Recording with Silence Detection ────────────────────────────────────

/**
 * Records from the microphone until either:
 *  - 1.2 s of silence after the user has spoken, or
 *  - maxMs has elapsed (hard ceiling)
 * Returns a 16 kHz mono Float32Array ready for Whisper.
 */
async function recordAudio(maxMs: number): Promise<Float32Array> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
  });

  return new Promise((resolve, reject) => {
    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(stream);

    // ── Silence detection via AnalyserNode ──
    const analyserCtx = new AudioContext();
    const source = analyserCtx.createMediaStreamSource(stream);
    const analyser = analyserCtx.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);

    const timeDomain = new Float32Array(analyser.fftSize);
    let silenceMs = 0;
    let hasSpeech = false;

    const silenceInterval = setInterval(() => {
      analyser.getFloatTimeDomainData(timeDomain);
      const rms = Math.sqrt(
        timeDomain.reduce((sum, x) => sum + x * x, 0) / timeDomain.length,
      );
      if (rms > 0.01) {
        hasSpeech = true;
        silenceMs = 0;
      } else if (hasSpeech) {
        silenceMs += 100;
        if (silenceMs >= 1200 && recorder.state === 'recording') {
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

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = async () => {
      cleanup();
      try {
        const blob = new Blob(chunks, { type: recorder.mimeType });
        const arrayBuf = await blob.arrayBuffer();

        // Decode whatever format the browser recorded (webm, mp4, etc.)
        const decodeCtx = new AudioContext();
        const decoded = await decodeCtx.decodeAudioData(arrayBuf);
        await decodeCtx.close();

        // Whisper expects 16 kHz — resample if the browser used something else
        let pcm: Float32Array;
        if (decoded.sampleRate === 16000) {
          pcm = decoded.getChannelData(0);
        } else {
          const offline = new OfflineAudioContext(
            1,
            Math.ceil((decoded.length / decoded.sampleRate) * 16000),
            16000,
          );
          const src = offline.createBufferSource();
          src.buffer = decoded;
          src.connect(offline.destination);
          src.start();
          const resampled = await offline.startRendering();
          pcm = resampled.getChannelData(0);
        }

        resolve(pcm);
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };

    recorder.onerror = () => {
      cleanup();
      reject(new Error('MediaRecorder error'));
    };

    recorder.start(100); // emit data every 100 ms
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

export function isSpeechRecognitionSupported(): boolean {
  return !!(
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    navigator.mediaDevices?.getUserMedia
  );
}

export function listenForSpanish(timeoutMs = 6000): Promise<SpeechResult> {
  return new Promise((resolve, reject) => {
    if (!isSpeechRecognitionSupported()) {
      reject(new Error('Speech recognition not supported'));
      return;
    }

    let settled = false;
    const settle = (result?: SpeechResult, err?: Error) => {
      if (settled) return;
      settled = true;
      if (err) reject(err);
      else resolve(result!);
    };

    // Guard: only one transcription at a time
    if (pendingRequest) {
      reject(new Error('Already listening'));
      return;
    }

    recordAudio(timeoutMs)
      .then((audio) => {
        const w = initWorker();

        pendingRequest = {
          resolve: (text) => {
            if (!text) settle(undefined, new Error('no-speech'));
            else settle({ transcript: text.toLowerCase().trim(), confidence: 0.88 });
          },
          reject: (err) => settle(undefined, err),
        };

        // Transfer the buffer to the worker (zero-copy)
        w.postMessage({ type: 'transcribe', audio }, [audio.buffer]);
      })
      .catch((err) =>
        settle(undefined, err instanceof Error ? err : new Error(String(err))),
      );
  });
}

// ── Spanish phoneme normalisation ─────────────────────────────────────────────

/** Strip accents, lowercase, remove punctuation. */
export function normalizeSpanishPhrase(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[.,!?¡¿"'`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Map a normalised Spanish string to a phonetic key that collapses sounds
 * that are identical in Latin American Spanish (seseo, yeísmo, silent-h, etc.)
 * so that "vaca" and "baca", or "zapato" and "sapato", score as equivalent.
 */
function toPhoneticKey(norm: string): string {
  return norm
    .replace(/v/g, 'b')            // b / v → same sound
    .replace(/c([ei])/g, 's$1')   // ce/ci → se/si  (seseo)
    .replace(/z/g, 's')            // z → s           (seseo)
    .replace(/ll/g, 'y')           // ll → y          (yeísmo)
    .replace(/h/g, '')             // h is silent
    .replace(/qu/g, 'k')           // qu → k
    .replace(/g([ei])/g, 'j$1')   // ge/gi → je/ji
    .replace(/x/g, 'ks');          // x → ks
}

// ── Levenshtein distance ──────────────────────────────────────────────────────
function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] =
        b[i - 1] === a[j - 1]
          ? matrix[i - 1][j - 1]
          : Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1,
            );
    }
  }
  return matrix[b.length][a.length];
}

// ── Pronunciation scoring ─────────────────────────────────────────────────────

export function scorePronunciation(
  expected: string,
  result: SpeechResult,
  isJunior = false,
): { score: PronunciationScore; stars: number } {
  const expectedNorm = normalizeSpanishPhrase(expected);
  const transcriptNorm = normalizeSpanishPhrase(result.transcript);

  const exactMatch = expectedNorm === transcriptNorm;
  const phoneticExpected = toPhoneticKey(expectedNorm);
  const phoneticTranscript = toPhoneticKey(transcriptNorm);
  const phoneticMatch = !exactMatch && phoneticExpected === phoneticTranscript;

  const conf = result.confidence ?? (exactMatch ? 0.88 : 0.45);
  const goodThreshold = isJunior ? 0.5 : 0.6;

  if (exactMatch && conf >= 0.85) return { score: 'perfect', stars: 3 };
  if (exactMatch && conf >= goodThreshold) return { score: 'good', stars: 2 };
  // Phonetic match: they pronounced it correctly even if spelled differently
  if (phoneticMatch) return { score: 'good', stars: 2 };

  // Fuzzy phonetic similarity for near-misses
  const dist = levenshtein(phoneticExpected, phoneticTranscript);
  const maxLen = Math.max(phoneticExpected.length, phoneticTranscript.length);
  const similarity = maxLen === 0 ? 1 : 1 - dist / maxLen;

  if (similarity >= 0.8) return { score: 'understood', stars: 1 };
  return { score: 'retry', stars: 0 };
}
