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

export type { FaceParams, DeepPartial };
export type { ExpressionName, AgeName, PresentationName };
export { defaults, mergeParams };
export { expressions, expressionPreset, expressionNames };
export { ages, presentations, agePreset, presentationPreset, ageNames, presentationNames };

// One-shot: build, project, render. Accepts a fully-resolved FaceParams.
export const generateFace = (params: FaceParams): string => {
  const scaffold = buildScaffold(params);
  const curves = allCurves(scaffold, params.style.showConstruction, params.style.showSidePlanes);
  const projected = curves.map((c) => projectCurve(c, params));
  return renderSvg(projected, params);
};

// Convenience: compose presets + overrides and render in one call.
// `expression`, `age`, `presentation` are looked up by name; `overrides` is a deep-partial patch.
export type ComposeArgs = {
  expression?: ExpressionName;
  age?: AgeName;
  presentation?: PresentationName;
  overrides?: DeepPartial<FaceParams>;
};

export const composeFace = (args: ComposeArgs): string => {
  const params = mergeParams(
    args.age ? agePreset(args.age) : undefined,
    args.presentation ? presentationPreset(args.presentation) : undefined,
    args.expression ? expressionPreset(args.expression) : undefined,
    args.overrides,
  );
  return generateFace(params);
};
