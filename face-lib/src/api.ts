// Public API surface for face-lib.

import type { DeepPartial, FaceParams } from './model/params.ts';
import { applyDeclares, defaults, mergeParams } from './model/params.ts';
import { buildScaffold, allCurves } from './model/scaffold.ts';
import { projectCurve } from './render/project.ts';
import { renderSvg } from './render/svg.ts';
import {
  expressions,
  expressionPreset,
  expressionNames,
  type ExpressionName,
} from './presets/expressions.ts';
import {
  ages,
  presentations,
  agePreset,
  presentationPreset,
  ageNames,
  presentationNames,
  type AgeName,
  type PresentationName,
} from './presets/demographics.ts';
import {
  styles,
  stylePreset,
  stylePackDeclares,
  styleNames,
  type StyleName,
} from './presets/styles.ts';
import {
  characters,
  characterPreset,
  characterNames,
  type CharacterName,
} from './characters/index.ts';
import {
  hairstyles,
  hairstylePreset,
  hairstyleNames,
  type HairstyleName,
} from './hairstyles/index.ts';

export type { FaceParams, DeepPartial };
export type { ExpressionName, AgeName, PresentationName, StyleName, CharacterName, HairstyleName };
export { defaults, mergeParams };
export { expressions, expressionPreset, expressionNames };
export { ages, presentations, agePreset, presentationPreset, ageNames, presentationNames };
export { styles, stylePreset, styleNames };
export { characters, characterPreset, characterNames };
export { hairstyles, hairstylePreset, hairstyleNames };

// One-shot: build, project, render. Accepts a fully-resolved FaceParams.
export const generateFace = (params: FaceParams): string => {
  const scaffold = buildScaffold(params);
  const curves = allCurves(scaffold, params.style.showConstruction, params.style.showSidePlanes);
  const projected = curves.map((c) => projectCurve(c, params));
  return renderSvg(projected, params);
};

// Convenience: compose presets + overrides and render in one call.
// Cascade order (each layer overrides previous):
//   defaults → STYLE (substrate) → presentation → age → HAIRSTYLE → STYLE (declarative late pass) → expression → character → overrides
//
// W3 Q1 — STYLE is applied TWICE (Lloyd cascade-architecture design pass,
// research/lloyd-cascade-architecture.md §Q1). The substrate pass at slot 2
// is unchanged from prior behaviour. The declarative pass at slot 6 (post-
// hairstyle, pre-expression) re-writes ONLY the paths named in the pack's
// `declares` manifest. Default `declares: []` → no-op late pass → byte-
// identical for every existing pack. timmFlat ships a non-empty manifest
// (research/stylepack-timmFlat-spec.md pedagogy: leads = [], lidLine = 0.6,
// fillStyle = 'flat', etc.) so its assertions survive past demographic /
// hairstyle layers that would otherwise clobber them.
//
// Order rationale:
// - STYLE first: rendering substrate. Sets line weight, eye style, etc.
// - PRESENTATION next: gloss layer (lashes, lip fullness, slight jaw shape).
// - AGE after presentation: age signals (elder eye underline, child cranium
//   ratio, elder hairline recession) are the more SPECIFIC demographic axis
//   and must dominate. Otherwise "elder feminine" reads as adult feminine
//   (Pascal flagged this as demographic-axis collapse, 3/10 round).
// - HAIRSTYLE after demographic: per Leo pass 5 §2 — a hairstyle is a chosen
//   identity (a bob is a bob on any demographic). It must survive demographic
//   hair-knob defaults; therefore applied AFTER demographic so it wins on hair
//   conflicts. Hairstyle files touch only the `hair` block, so demographics
//   still drive everything else (jaw, eyes, brows, ...).
// - STYLE declarative late pass: per-pack `declares` manifest re-asserts the
//   contested-knob paths so demographic/hairstyle wins on those paths roll
//   back to the pack's pedagogy. Substrate-only packs (default/tintin/
//   ligneClaire ship []) get a no-op late pass.
// - EXPRESSION: emotion overlay.
// - CHARACTER: identity, the most specific data.
// - OVERRIDES: user always wins.
export type ComposeArgs = {
  expression?: ExpressionName;
  age?: AgeName;
  presentation?: PresentationName;
  style?: StyleName;
  hairstyle?: HairstyleName;
  character?: CharacterName;
  overrides?: DeepPartial<FaceParams>;
};

export const composeFace = (args: ComposeArgs): string => {
  // Slot-2 substrate + slot-6 late-pass — see header comment.
  const substrate = args.style ? stylePreset(args.style) : undefined;
  const declares = args.style ? stylePackDeclares(args.style) : undefined;
  const lateStyle = applyDeclares(substrate, declares);
  const params = mergeParams(
    substrate,                                                                                  // slot 2 — pack substrate
    args.presentation ? presentationPreset(args.presentation) : undefined,                      // slot 3 — presentation
    args.age ? agePreset(args.age) : undefined,                                                 // slot 4 — age
    args.hairstyle ? hairstylePreset(args.hairstyle) : undefined,                               // slot 5 — hairstyle
    lateStyle,                                                                                  // slot 6 — pack declarative late pass
    args.expression ? expressionPreset(args.expression) : undefined,                            // slot 7 — expression
    args.character ? characterPreset(args.character) : undefined,                               // slot 8 — character
    args.overrides,                                                                             // slot 9 — overrides (user always wins)
  );
  return generateFace(params);
};
