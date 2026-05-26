import { writeFileSync } from 'node:fs';
import { composeFace, expressionNames, ageNames, presentationNames, styleNames, characterNames } from './api.ts';
import type { ComposeArgs, ExpressionName, AgeName, PresentationName, StyleName, CharacterName, DeepPartial, FaceParams } from './api.ts';
import { tools } from './llm-tools.ts';
import { svgToPng } from './render/raster.ts';

type Args = Map<string, string | true>;

const parseArgs = (argv: string[]): { cmd: string; args: Args; sets: Array<[string, string]> } => {
  const cmd = argv[0] ?? 'help';
  const args: Args = new Map();
  const sets: Array<[string, string]> = [];
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i] as string;
    if (a === '--set') {
      const v = argv[++i] ?? '';
      const eq = v.indexOf('=');
      if (eq === -1) throw new Error(`--set expects path=value (got "${v}")`);
      sets.push([v.slice(0, eq), v.slice(eq + 1)]);
    } else if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--') || next.startsWith('-')) {
        args.set(key, true);
      } else {
        args.set(key, next);
        i++;
      }
    } else if (a === '-o') {
      args.set('o', argv[++i] ?? '');
    } else if (a.startsWith('-')) {
      args.set(a.slice(1), true);
    }
  }
  return { cmd, args, sets };
};

const parseValue = (raw: string): unknown => {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (raw === 'null') return null;
  const n = Number(raw);
  if (!Number.isNaN(n) && raw.trim() !== '') return n;
  return raw;
};

const setPath = (obj: Record<string, unknown>, path: string, value: unknown): void => {
  const parts = path.split('.');
  let cur: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i] as string;
    if (typeof cur[k] !== 'object' || cur[k] === null) cur[k] = {};
    cur = cur[k] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1] as string] = value;
};

const usage = (): string => `face — parametric Loomis-style face renderer

USAGE
  face generate [options]
  face presets
  face tools
  face help

GENERATE OPTIONS
  --expression <name>       ${expressionNames.join(' | ')}
  --age <name>              ${ageNames.join(' | ')}
  --presentation <name>     ${presentationNames.join(' | ')}
  --style <name>            ${styleNames.join(' | ')}
  --character <name>        ${characterNames.join(' | ')}
  --yaw <radians>           camera yaw (default 0 = front)
  --pitch <radians>         camera pitch (default 0)
  --height <px>             output height in px (default 600)
  --format <svg|png>        output format (default: svg, or inferred from -o extension)
  --construction            show Loomis construction guide lines
  --side-planes             show side-plane edges
  --jitter <amount>         hand-drawn jitter amplitude in px (default 0)
  --color <hex>             primary line color
  --background <hex|null>   background fill or "null" for transparent
  --skin <hex|null>         skin fill color (null = no fill)
  --hair-color <hex|null>   hair fill color (null = outline only)
  --hair-style <name>       none | short | medium | long | bald
  --set path=value          fine-grained override (e.g. --set eyes.openness=0.5)
  -o <file>                 write to file (default: stdout). Extension .png implies PNG.

EXAMPLES
  face generate --expression angry --age adult --presentation masculine
  face generate --expression surprised --age child -o /tmp/kid.svg
  face generate --construction --set mouth.cornerLift=0.04
`;

const cmdGenerate = (args: Args, sets: Array<[string, string]>): void => {
  const compose: ComposeArgs = {};
  if (args.has('expression')) compose.expression = String(args.get('expression')) as ExpressionName;
  if (args.has('age')) compose.age = String(args.get('age')) as AgeName;
  if (args.has('presentation')) compose.presentation = String(args.get('presentation')) as PresentationName;
  if (args.has('style')) compose.style = String(args.get('style')) as StyleName;
  if (args.has('character')) compose.character = String(args.get('character')) as CharacterName;

  const overrides: DeepPartial<FaceParams> = {};
  const setOverride = (path: string, value: unknown): void => setPath(overrides as Record<string, unknown>, path, value);

  if (args.has('yaw')) setOverride('camera.yaw', Number(args.get('yaw')));
  if (args.has('pitch')) setOverride('camera.pitch', Number(args.get('pitch')));
  if (args.has('height')) setOverride('camera.pixelHeight', Number(args.get('height')));
  if (args.get('construction') === true) setOverride('style.showConstruction', true);
  if (args.get('side-planes') === true) setOverride('style.showSidePlanes', true);
  if (args.has('jitter')) setOverride('style.jitter', Number(args.get('jitter')));
  if (args.has('color')) setOverride('style.color', String(args.get('color')));
  if (args.has('background')) {
    const v = String(args.get('background'));
    setOverride('style.background', v === 'null' ? null : v);
  }
  if (args.has('skin')) {
    const v = String(args.get('skin'));
    setOverride('style.skinFill', v === 'null' ? null : v);
  }
  if (args.has('hair-color')) {
    const v = String(args.get('hair-color'));
    setOverride('style.hairFill', v === 'null' ? null : v);
  }
  if (args.has('hair-style')) setOverride('hair.style', String(args.get('hair-style')));
  for (const [path, raw] of sets) setOverride(path, parseValue(raw));

  if (Object.keys(overrides).length) compose.overrides = overrides;

  const svg = composeFace(compose);
  const out = args.get('o');
  const outPath = typeof out === 'string' ? out : '';
  const explicitFormat = args.has('format') ? String(args.get('format')).toLowerCase() : '';
  const inferredFormat = outPath.toLowerCase().endsWith('.png') ? 'png' : 'svg';
  const format = explicitFormat || inferredFormat;

  if (format !== 'svg' && format !== 'png') {
    process.stderr.write(`unknown format: ${format} (expected svg or png)\n`);
    process.exit(2);
  }

  if (format === 'png') {
    const png = svgToPng(svg);
    if (outPath) {
      writeFileSync(outPath, png);
      process.stderr.write(`wrote ${outPath} (${png.length} bytes)\n`);
    } else {
      process.stdout.write(png);
    }
  } else {
    if (outPath) {
      writeFileSync(outPath, svg);
      process.stderr.write(`wrote ${outPath}\n`);
    } else {
      process.stdout.write(svg);
    }
  }
};

const cmdPresets = (): void => {
  process.stdout.write(
    [
      'expressions:   ' + expressionNames.join(', '),
      'ages:          ' + ageNames.join(', '),
      'presentations: ' + presentationNames.join(', '),
    ].join('\n') + '\n',
  );
};

const cmdTools = (): void => {
  process.stdout.write(JSON.stringify(tools, null, 2) + '\n');
};

const main = (): void => {
  const argv = process.argv.slice(2);
  const { cmd, args, sets } = parseArgs(argv);
  switch (cmd) {
    case 'generate': cmdGenerate(args, sets); break;
    case 'presets':  cmdPresets(); break;
    case 'tools':    cmdTools(); break;
    case 'help':
    case '--help':
    case '-h':
    case undefined:
      process.stdout.write(usage());
      break;
    default:
      process.stderr.write(`unknown command: ${cmd}\n\n${usage()}`);
      process.exit(2);
  }
};

main();
