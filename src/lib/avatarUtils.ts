import { createAvatar } from '@dicebear/core';
import { bigEars } from '@dicebear/collection';

export const SKIN_TONES  = ['#fde2b3', '#e8c99b', '#d4a574', '#c68642', '#8d5524', '#5c3310'];
export const HAIR_COLORS = ['#2c1b0e', '#5a3825', '#8b4513', '#cd853f', '#daa520', '#c0392b', '#2c3e50', '#e74c3c'];

export const HAIR_VARIANTS = [
  'short04', 'short08', 'short12', 'short16',
  'long04',  'long08',  'long12',  'long16',
];

export const FACE_COMBOS = [
  { eyes: 'variant01', mouth: 'variant0101' },
  { eyes: 'variant06', mouth: 'variant0201' },
  { eyes: 'variant11', mouth: 'variant0301' },
  { eyes: 'variant16', mouth: 'variant0401' },
  { eyes: 'variant21', mouth: 'variant0501' },
  { eyes: 'variant26', mouth: 'variant0601' },
];

export interface AvatarOptions {
  head: number;
  hair: number;
  skinTone: number;
}

/** Returns a data URL for a DiceBear Big Ears avatar. */
export function buildAvatarDataUrl(opts: AvatarOptions): string {
  const face        = FACE_COMBOS[opts.head % FACE_COMBOS.length];
  const hairVariant = HAIR_VARIANTS[opts.hair % HAIR_VARIANTS.length];
  const skinHex     = SKIN_TONES[opts.skinTone % SKIN_TONES.length].slice(1);
  const hairHex     = HAIR_COLORS[opts.hair % HAIR_COLORS.length].slice(1);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svg = createAvatar(bigEars, {
    seed:            `warrior-${opts.head}-${opts.hair}-${opts.skinTone}`,
    skinColor:       [skinHex]       as any,
    hairColor:       [hairHex]       as any,
    hair:            [hairVariant]   as any,
    eyes:            [face.eyes]     as any,
    mouth:           [face.mouth]    as any,
    backgroundColor: ['transparent'] as any,
  } as object).toString();

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
