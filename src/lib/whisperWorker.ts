/// <reference lib="webworker" />
import { pipeline, env } from '@xenova/transformers';

// Only fetch models from the Hugging Face hub, not the local filesystem
env.allowLocalModels = false;

type ASRPipeline = Awaited<ReturnType<typeof pipeline>>;

// Singleton promise — prevents double-downloading if 'preload' and 'transcribe'
// messages arrive concurrently (both call getPipeline() before it resolves).
let pipePromise: Promise<ASRPipeline> | null = null;

function getPipeline(): Promise<ASRPipeline> {
  if (!pipePromise) {
    // whisper-tiny (~75 MB) is used here because this path is a fallback only —
    // Chrome and Safari users get the native Speech API instead. Keeping the
    // model small means faster first-load for the rare browsers that need it.
    pipePromise = pipeline(
      'automatic-speech-recognition',
      'Xenova/whisper-tiny',
      {
        progress_callback: (progress: unknown) => {
          self.postMessage({ type: 'progress', progress });
        },
      },
    ) as Promise<ASRPipeline>;

    // If the model fails to load, clear the singleton so a retry is possible
    pipePromise.catch(() => {
      pipePromise = null;
    });
  }
  return pipePromise;
}

self.addEventListener('message', async (event: MessageEvent) => {
  const { type, audio } = event.data as { type: string; audio?: Float32Array };

  if (type === 'preload') {
    try {
      await getPipeline();
      self.postMessage({ type: 'ready' });
    } catch (err) {
      self.postMessage({ type: 'error', error: String(err) });
    }
  } else if (type === 'transcribe' && audio) {
    try {
      const t = await getPipeline();
      const result = await (t as (input: Float32Array, opts: object) => Promise<{ text: string }>)(
        audio,
        {
          language: 'es',
          task: 'transcribe',
          // Don't force timestamps — we only need the transcribed text
          return_timestamps: false,
        },
      );
      self.postMessage({ type: 'result', text: result.text?.trim() ?? '' });
    } catch (err) {
      self.postMessage({ type: 'error', error: String(err) });
    }
  }
});
