// A small CSS reader, just large enough to find out what colour a shape is.
//
// Generated SVG rarely puts its colours on the elements. Mermaid, for one,
// emits `<rect class="basic label-container"/>` and leaves the fill to an
// embedded stylesheet:
//
//   #my-svg .node rect, … { fill:#ECECFF; stroke:#9370DB; stroke-width:1px; }
//
// So `roughen()` cannot read `fill` off the attribute and be done with it; it
// has to resolve the cascade far enough to learn the computed paint. That is
// what this module does, and no more: selector lists of compound selectors
// joined by descendant and child combinators, plus specificity, source order
// and `!important`.
//
// Deliberately unsupported — and skipped rather than mismatched, so an
// unsupported rule never paints something it shouldn't:
//   sibling combinators (+ ~), pseudo-classes and pseudo-elements, :not(),
//   @media and other conditional groups (their rules are ignored entirely).

/** One compound selector, e.g. `a.b#c[d=e]`. */
interface Compound {
  tag: string;
  id: string;
  classes: string[];
  attrs: { name: string; value: string | null }[];
}

/** A compound plus the combinator that joins it to the compound before it. */
interface Step {
  combinator: ' ' | '>';
  compound: Compound;
}

/** A single declaration: property, value, and whether it carries !important. */
export interface Declaration {
  prop: string;
  value: string;
  important: boolean;
}

/** A parsed style rule, ready to be matched against an element. */
export interface CssRule {
  steps: Step[];
  specificity: number;
  order: number;
  decls: Declaration[];
}

/** The minimal element shape the matcher needs. */
export interface StyledElement {
  tag: string;
  attrs: Record<string, string>;
}

/** Strips `/* … *\/` comments. */
function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** Splits on `sep` at paren depth 0, so `rgba(1, 2, 3, .5)` stays intact. */
function splitTopLevel(input: string, sep: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let current = '';
  let quote = '';
  for (const ch of input) {
    if (quote) {
      current += ch;
      if (ch === quote) quote = '';
      continue;
    }
    if (ch === '"' || ch === '\'') { quote = ch; current += ch; continue; }
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (ch === sep && depth === 0) { out.push(current); current = ''; continue; }
    current += ch;
  }
  out.push(current);
  return out;
}

/** Parses a declaration block body, e.g. `fill:#eee; stroke-width:1px`. */
function parseDeclarations(body: string): Declaration[] {
  const decls: Declaration[] = [];
  for (const part of splitTopLevel(body, ';')) {
    const colon = part.indexOf(':');
    if (colon < 0) continue;
    const prop = part.slice(0, colon).trim().toLowerCase();
    let value = part.slice(colon + 1).trim();
    if (!prop || !value) continue;
    let important = false;
    const bang = value.toLowerCase().lastIndexOf('!important');
    if (bang >= 0) {
      important = true;
      value = value.slice(0, bang).trim();
    }
    decls.push({ prop, value, important });
  }
  return decls;
}

/** Parses one compound selector, or null if it uses an unsupported feature. */
function parseCompound(text: string): Compound | null {
  const compound: Compound = { tag: '', id: '', classes: [], attrs: [] };
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === ':') return null; // pseudo-class / pseudo-element
    if (ch === '#' || ch === '.') {
      i++;
      let name = '';
      while (i < text.length && /[-\w\\]/.test(text[i])) name += text[i++];
      if (!name) return null;
      if (ch === '#') compound.id = name; else compound.classes.push(name);
      continue;
    }
    if (ch === '[') {
      const end = text.indexOf(']', i);
      if (end < 0) return null;
      const inner = text.slice(i + 1, end);
      i = end + 1;
      const eq = inner.indexOf('=');
      if (eq < 0) {
        compound.attrs.push({ name: inner.trim(), value: null });
      } else {
        const op = inner[eq - 1];
        if (op && '~|^$*'.includes(op)) return null; // substring matchers
        const name = inner.slice(0, eq).trim();
        const value = inner.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
        compound.attrs.push({ name, value });
      }
      continue;
    }
    if (ch === '*') { i++; continue; }
    if (/[-\w|\\]/.test(ch)) {
      let name = '';
      while (i < text.length && /[-\w|\\]/.test(text[i])) name += text[i++];
      compound.tag = name.toLowerCase();
      continue;
    }
    return null;
  }
  return compound;
}

/** Parses one complex selector into steps, or null if unsupported. */
function parseSelector(selector: string): Step[] | null {
  const normalized = selector.trim().replace(/\s*([>+~])\s*/g, ' $1 ').replace(/\s+/g, ' ');
  if (!normalized) return null;
  const parts = normalized.split(' ');
  const steps: Step[] = [];
  let combinator: ' ' | '>' = ' ';
  for (const part of parts) {
    if (part === '+' || part === '~') return null; // sibling combinators
    if (part === '>') { combinator = '>'; continue; }
    const compound = parseCompound(part);
    if (!compound) return null;
    steps.push({ combinator, compound });
    combinator = ' ';
  }
  return steps.length ? steps : null;
}

function specificityOf(steps: Step[]): number {
  let ids = 0, classes = 0, tags = 0;
  for (const { compound } of steps) {
    if (compound.id) ids++;
    classes += compound.classes.length + compound.attrs.length;
    if (compound.tag) tags++;
  }
  return ids * 10000 + classes * 100 + tags;
}

/**
 * Parses the contents of one or more `<style>` elements into rules.
 * @param css Concatenated stylesheet text.
 * @param startOrder Source-order offset for the first rule found.
 */
export function parseStylesheet(css: string, startOrder: number = 0): CssRule[] {
  const source = stripComments(css);
  const rules: CssRule[] = [];
  let order = startOrder;
  let i = 0;
  while (i < source.length) {
    while (i < source.length && /\s/.test(source[i])) i++;
    if (i >= source.length) break;

    if (source[i] === '@') {
      // Skip the whole at-rule: either `@x …;` or `@x … { … }` with nesting.
      let j = i;
      while (j < source.length && source[j] !== '{' && source[j] !== ';') j++;
      if (source[j] === ';' || j >= source.length) { i = j + 1; continue; }
      let depth = 0;
      while (j < source.length) {
        if (source[j] === '{') depth++;
        else if (source[j] === '}') { depth--; if (depth === 0) { j++; break; } }
        j++;
      }
      i = j;
      continue;
    }

    const open = source.indexOf('{', i);
    if (open < 0) break;
    const close = source.indexOf('}', open);
    if (close < 0) break;
    const selectorList = source.slice(i, open);
    const decls = parseDeclarations(source.slice(open + 1, close));
    i = close + 1;
    if (!decls.length) continue;

    for (const selector of splitTopLevel(selectorList, ',')) {
      const steps = parseSelector(selector);
      if (!steps) continue;
      rules.push({ steps, specificity: specificityOf(steps), order: order++, decls });
    }
  }
  return rules;
}

function classListOf(el: StyledElement): string[] {
  const value = el.attrs['class'];
  return value ? value.trim().split(/\s+/) : [];
}

function matchesCompound(compound: Compound, el: StyledElement): boolean {
  if (compound.tag && compound.tag !== el.tag.toLowerCase()) return false;
  if (compound.id && compound.id !== el.attrs['id']) return false;
  if (compound.classes.length) {
    const classes = classListOf(el);
    for (const c of compound.classes) {
      if (!classes.includes(c)) return false;
    }
  }
  for (const attr of compound.attrs) {
    const actual = el.attrs[attr.name];
    if (actual === undefined) return false;
    if (attr.value !== null && actual !== attr.value) return false;
  }
  return true;
}

/**
 * Matches a rule against an element, given its ancestor chain.
 * @param rule The rule to test.
 * @param stack Ancestors from the document root down to, and including, the element.
 */
export function matchesRule(rule: CssRule, stack: StyledElement[]): boolean {
  const last = rule.steps.length - 1;
  const el = stack[stack.length - 1];
  if (!el || !matchesCompound(rule.steps[last].compound, el)) return false;

  let position = stack.length - 1;
  for (let s = last; s >= 1; s--) {
    const step = rule.steps[s];
    const previous = rule.steps[s - 1].compound;
    if (step.combinator === '>') {
      position--;
      if (position < 0 || !matchesCompound(previous, stack[position])) return false;
    } else {
      let found = -1;
      for (let p = position - 1; p >= 0; p--) {
        if (matchesCompound(previous, stack[p])) { found = p; break; }
      }
      if (found < 0) return false;
      position = found;
    }
  }
  return true;
}

/**
 * Resolves the declarations that apply to an element, cascade order applied.
 * @param rules All rules of the document.
 * @param stack Ancestors from the root down to, and including, the element.
 */
export function cascade(rules: CssRule[], stack: StyledElement[]): Record<string, string> {
  const winners: Record<string, { weight: number; order: number; value: string }> = {};
  for (const rule of rules) {
    if (!matchesRule(rule, stack)) continue;
    for (const decl of rule.decls) {
      const weight = rule.specificity + (decl.important ? 1000000 : 0);
      const current = winners[decl.prop];
      if (!current || weight > current.weight || (weight === current.weight && rule.order >= current.order)) {
        winners[decl.prop] = { weight, order: rule.order, value: decl.value };
      }
    }
  }
  const out: Record<string, string> = {};
  for (const [prop, winner] of Object.entries(winners)) out[prop] = winner.value;
  return out;
}

/** Parses an inline `style` attribute. */
export function parseInlineStyle(style: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const decl of parseDeclarations(style)) out[decl.prop] = decl.value;
  return out;
}
