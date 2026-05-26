// LLM tool surface. Exposes JSON-Schema tool definitions compatible with
// OpenAI / Anthropic tool calling, plus a small invoker that dispatches them.

import { composeFace, expressionNames, ageNames, presentationNames, styleNames } from './api.ts';
import type { ComposeArgs } from './api.ts';

export type ToolDefinition = {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
};

// Top-level overrides schema is intentionally narrow — we surface the high-value parametric knobs
// without exposing every internal field. LLMs can call generate_face with just a preset combo,
// or fine-tune with specific overrides.
const overridesSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    head: {
      type: 'object', additionalProperties: false,
      properties: {
        width: { type: 'number', description: 'Cranium width (0.6-1.0 typical).' },
        height: { type: 'number', description: 'Cranium height (0.85-1.1 typical).' },
        jawWidth: { type: 'number', description: 'Jaw width as fraction of head width (0.5-0.75).' },
        chinDrop: { type: 'number', description: 'Chin extension below sphere (0.08-0.25).' },
        chinSharpness: { type: 'number', description: '0 round, 1 pointed.' },
      },
    },
    eyes: {
      type: 'object', additionalProperties: false,
      properties: {
        spacing: { type: 'number', description: 'Pupil spacing as fraction of head width.' },
        size: { type: 'number', description: 'Eye width as fraction of head width.' },
        openness: { type: 'number', description: '0 closed → 1 normal → 1.5 wide.' },
        tilt: { type: 'number', description: 'Outer-corner tilt in radians.' },
      },
    },
    brows: {
      type: 'object', additionalProperties: false,
      properties: {
        ridgeY: { type: 'number', description: 'Brow ridge height above eyeline (was yOffset).' },
        innerLift: { type: 'number', description: 'Inner-end Δy: positive = sad/pleading, negative = angry.' },
        outerLift: { type: 'number', description: 'Outer-end Δy: positive = surprised.' },
        arch: { type: 'number', description: 'Mid-stroke curvature.' },
        fullness: { type: 'number', description: 'Stroke weight (>0.5 reads natural; <0.3 plucked).' },
        unibrow: { type: 'number', description: '0..1, fraction inner ends meet across centerline.' },
        style: { type: 'string', enum: ['split', 'single'], description: '"single" = one confident stroke (Hergé). "split" = two parallel strokes.' },
      },
    },
    nose: {
      type: 'object', additionalProperties: false,
      properties: {
        length: { type: 'number' },
        width: { type: 'number' },
      },
    },
    mouth: {
      type: 'object', additionalProperties: false,
      properties: {
        width: { type: 'number' },
        openness: { type: 'number' },
        cornerLift: { type: 'number', description: 'Smile (+) / frown (-).' },
        upperCurve: { type: 'number' },
      },
    },
    style: {
      type: 'object', additionalProperties: false,
      properties: {
        lineWeight: { type: 'number' },
        jitter: { type: 'number' },
        color: { type: 'string' },
        background: { type: ['string', 'null'] },
        showConstruction: { type: 'boolean' },
        showSidePlanes: { type: 'boolean' },
      },
    },
    camera: {
      type: 'object', additionalProperties: false,
      properties: {
        yaw: { type: 'number', description: 'Horizontal head rotation in radians; 0 is front.' },
        pitch: { type: 'number', description: 'Vertical tilt; positive looks up.' },
        pixelHeight: { type: 'number', description: 'Rendered SVG height in px.' },
      },
    },
  },
} as const;

export const tools: ToolDefinition[] = [
  {
    name: 'generate_face',
    description:
      'Render a stylized parametric face as SVG. Combine an expression preset, an age preset, and a presentation preset, optionally fine-tuning specific parameters. Returns an SVG string.',
    input_schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        expression: {
          type: 'string', enum: expressionNames,
          description: 'Emotional expression. Faigin/Ekman-based.',
        },
        age: {
          type: 'string', enum: ageNames,
          description: 'Age category — affects cranium-to-feature proportions.',
        },
        presentation: {
          type: 'string', enum: presentationNames,
          description: 'Stylized presentation bundle (proportions only, not biology).',
        },
        style: {
          type: 'string', enum: styleNames,
          description: 'Art-style filter applied last in the parameter cascade.',
        },
        overrides: overridesSchema,
      },
    },
  },
  {
    name: 'list_face_presets',
    description: 'List all available expression, age, and presentation preset names.',
    input_schema: { type: 'object', additionalProperties: false, properties: {} },
  },
];

export type ToolResult = { ok: true; result: unknown } | { ok: false; error: string };

export const invokeTool = (name: string, args: Record<string, unknown>): ToolResult => {
  try {
    if (name === 'generate_face') {
      const svg = composeFace(args as ComposeArgs);
      return { ok: true, result: { svg } };
    }
    if (name === 'list_face_presets') {
      return {
        ok: true,
        result: {
          expressions: expressionNames,
          ages: ageNames,
          presentations: presentationNames,
          styles: styleNames,
        },
      };
    }
    return { ok: false, error: `unknown tool: ${name}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
};
