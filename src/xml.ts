// A tolerant, round-trip-safe XML reader for SVG documents.
//
// This is deliberately not a conforming XML parser. It exists so that
// `roughen()` can replace a handful of shape elements inside a foreign
// document and hand back everything else byte for byte — comments, the XML
// declaration, entity references, attribute quoting and whitespace included.
// Every node therefore keeps the exact source text it came from, and the
// serializer re-emits that text unless a caller replaced the node.
//
// Two element types are read as opaque text rather than parsed:
//   <style> / <script>  their content is CSS/JS, where "<" is not markup
//   <foreignObject>     its content is HTML, which may leave <br> unclosed
//
// A mismatched closing tag unwinds the stack to the nearest matching element
// and is otherwise kept as text, so a slightly broken document still survives
// the round trip instead of throwing.

/** An element node. `open` and `close` hold the original tag text. */
export interface XmlElement {
  type: 'element';
  tag: string;
  attrs: Record<string, string>;
  /** The source text of the opening tag, e.g. `<rect x="1" >`. */
  open: string;
  /** The source text of the closing tag, or '' when self-closing. */
  close: string;
  children: XmlNode[];
}

/** Anything that is not an element: text, comments, CDATA, PIs, the doctype. */
export interface XmlRaw {
  type: 'raw';
  text: string;
}

export type XmlNode = XmlElement | XmlRaw;

/** Elements whose content is not markup and is kept as a single raw child. */
const OPAQUE = new Set(['style', 'script', 'foreignObject']);

const NAME_START = /[A-Za-z_:]/;

function isNameChar(ch: string): boolean {
  return /[-A-Za-z0-9_:.]/.test(ch);
}

/** Reads the attributes out of an opening tag's source text. */
function parseAttrs(open: string, from: number): Record<string, string> {
  const attrs: Record<string, string> = {};
  let i = from;
  while (i < open.length) {
    while (i < open.length && /\s/.test(open[i])) i++;
    if (i >= open.length || open[i] === '>' || open[i] === '/') break;
    if (!NAME_START.test(open[i])) { i++; continue; }
    let name = '';
    while (i < open.length && isNameChar(open[i])) name += open[i++];
    while (i < open.length && /\s/.test(open[i])) i++;
    if (open[i] !== '=') { attrs[name] = ''; continue; }
    i++;
    while (i < open.length && /\s/.test(open[i])) i++;
    const quote = open[i];
    let value = '';
    if (quote === '"' || quote === '\'') {
      i++;
      while (i < open.length && open[i] !== quote) value += open[i++];
      i++;
    } else {
      while (i < open.length && !/[\s>/]/.test(open[i])) value += open[i++];
    }
    attrs[name] = value;
  }
  return attrs;
}

/**
 * Parses an SVG/XML document into a node list.
 * @param source The document text.
 */
export function parseXml(source: string): XmlNode[] {
  const root: XmlNode[] = [];
  const stack: XmlElement[] = [];
  const push = (node: XmlNode): void => {
    const parent = stack[stack.length - 1];
    (parent ? parent.children : root).push(node);
  };
  const pushText = (text: string): void => {
    if (text) push({ type: 'raw', text });
  };

  let i = 0;
  let text = '';
  while (i < source.length) {
    if (source[i] !== '<') { text += source[i++]; continue; }

    // <!-- comment -->, <![CDATA[…]]>, <!DOCTYPE …>, <?…?>
    if (source.startsWith('<!--', i)) {
      const end = source.indexOf('-->', i);
      const stop = end < 0 ? source.length : end + 3;
      pushText(text); text = '';
      pushText(source.slice(i, stop));
      i = stop;
      continue;
    }
    if (source.startsWith('<![CDATA[', i)) {
      const end = source.indexOf(']]>', i);
      const stop = end < 0 ? source.length : end + 3;
      pushText(text); text = '';
      pushText(source.slice(i, stop));
      i = stop;
      continue;
    }
    if (source.startsWith('<?', i)) {
      const end = source.indexOf('?>', i);
      const stop = end < 0 ? source.length : end + 2;
      pushText(text); text = '';
      pushText(source.slice(i, stop));
      i = stop;
      continue;
    }
    if (source.startsWith('<!', i)) {
      // A doctype may carry an internal subset in square brackets.
      let j = i + 2;
      let depth = 0;
      while (j < source.length) {
        if (source[j] === '[') depth++;
        else if (source[j] === ']') depth--;
        else if (source[j] === '>' && depth <= 0) { j++; break; }
        j++;
      }
      pushText(text); text = '';
      pushText(source.slice(i, j));
      i = j;
      continue;
    }

    // </tag>
    if (source.startsWith('</', i)) {
      const end = source.indexOf('>', i);
      if (end < 0) { text += source[i++]; continue; }
      const raw = source.slice(i, end + 1);
      const tag = raw.slice(2, -1).trim();
      pushText(text); text = '';
      const at = findOpen(stack, tag);
      if (at < 0) {
        pushText(raw); // stray closing tag — keep it as text
      } else {
        while (stack.length > at + 1) stack.pop(); // unwind unclosed elements
        const el = stack.pop()!;
        el.close = raw;
      }
      i = end + 1;
      continue;
    }

    // <tag …> or <tag …/>
    if (!NAME_START.test(source[i + 1] || '')) { text += source[i++]; continue; }
    const end = findTagEnd(source, i);
    if (end < 0) { text += source[i++]; continue; }
    const open = source.slice(i, end + 1);
    let nameEnd = i + 1;
    while (nameEnd < source.length && isNameChar(source[nameEnd])) nameEnd++;
    const tag = source.slice(i + 1, nameEnd);
    const selfClosing = /\/\s*>$/.test(open);
    const el: XmlElement = {
      type: 'element',
      tag,
      attrs: parseAttrs(open, nameEnd - i),
      open,
      close: selfClosing ? '' : `</${tag}>`,
      children: [],
    };
    pushText(text); text = '';
    push(el);
    i = end + 1;

    if (selfClosing) continue;

    if (OPAQUE.has(tag)) {
      const closeTag = `</${tag}`;
      const at = source.indexOf(closeTag, i);
      const contentEnd = at < 0 ? source.length : at;
      if (contentEnd > i) el.children.push({ type: 'raw', text: source.slice(i, contentEnd) });
      if (at < 0) { i = source.length; continue; }
      const gt = source.indexOf('>', at);
      el.close = gt < 0 ? closeTag + '>' : source.slice(at, gt + 1);
      i = gt < 0 ? source.length : gt + 1;
      continue;
    }

    stack.push(el);
  }
  pushText(text);
  return root;
}

/** Index of the nearest open element with this tag name, or -1. */
function findOpen(stack: XmlElement[], tag: string): number {
  for (let k = stack.length - 1; k >= 0; k--) {
    if (stack[k].tag === tag) return k;
  }
  return -1;
}

/** Index of the '>' ending an opening tag, skipping quoted attribute values. */
function findTagEnd(source: string, from: number): number {
  let quote = '';
  for (let j = from + 1; j < source.length; j++) {
    const ch = source[j];
    if (quote) {
      if (ch === quote) quote = '';
    } else if (ch === '"' || ch === '\'') {
      quote = ch;
    } else if (ch === '>') {
      return j;
    }
  }
  return -1;
}

/** Serializes a node list back to text. */
export function serializeXml(nodes: XmlNode[]): string {
  let out = '';
  for (const node of nodes) {
    if (node.type === 'raw') { out += node.text; continue; }
    out += node.open + serializeXml(node.children) + node.close;
  }
  return out;
}

/** Escapes a string for use inside a double-quoted attribute value. */
export function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

/** Builds an opening tag from a tag name and attribute map. */
export function openTag(tag: string, attrs: Record<string, string>, selfClosing: boolean): string {
  let out = `<${tag}`;
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null) continue;
    out += ` ${k}="${escapeAttr(String(v))}"`;
  }
  return out + (selfClosing ? '/>' : '>');
}
