// Inline SVG-path tooling — tokenizer, parser, absolutize, normalize, and
// pointsOnPath — originally lifted from `path-data-parser@0.1.0` and
// `points-on-path@0.2.1` (both MIT, Preet Shihn) and modernized so they
// run on strict-ES engines (QuickJS, Cloudflare Workers, Deno's
// `--no-legacy-regexp`, …).
//
// The only behavioural change vs. the upstream modules is that
// `tokenize()` reads capture groups from the `match()` result array
// instead of the deprecated `RegExp.$1` legacy global (ECMAScript
// Annex B). All exports are byte-equivalent to upstream for valid SVG
// path input.

export interface Segment {
  key: string;
  data: number[];
}

const COMMAND = 0;
const NUMBER = 1;
const EOD = 2;

const PARAMS: Record<string, number> = {
  A: 7, a: 7, C: 6, c: 6, H: 1, h: 1, L: 2, l: 2, M: 2, m: 2,
  Q: 4, q: 4, S: 4, s: 4, T: 2, t: 2, V: 1, v: 1, Z: 0, z: 0,
};

interface Token { type: number; text: string }

function tokenize(d: string): Token[] {
  const tokens: Token[] = [];
  while (d !== '') {
    let m: RegExpMatchArray | null;
    if ((m = d.match(/^([ \t\r\n,]+)/))) {
      d = d.slice(m[1].length);
    } else if ((m = d.match(/^([aAcChHlLmMqQsStTvVzZ])/))) {
      tokens[tokens.length] = { type: COMMAND, text: m[1] };
      d = d.slice(m[1].length);
    } else if ((m = d.match(/^(([-+]?[0-9]+(\.[0-9]*)?|[-+]?\.[0-9]+)([eE][-+]?[0-9]+)?)/))) {
      tokens[tokens.length] = { type: NUMBER, text: `${parseFloat(m[1])}` };
      d = d.slice(m[1].length);
    } else {
      return [];
    }
  }
  tokens[tokens.length] = { type: EOD, text: '' };
  return tokens;
}

function isType(token: Token, type: number): boolean {
  return token.type === type;
}

export function parsePath(d: string): Segment[] {
  const segments: Segment[] = [];
  const tokens = tokenize(d);
  let mode = 'BOD';
  let index = 0;
  let token = tokens[index];
  while (!isType(token, EOD)) {
    let paramsCount = 0;
    const params: number[] = [];
    if (mode === 'BOD') {
      if (token.text === 'M' || token.text === 'm') {
        index++;
        paramsCount = PARAMS[token.text];
        mode = token.text;
      } else {
        return parsePath('M0,0' + d);
      }
    } else if (isType(token, NUMBER)) {
      paramsCount = PARAMS[mode];
    } else {
      index++;
      paramsCount = PARAMS[token.text];
      mode = token.text;
    }
    if ((index + paramsCount) < tokens.length) {
      for (let i = index; i < index + paramsCount; i++) {
        const numberToken = tokens[i];
        if (isType(numberToken, NUMBER)) {
          params[params.length] = +numberToken.text;
        } else {
          throw new Error('Param not a number: ' + mode + ',' + numberToken.text);
        }
      }
      if (typeof PARAMS[mode] === 'number') {
        const segment: Segment = { key: mode, data: params };
        segments.push(segment);
        index += paramsCount;
        token = tokens[index];
        if (mode === 'M') mode = 'L';
        if (mode === 'm') mode = 'l';
      } else {
        throw new Error('Bad segment: ' + mode);
      }
    } else {
      throw new Error('Path data ended short');
    }
  }
  return segments;
}

export function serialize(segments: Segment[]): string {
  const tokens: (string | number)[] = [];
  for (const { key, data } of segments) {
    tokens.push(key);
    switch (key) {
      case 'C':
      case 'c':
        tokens.push(data[0], `${data[1]},`, data[2], `${data[3]},`, data[4], data[5]);
        break;
      case 'S':
      case 's':
      case 'Q':
      case 'q':
        tokens.push(data[0], `${data[1]},`, data[2], data[3]);
        break;
      default:
        tokens.push(...data);
        break;
    }
  }
  return tokens.join(' ');
}

// ── absolutize ───────────────────────────────────────────────────────
// Translate relative commands to absolute commands.

export function absolutize(segments: Segment[]): Segment[] {
  let cx = 0, cy = 0;
  let subx = 0, suby = 0;
  const out: Segment[] = [];
  for (const { key, data } of segments) {
    switch (key) {
      case 'M':
        out.push({ key: 'M', data: [...data] });
        [cx, cy] = data;
        [subx, suby] = data;
        break;
      case 'm':
        cx += data[0];
        cy += data[1];
        out.push({ key: 'M', data: [cx, cy] });
        subx = cx;
        suby = cy;
        break;
      case 'L':
        out.push({ key: 'L', data: [...data] });
        [cx, cy] = data;
        break;
      case 'l':
        cx += data[0];
        cy += data[1];
        out.push({ key: 'L', data: [cx, cy] });
        break;
      case 'C':
        out.push({ key: 'C', data: [...data] });
        cx = data[4];
        cy = data[5];
        break;
      case 'c': {
        const newdata = data.map((v, i) => (i % 2) ? (v + cy) : (v + cx));
        out.push({ key: 'C', data: newdata });
        cx = newdata[4];
        cy = newdata[5];
        break;
      }
      case 'Q':
        out.push({ key: 'Q', data: [...data] });
        cx = data[2];
        cy = data[3];
        break;
      case 'q': {
        const newdata = data.map((v, i) => (i % 2) ? (v + cy) : (v + cx));
        out.push({ key: 'Q', data: newdata });
        cx = newdata[2];
        cy = newdata[3];
        break;
      }
      case 'A':
        out.push({ key: 'A', data: [...data] });
        cx = data[5];
        cy = data[6];
        break;
      case 'a':
        cx += data[5];
        cy += data[6];
        out.push({ key: 'A', data: [data[0], data[1], data[2], data[3], data[4], cx, cy] });
        break;
      case 'H':
        out.push({ key: 'H', data: [...data] });
        cx = data[0];
        break;
      case 'h':
        cx += data[0];
        out.push({ key: 'H', data: [cx] });
        break;
      case 'V':
        out.push({ key: 'V', data: [...data] });
        cy = data[0];
        break;
      case 'v':
        cy += data[0];
        out.push({ key: 'V', data: [cy] });
        break;
      case 'S':
        out.push({ key: 'S', data: [...data] });
        cx = data[2];
        cy = data[3];
        break;
      case 's': {
        const newdata = data.map((v, i) => (i % 2) ? (v + cy) : (v + cx));
        out.push({ key: 'S', data: newdata });
        cx = newdata[2];
        cy = newdata[3];
        break;
      }
      case 'T':
        out.push({ key: 'T', data: [...data] });
        cx = data[0];
        cy = data[1];
        break;
      case 't':
        cx += data[0];
        cy += data[1];
        out.push({ key: 'T', data: [cx, cy] });
        break;
      case 'Z':
      case 'z':
        out.push({ key: 'Z', data: [] });
        cx = subx;
        cy = suby;
        break;
    }
  }
  return out;
}

// ── normalize ────────────────────────────────────────────────────────
// Reduce the path to only M / L / C / Z commands (arc → cubic Béziers,
// quadratic → cubic, H/V → L, S/T expanded). Required by mlcrough's
// renderer because the sketchy line generator only knows lines and cubics.

export function normalize(segments: Segment[]): Segment[] {
  const out: Segment[] = [];
  let lastType = '';
  let cx = 0, cy = 0;
  let subx = 0, suby = 0;
  let lcx = 0, lcy = 0;
  for (const { key, data } of segments) {
    switch (key) {
      case 'M':
        out.push({ key: 'M', data: [...data] });
        [cx, cy] = data;
        [subx, suby] = data;
        break;
      case 'C':
        out.push({ key: 'C', data: [...data] });
        cx = data[4];
        cy = data[5];
        lcx = data[2];
        lcy = data[3];
        break;
      case 'L':
        out.push({ key: 'L', data: [...data] });
        [cx, cy] = data;
        break;
      case 'H':
        cx = data[0];
        out.push({ key: 'L', data: [cx, cy] });
        break;
      case 'V':
        cy = data[0];
        out.push({ key: 'L', data: [cx, cy] });
        break;
      case 'S': {
        let cx1 = 0, cy1 = 0;
        if (lastType === 'C' || lastType === 'S') {
          cx1 = cx + (cx - lcx);
          cy1 = cy + (cy - lcy);
        } else {
          cx1 = cx;
          cy1 = cy;
        }
        out.push({ key: 'C', data: [cx1, cy1, ...data] });
        lcx = data[0];
        lcy = data[1];
        cx = data[2];
        cy = data[3];
        break;
      }
      case 'T': {
        const [x, y] = data;
        let x1 = 0, y1 = 0;
        if (lastType === 'Q' || lastType === 'T') {
          x1 = cx + (cx - lcx);
          y1 = cy + (cy - lcy);
        } else {
          x1 = cx;
          y1 = cy;
        }
        const cx1 = cx + 2 * (x1 - cx) / 3;
        const cy1 = cy + 2 * (y1 - cy) / 3;
        const cx2 = x + 2 * (x1 - x) / 3;
        const cy2 = y + 2 * (y1 - y) / 3;
        out.push({ key: 'C', data: [cx1, cy1, cx2, cy2, x, y] });
        lcx = x1;
        lcy = y1;
        cx = x;
        cy = y;
        break;
      }
      case 'Q': {
        const [x1, y1, x, y] = data;
        const cx1 = cx + 2 * (x1 - cx) / 3;
        const cy1 = cy + 2 * (y1 - cy) / 3;
        const cx2 = x + 2 * (x1 - x) / 3;
        const cy2 = y + 2 * (y1 - y) / 3;
        out.push({ key: 'C', data: [cx1, cy1, cx2, cy2, x, y] });
        lcx = x1;
        lcy = y1;
        cx = x;
        cy = y;
        break;
      }
      case 'A': {
        const r1 = Math.abs(data[0]);
        const r2 = Math.abs(data[1]);
        const angle = data[2];
        const largeArcFlag = data[3];
        const sweepFlag = data[4];
        const x = data[5];
        const y = data[6];
        if (r1 === 0 || r2 === 0) {
          out.push({ key: 'C', data: [cx, cy, x, y, x, y] });
          cx = x;
          cy = y;
        } else {
          if (cx !== x || cy !== y) {
            const curves = arcToCubicCurves(cx, cy, x, y, r1, r2, angle, largeArcFlag, sweepFlag);
            curves.forEach((curve) => {
              out.push({ key: 'C', data: curve });
            });
            cx = x;
            cy = y;
          }
        }
        break;
      }
      case 'Z':
        out.push({ key: 'Z', data: [] });
        cx = subx;
        cy = suby;
        break;
    }
    lastType = key;
  }
  return out;
}

function degToRad(degrees: number): number {
  return (Math.PI * degrees) / 180;
}

function rotate(x: number, y: number, angleRad: number): [number, number] {
  const X = x * Math.cos(angleRad) - y * Math.sin(angleRad);
  const Y = x * Math.sin(angleRad) + y * Math.cos(angleRad);
  return [X, Y];
}

function arcToCubicCurves(
  x1: number, y1: number, x2: number, y2: number,
  r1: number, r2: number,
  angle: number, largeArcFlag: number, sweepFlag: number,
  recursive?: [number, number, number, number],
): number[][] {
  const angleRad = degToRad(angle);
  let params: number[][] = [];
  let f1 = 0, f2 = 0, cx = 0, cy = 0;
  if (recursive) {
    [f1, f2, cx, cy] = recursive;
  } else {
    [x1, y1] = rotate(x1, y1, -angleRad);
    [x2, y2] = rotate(x2, y2, -angleRad);
    const x = (x1 - x2) / 2;
    const y = (y1 - y2) / 2;
    let h = (x * x) / (r1 * r1) + (y * y) / (r2 * r2);
    if (h > 1) {
      h = Math.sqrt(h);
      r1 = h * r1;
      r2 = h * r2;
    }
    const sign = (largeArcFlag === sweepFlag) ? -1 : 1;
    const r1Pow = r1 * r1;
    const r2Pow = r2 * r2;
    const left = r1Pow * r2Pow - r1Pow * y * y - r2Pow * x * x;
    const right = r1Pow * y * y + r2Pow * x * x;
    const k = sign * Math.sqrt(Math.abs(left / right));
    cx = k * r1 * y / r2 + (x1 + x2) / 2;
    cy = k * -r2 * x / r1 + (y1 + y2) / 2;
    f1 = Math.asin(parseFloat(((y1 - cy) / r2).toFixed(9)));
    f2 = Math.asin(parseFloat(((y2 - cy) / r2).toFixed(9)));
    if (x1 < cx) f1 = Math.PI - f1;
    if (x2 < cx) f2 = Math.PI - f2;
    if (f1 < 0) f1 = Math.PI * 2 + f1;
    if (f2 < 0) f2 = Math.PI * 2 + f2;
    if (sweepFlag && f1 > f2) f1 = f1 - Math.PI * 2;
    if (!sweepFlag && f2 > f1) f2 = f2 - Math.PI * 2;
  }
  let df = f2 - f1;
  if (Math.abs(df) > (Math.PI * 120 / 180)) {
    const f2old = f2;
    const x2old = x2;
    const y2old = y2;
    if (sweepFlag && f2 > f1) {
      f2 = f1 + (Math.PI * 120 / 180) * 1;
    } else {
      f2 = f1 + (Math.PI * 120 / 180) * -1;
    }
    x2 = cx + r1 * Math.cos(f2);
    y2 = cy + r2 * Math.sin(f2);
    params = arcToCubicCurves(x2, y2, x2old, y2old, r1, r2, angle, 0, sweepFlag, [f2, f2old, cx, cy]);
  }
  df = f2 - f1;
  const c1 = Math.cos(f1);
  const s1 = Math.sin(f1);
  const c2 = Math.cos(f2);
  const s2 = Math.sin(f2);
  const t = Math.tan(df / 4);
  const hx = 4 / 3 * r1 * t;
  const hy = 4 / 3 * r2 * t;
  const m1: [number, number] = [x1, y1];
  const m2: [number, number] = [x1 + hx * s1, y1 - hy * c1];
  const m3: [number, number] = [x2 + hx * s2, y2 - hy * c2];
  const m4: [number, number] = [x2, y2];
  m2[0] = 2 * m1[0] - m2[0];
  m2[1] = 2 * m1[1] - m2[1];
  if (recursive) {
    return [m2 as unknown as number[], m3 as unknown as number[], m4 as unknown as number[]].concat(params);
  } else {
    params = [m2 as unknown as number[], m3 as unknown as number[], m4 as unknown as number[]].concat(params);
    const curves: number[][] = [];
    for (let i = 0; i < params.length; i += 3) {
      const a = rotate(params[i][0], params[i][1], angleRad);
      const b = rotate(params[i + 1][0], params[i + 1][1], angleRad);
      const c = rotate(params[i + 2][0], params[i + 2][1], angleRad);
      curves.push([a[0], a[1], b[0], b[1], c[0], c[1]]);
    }
    return curves;
  }
}

// ── pointsOnPath ─────────────────────────────────────────────────────
// Originally `points-on-path@0.2.1` (MIT, Preet Shihn). Inlined here so
// mlcrough does not pull in path-data-parser transitively.
// Uses our local parsePath/absolutize/normalize, plus pointsOnBezierCurves
// + simplify from `points-on-curve` (a strict-ES-clean dep we keep).

import * as poc_module from 'points-on-curve';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const poc: any = poc_module;
const pointsOnBezierCurves = poc.pointsOnBezierCurves || poc.default?.pointsOnBezierCurves;
const simplify = poc.simplify || poc.default?.simplify;

type Pt = [number, number];

export function pointsOnPath(path: string, tolerance?: number, distance?: number): Pt[][] {
  const segments = parsePath(path);
  const normalized = normalize(absolutize(segments));
  const sets: Pt[][] = [];
  let currentPoints: Pt[] = [];
  let start: Pt = [0, 0];
  let pendingCurve: Pt[] = [];

  const appendPendingCurve = () => {
    if (pendingCurve.length >= 4) {
      currentPoints.push(...pointsOnBezierCurves(pendingCurve, tolerance) as Pt[]);
    }
    pendingCurve = [];
  };
  const appendPendingPoints = () => {
    appendPendingCurve();
    if (currentPoints.length) {
      sets.push(currentPoints);
      currentPoints = [];
    }
  };

  for (const { key, data } of normalized) {
    switch (key) {
      case 'M':
        appendPendingPoints();
        start = [data[0], data[1]];
        currentPoints.push(start);
        break;
      case 'L':
        appendPendingCurve();
        currentPoints.push([data[0], data[1]]);
        break;
      case 'C':
        if (!pendingCurve.length) {
          const lastPoint = currentPoints.length ? currentPoints[currentPoints.length - 1] : start;
          pendingCurve.push([lastPoint[0], lastPoint[1]]);
        }
        pendingCurve.push([data[0], data[1]]);
        pendingCurve.push([data[2], data[3]]);
        pendingCurve.push([data[4], data[5]]);
        break;
      case 'Z':
        appendPendingCurve();
        currentPoints.push([start[0], start[1]]);
        break;
    }
  }
  appendPendingPoints();

  if (!distance) {
    return sets;
  }
  const out: Pt[][] = [];
  for (const set of sets) {
    const simplifiedSet = simplify(set, distance) as Pt[];
    if (simplifiedSet.length) {
      out.push(simplifiedSet);
    }
  }
  return out;
}
