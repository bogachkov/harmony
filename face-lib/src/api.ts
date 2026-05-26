// Public API surface for face-lib.

import type { DeepPartial, FaceParams } from './model/params.ts';
import { defaults, mergeParams } from './model/params.ts';
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
  styleNames,
  type StyleName,
} from './presets/styles.ts';
import {
  characters,
  characterPreset,
  characterNames,
  type CharacterName,
} from './characters/index.ts';

export type { FaceParams, DeepPartial };
export type { ExpressionName, AgeName, PresentationName, StyleName, CharacterName };
export { defaults, mergeParams };
export { expressions, expressionPreset, expressionNames };
export { ages, presentations, agePreset, presentationPreset, ageNames, presentationNames };
export { styles, stylePreset, styleNames };
export { characters, characterPreset, characterNames };

// One-shot: build, project, render. Accepts a fully-resolved FaceParams.
export const generateFace = (params: FaceParams): string => {
  const scaffold = buildScaffold(params);
  const curves = allCurves(scaffold, params.style.showConstruction, params.style.showSidePlanes);
  const projected = curves.map((c) => projectCurve(c, params));
  return renderSvg(projected, params);
};

// Convenience: compose presets + overrides and render in one call.
// Cascade order (each layer overrides previous):
//   defaults → STYLE → age → presentation → expression → character → overrides
// Style is FIRST so it acts as a rendering base. Demographics (age × presentation)
// then own proportions; if a demographic doesn't override a field, the style's
// default for that field stays. Expression then layers emotion. Character is
// the most specific identity. User overrides always win.
//
// (Previous order had style LAST, which collapsed all demographic variation —
// every Tintin face had the same skull. Fixed.)
export type ComposeArgs = {
  expression?: ExpressionName;
  age?: AgeName;
  presentation?: PresentationName;
  style?: StyleName;
  character?: CharacterName;
  overrides?: DeepPartial<FaceParams>;
};

export const composeFace = (args: ComposeArgs): string => {
  const params = mergeParams(
    args.style ? stylePreset(args.style) : undefined,
    args.age ? agePreset(args.age) : undefined,
    args.presentation ? presentationPreset(args.presentation) : undefined,
    args.expression ? expressionPreset(args.expression) : undefined,
    args.character ? characterPreset(args.character) : undefined,
    args.overrides,
  );
  return generateFace(params);
};
