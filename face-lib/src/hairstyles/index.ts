// Hairstyle registry. Each entry is a `DeepPartial<FaceParams>` that ONLY
// touches the `hair` block (per pass-5 STOP HS-3). Applied as a cascade layer
// AFTER demographic (presentation → age → hairstyle) so it wins on hair
// conflicts, allowing the same hairstyle to render on any demographic.
//
// Adding a new hairstyle: drop a `.ts` file in this folder exporting a default
// DeepPartial<FaceParams>, then import + register it here. The catalog has a
// budget of 12 (pass-5 STOP HS-8) — twelve is the working illustrator's
// repertoire size per Hayashi 2000 + Bancroft 2006. Don't exceed it without
// a Leo pass to revisit the factoring.

import type { DeepPartial, FaceParams } from '../model/params.ts';
import shortSwept from './shortSwept.ts';
import shortReceding from './shortReceding.ts';
import shortPompadour from './shortPompadour.ts';
import shortPomp from './shortPomp.ts';
import spikyShort from './spikyShort.ts';
import bobChinLength from './bobChinLength.ts';
import curlyDome from './curlyDome.ts';
import longWavy from './longWavy.ts';
import longCurly from './longCurly.ts';
import longSleek from './longSleek.ts';
import longWitch from './longWitch.ts';
import longTail from './longTail.ts';
// 3D clump-volume test fixtures — Lloyd pass 1 §6. NOT aesthetic targets;
// they exercise the volume primitive in isolation. See each file's header.
import shortBob from './shortBob.ts';
import longCurtain from './longCurtain.ts';
import coilyHalo from './coilyHalo.ts';

export const hairstyles = {
  shortSwept,
  shortReceding,
  shortPompadour,
  shortPomp,
  spikyShort,
  bobChinLength,
  curlyDome,
  longWavy,
  longCurly,
  longSleek,
  longWitch,
  longTail,
  // Lloyd pass 1 §6 test fixtures (registered separately from the catalog
  // budget per HS-8 — these are fixtures, not shipping styles).
  shortBob,
  longCurtain,
  coilyHalo,
  // Future (need primitives not yet wired):
  //   evenBowl        — needs fringeBand
  //   sideForelock    — needs forelockMass
  //   longStraight    — needs longer-mass support (sideFall + napeExtension can
  //                     approximate but the front-view fall isn't quite right)
  //   longSideBangs   — needs forelockMass
  //   longWavy        — needs highlightCutout for the catch-light
  //   shortMessy      — needs regional bedhead (hair-theorist HT-4)
} as const;

export type HairstyleName = keyof typeof hairstyles;
export const hairstyleNames = Object.keys(hairstyles) as HairstyleName[];

export const hairstylePreset = (name: HairstyleName): DeepPartial<FaceParams> =>
  hairstyles[name];
