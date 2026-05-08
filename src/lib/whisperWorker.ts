/// <reference lib="webworker" />
import { pipeline, env } from '@xenova/transformers';

// Only fetch models from the Hugging Face hub, not local filesystem
env.allowLocalModels = false;

type ASRPipeline = Awaited<ReturnType<typeof pipeline>>;
let pipe: ASRPipeline | null = null;

async function getPipeline(): Promise<ASRPipeline> {
  if (!pipe) {
    pipe = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
      progress_callback: (progress: unknown) => {
        self.postMessage({ type: 'progress', progress });
      },
    });
  }
  return pipe;
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
        { language: 'es', task: 'transcribe' },
      );
      self.postMessage({ type: 'result', text: result.text?.trim() ?? '' });
    } catch (err) {
      self.postMessage({ type: 'error', error: String(err) });
    }
  }
});
