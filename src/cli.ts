// Command line front end for roughen(): SVG in, sketched SVG out.
//
// The point of a CLI here is that the interesting inputs are produced by other
// programs. Being able to write
//
//   mmdc -i graph.mmd -o graph.svg && mlcrough graph.svg -o sketch.svg
//
// makes mlcrough usable from a Makefile, a CI job or a documentation build
// without anyone writing a line of JavaScript.

import { FillStyle } from './core';
import { RoughenOptions, roughen } from './roughen';

declare const __MLCROUGH_VERSION__: string;

const USAGE = `mlcrough — redraw an SVG in a hand-drawn style

Usage:
  mlcrough [options] [input.svg]

Reads standard input when no input file is given, and writes standard
output unless -o is used.

Options:
  -o, --out <file>       Write the result to <file>
  -r, --roughness <n>    How rough the strokes are, 0 is smooth (default 1)
  -b, --bowing <n>       How much straight lines bow (default 1)
      --fill-style <s>   hachure, solid, zigzag, cross-hatch, dots, dashed,
                         zigzag-line, multi-hachure, multi-dots, gradient,
                         radial-gradient (default hachure)
      --fill <color>     Use this fill for every shape, ignoring the source
      --stroke <color>   Use this stroke for every shape, ignoring the source
      --stroke-width <n> Stroke width in user units
      --hachure-angle <n>  Angle of the hachure lines (default -41)
      --hachure-gap <n>    Distance between hachure lines
      --seed <n>         Seed for the sketch; 0 draws differently every run
                         (default 1, so repeated runs are identical)
      --padding <n>      User units added around the viewBox so strokes are
                         not clipped (default 2 + 2 * roughness)
      --text-background[=color]
                         Lay a plate of colour behind every label so text stays
                         readable over a hachure fill. Bare flag means white;
                         a colour is attached: --text-background=#fffdf5
      --include-defs     Also redraw shapes inside <defs>, <marker>, …
  -h, --help             Show this text
  -v, --version          Show the version

Examples:
  mlcrough diagram.svg -o sketch.svg
  mlcrough --fill-style solid --roughness 2 chart.svg > sketch.svg
  mlcrough --text-background=#fffdf5 diagram.svg -o sketch.svg
  cat chart.svg | mlcrough --seed 0 > sketch.svg
`;

const FILL_STYLES: FillStyle[] = [
  'hachure', 'solid', 'zigzag', 'cross-hatch', 'dots', 'dashed',
  'zigzag-line', 'multi-hachure', 'gradient', 'radial-gradient', 'multi-dots',
];

function fail(message: string): never {
  process.stderr.write(`mlcrough: ${message}\n`);
  process.exit(1);
}

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

/** Runs the command line tool. */
export async function main(argv: string[]): Promise<void> {
  const options: RoughenOptions = {};
  let input: string | null = null;
  let output: string | null = null;

  const number = (flag: string, raw: string | undefined): number => {
    const value = Number(raw);
    if (!raw || !Number.isFinite(value)) fail(`${flag} needs a number`);
    return value;
  };

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    // `--flag=value` as well as `--flag value`. The attached form is what
    // makes an optional value unambiguous: `--text-background file.svg` would
    // otherwise eat the input file.
    const equals = token.startsWith('--') ? token.indexOf('=') : -1;
    const arg = equals > 0 ? token.slice(0, equals) : token;
    const attached = equals > 0 ? token.slice(equals + 1) : undefined;
    const value = (): string | undefined => (attached !== undefined ? attached : argv[++i]);

    switch (arg) {
      case '-h': case '--help':
        process.stdout.write(USAGE);
        return;
      case '-v': case '--version':
        process.stdout.write(`${__MLCROUGH_VERSION__}\n`);
        return;
      case '-o': case '--out': output = value() ?? fail('-o needs a file name'); break;
      case '-r': case '--roughness': options.roughness = number(arg, value()); break;
      case '-b': case '--bowing': options.bowing = number(arg, value()); break;
      case '--stroke-width': options.strokeWidth = number(arg, value()); break;
      case '--hachure-angle': options.hachureAngle = number(arg, value()); break;
      case '--hachure-gap': options.hachureGap = number(arg, value()); break;
      case '--seed': options.seed = number(arg, value()); break;
      case '--padding': options.padding = number(arg, value()); break;
      case '--fill': options.fill = value() ?? fail('--fill needs a color'); break;
      case '--stroke': options.stroke = value() ?? fail('--stroke needs a color'); break;
      case '--include-defs': options.includeDefs = true; break;
      // Bare flag means white; a colour is given attached, as
      // `--text-background=#fffdf5`.
      case '--text-background': options.textBackground = attached ?? true; break;
      case '--fill-style': {
        const style = value() as FillStyle;
        if (!FILL_STYLES.includes(style)) fail(`unknown fill style "${style}", expected one of: ${FILL_STYLES.join(', ')}`);
        options.fillStyle = style;
        break;
      }
      default:
        if (token.startsWith('-') && token !== '-') fail(`unknown option "${arg}" — try --help`);
        if (input !== null) fail('more than one input file given');
        input = token;
    }
  }

  const fs = await import('node:fs/promises');
  let source: string;
  if (input === null || input === '-') {
    if (process.stdin.isTTY) fail('no input — give a file name or pipe an SVG in (--help)');
    source = await readStdin();
  } else {
    source = await fs.readFile(input, 'utf8').catch(() => fail(`cannot read ${input}`));
  }

  // Overriding fill or stroke means the source values must not win the merge.
  if (options.fill !== undefined || options.stroke !== undefined) {
    const forcedFill = options.fill;
    const forcedStroke = options.stroke;
    options.onShape = (): RoughenOptions => {
      const forced: RoughenOptions = {};
      if (forcedFill !== undefined) forced.fill = forcedFill;
      if (forcedStroke !== undefined) forced.stroke = forcedStroke;
      return forced;
    };
  }

  const result = roughen(source, options);
  if (output) {
    await fs.writeFile(output, result, 'utf8').catch(() => fail(`cannot write ${output}`));
  } else {
    process.stdout.write(result);
  }
}

main(process.argv.slice(2)).catch((error: unknown) => {
  fail(error instanceof Error ? error.message : String(error));
});
