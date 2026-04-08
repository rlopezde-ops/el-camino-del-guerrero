import { Howl } from 'howler';

const audioCache = new Map<string, Howl>();

export function playSound(src: string, volume = 1.0): Promise<void> {
  return new Promise((resolve, reject) => {
    let sound = audioCache.get(src);
    if (!sound) {
      sound = new Howl({
        src: [src],
        volume,
        preload: true,
        onloaderror: (_id, err) => reject(err),
      });
      audioCache.set(src, sound);
    }

    sound.volume(volume);
    sound.once('end', () => resolve());
    sound.once('loaderror', (_id, err) => reject(err));
    sound.play();
  });
}

export function preloadSounds(sources: string[]): void {
  for (const src of sources) {
    if (!audioCache.has(src)) {
      const sound = new Howl({ src: [src], preload: true });
      audioCache.set(src, sound);
    }
  }
}

export function playSfx(name: 'correct' | 'incorrect' | 'combo' | 'levelup' | 'click'): void {
  const sfxMap: Record<string, string> = {
    correct: '/audio/sfx/correct.mp3',
    incorrect: '/audio/sfx/incorrect.mp3',
    combo: '/audio/sfx/combo.mp3',
    levelup: '/audio/sfx/levelup.mp3',
    click: '/audio/sfx/click.mp3',
  };

  const src = sfxMap[name];
  if (src) {
    playSound(src, 0.6).catch(() => {});
  }
}
