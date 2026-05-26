// Registry of character data files. Each entry is a `DeepPartial<FaceParams>`
// applied as the LAST layer of the parameter cascade (after style/expression/
// demographics), so character data wins over everything else by design.
//
// Adding a new character: drop a `.ts` file in this folder exporting a default
// DeepPartial<FaceParams>, then import + register it here.

import type { DeepPartial, FaceParams } from '../model/params.ts';
import haddock from './haddock.ts';

export const characters = {
  haddock,
} as const;

export type CharacterName = keyof typeof characters;
export const characterNames = Object.keys(characters) as CharacterName[];

export const characterPreset = (name: CharacterName): DeepPartial<FaceParams> =>
  characters[name];
