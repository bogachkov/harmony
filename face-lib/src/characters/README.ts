// Characters live here as DATA, never engine code. Each character is a
// `DeepPartial<FaceParams>` composed of primitives the engine already knows
// how to render. If a character cannot be expressed with the current
// parameter surface, the correct fix is to add a general primitive to the
// engine — not to tweak existing primitives until they happen to look right
// for the character.
//
// A character file should:
//   - Import the FaceParams type.
//   - Export a default-exported `DeepPartial<FaceParams>` object.
//   - Optionally export a `description` string and `references` list
//     pointing to the source material the character is based on.
//
// Characters are applied as the LAST layer of the parameter cascade
// (after style, after expression, etc.) when explicitly requested:
//
//   composeFace({ character: 'haddock', expression: 'angry' })
//
// They override anything else by design — they're the most specific layer.
//
// See `src/presets/styles.ts` for the style-preset analogue (style is a
// rendering layer; character is an identity layer).

export {};
