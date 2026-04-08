type SpeechResult = {
  transcript: string;
  confidence: number;
};

/** Compare spoken / built Spanish without worrying about accents or light punctuation. */
export function normalizeSpanishPhrase(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[.,!?¡¿"'`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isSpeechRecognitionSupported(): boolean {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

export function listenForSpanish(timeoutMs = 5000): Promise<SpeechResult> {
  return new Promise((resolve, reject) => {
    if (!isSpeechRecognitionSupported()) {
      reject(new Error('Speech recognition not supported'));
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'es-MX';
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;
    recognition.continuous = false;

    let settled = false;

    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        recognition.stop();
      } catch {
        /* already stopped */
      }
      reject(new Error('timeout'));
    }, timeoutMs);

    recognition.onresult = (event: any) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      const best = event.results[0][0];
      resolve({
        transcript: best.transcript.toLowerCase().trim(),
        confidence: best.confidence,
      });
    };

    recognition.onerror = (event: any) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(new Error(event.error ?? 'unknown'));
    };

    recognition.onend = () => {
      clearTimeout(timeout);
      if (!settled) {
        settled = true;
        reject(new Error('no-speech'));
      }
    };

    recognition.start();
  });
}

export type PronunciationScore = 'perfect' | 'good' | 'understood' | 'retry';

export function scorePronunciation(
  expected: string,
  result: SpeechResult,
  isJunior = false,
): { score: PronunciationScore; stars: number } {
  const expectedNorm = normalizeSpanishPhrase(expected);
  const transcriptNorm = normalizeSpanishPhrase(result.transcript);

  const exactMatch = expectedNorm === transcriptNorm;
  const goodThreshold = isJunior ? 0.5 : 0.6;
  const conf = result.confidence ?? (exactMatch ? 0.88 : 0.45);

  if (exactMatch && conf >= 0.85) {
    return { score: 'perfect', stars: 3 };
  }
  if (exactMatch && conf >= goodThreshold) {
    return { score: 'good', stars: 2 };
  }

  const distance = levenshtein(expectedNorm, transcriptNorm);
  const maxLen = Math.max(expectedNorm.length, transcriptNorm.length);
  const similarity = 1 - distance / maxLen;

  if (similarity >= 0.8) {
    return { score: 'understood', stars: 1 };
  }

  return { score: 'retry', stars: 0 };
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }
  return matrix[b.length][a.length];
}
