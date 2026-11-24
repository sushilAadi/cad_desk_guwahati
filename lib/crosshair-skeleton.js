/*! crosshair-skeleton v1.0.0 · MIT License · no dependencies */
// A loading skeleton that locks onto an element, measures it and maps a grid over it. Cursors then
// drag a selection around every element inside and leave a skeleton block in its place; it waits
// cheaply, and when the data arrives the real UI swaps in element by element.
//
//   const s = crosshair(el);   // when loading starts
//   s.done();                  // when the data has arrived and is rendered (returns a promise)
//
// or declaratively: <div data-crosshair="loading"> … </div> + watch()

const NS_READY = typeof window !== "undefined" && typeof document !== "undefined";

const DEFAULTS = {
  reveal: "cascade", // "cascade" (element by element) | "flow" (strict reading order) | "fade" (all at once)
  grace: 150, // ms before anything is drawn; loads faster than this never show a skeleton
  minVisible: 600, // once drawn, keep it at least this long so it never flashes
  trace: "auto", // "auto" draws every element | "box" only the element's own box | "none" grid and corners only
  cell: 40, // target grid cell in px (grown automatically on large elements)
  cursors: true, // true (1–3, by how many elements there are) | false | a number from 1 to 4
  labels: true, // size labels under each selection
  readout: "auto", // phase + size label: true | false | "auto" (only on elements ≥ 240×120)
  pulse: true, // slow breathing while waiting (compositor-only)
  speed: 1, // 2 = twice as fast, 0.5 = half speed
  auto: false, // true: no data to wait for (a landing-page highlight): plays once when the element scrolls into view, then reveals by itself
};

// Tuned together as one rhythm. Change `speed`, not these one by one.
const BUILD = { lock: 90, blink: 105, expand: 570, draw: 390, stagger: 345, drawStart: 480, travel: 120, drag: 210, selHold: 300, fill: 260 }; // cursors move at a calm, readable pace
const HAND = { handoff: 560, item: 123, step: 32, minBlock: 60 };
const BLINKS = 2;
const PULSE = 1000;
const MAX_SHAPES = 90;
const MAX_VISITS = 600;
const MAX_BLOCKS = 600; // skeleton blocks per skeleton, all elements together
const GROUP_MIN = 6, GROUP_MAX = 60; // simple sibling shapes drawn as one group (more than 60: one block)
const MAX_TEXT = 1500; // characters measured per text block: plenty for the 8 lines drawn
const MAX_DRAW = 3200; // the marquee never takes longer than this, however many elements there are
const AUTO_HOLD = 800; // with auto, how long the finished skeleton stays before the content arrives
const BLUR_MAX = 24; // more elements than this swapping in on screen: no blur // at the reveal, no element waits longer than this for its own block
const CURSOR_SCALE = 1.1;

const EASE = {
  lock: "cubic-bezier(0.16, 1, 0.3, 1)",
  expand: "cubic-bezier(0.85, 0, 0.15, 1)",
  draw: "cubic-bezier(0.65, 0, 0.35, 1)",
  out: "cubic-bezier(0.25, 1, 0.5, 1)",
};
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const prog = (t, a, d) => (d <= 0 ? (t >= a ? 1 : 0) : clamp((t - a) / d, 0, 1));
const f1 = (n) => Math.round(n * 10) / 10;
// Seeded random, so every skeleton draws the same way each time
const rng = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const mix = (pct) => `color-mix(in srgb, currentColor ${pct}%, transparent)`;
const SEL = "var(--cs-select,#6b6b6b)";
const CUR = `var(--cs-cursor,${SEL})`;
const BG = "var(--cs-bg,Canvas)";
// Hiding and overlay geometry are !important so ordinary host rules (`.card > div { position: relative }`,
// an inline `opacity: 1`) can't break them. Reveal animations run only after the hiding marker is removed.
const CSS = `
[data-crosshair="loading"]:not([data-cs-show])>:not(.cs-ov),[data-cs-hide]>:not(.cs-ov){opacity:0!important;visibility:hidden!important}
[data-cs-hide]{-webkit-text-fill-color:transparent}
.cs-ov,.cs-ov *{box-sizing:content-box!important;padding:0!important;border:0!important;margin:0!important;min-width:0!important;min-height:0!important;max-width:none!important;max-height:none!important;float:none!important;transform:none}
.cs-ov{position:absolute!important;inset:0!important;display:block!important;width:auto!important;height:auto!important;background:transparent!important;z-index:10;pointer-events:none!important;-webkit-text-fill-color:currentColor;visibility:visible!important;contain:layout style;border-radius:inherit}
.cs-ov .cs-clip,.cs-ov .cs-layer{position:absolute!important;inset:0!important;display:block!important;border-radius:inherit}
.cs-ov .cs-clip{overflow:hidden!important}
.cs-ov .cs-fill{position:absolute!important;inset:0!important;display:block!important;background:var(--cs-fill,${mix(6)})!important}
.cs-ov svg{position:absolute!important;left:0!important;top:0!important;display:block!important;overflow:visible!important}
.cs-ov .cs-grid{will-change:opacity}
.cs-ov .cs-grid path{fill:none;stroke:var(--cs-line,${mix(4)});stroke-width:1}
.cs-ov .cs-grid circle{fill:var(--cs-dot,${mix(12)})}
.cs-ov .cs-leaf{position:absolute!important;inset:0!important;display:block!important;opacity:0}
.cs-ov .cs-b{position:absolute!important;display:block!important;background:var(--cs-block,color-mix(in srgb,currentColor 13%,${BG}))!important}
.cs-ov .cs-ph{position:absolute!important;display:none;background:color-mix(in srgb,${SEL} 9%,transparent)!important}
.cs-ov .cs-sel .o{fill:none;stroke:${SEL};stroke-width:1}
.cs-ov .cs-sel .hd{fill:${BG};stroke:${SEL};stroke-width:1}
.cs-ov .cs-badge{position:absolute!important;display:none;transform:translateX(-50%)!important;padding:0 4px!important;border-radius:3px;background:${SEL}!important;color:var(--cs-select-ink,#fff);-webkit-text-fill-color:var(--cs-select-ink,#fff);font:500 10px/16px ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:0;font-variant-numeric:tabular-nums;white-space:nowrap}
.cs-ov .cs-cur{position:absolute!important;display:block!important;left:0;top:0;width:0!important;height:0!important;opacity:0;transform-origin:0 0;will-change:transform,opacity}
.cs-ov .cs-cur .arrow{left:-2px!important;top:-2px!important}
.cs-ov .cs-cur .cross{left:-8px!important;top:-8px!important;display:none!important}
.cs-ov .cs-cur.x .arrow{display:none!important}.cs-ov .cs-cur.x .cross{display:block!important}
.cs-ov .cs-cur .f{fill:${CUR};stroke:${CUR}}
.cs-ov .cs-cur .e{fill:none;stroke:${BG}}
.cs-ov .cs-cur .l{fill:none;stroke:${CUR}}
.cs-ov .cs-ch{position:absolute!important;display:block!important;left:0;top:0;width:56px!important;height:56px!important;margin:-28px 0 0 -28px!important;opacity:0}
.cs-ov .cs-ch[data-c=tr]{left:100%}.cs-ov .cs-ch[data-c=bl]{top:100%}.cs-ov .cs-ch[data-c=br]{left:100%;top:100%}
.cs-ov .cs-ch>i{position:absolute!important;inset:0!important;display:block!important;--m:var(--cs-mark,${mix(16)});--a:var(--cs-arm,${mix(8)});background:
linear-gradient(var(--m),var(--m)) 23px 27px/10px 2px no-repeat,
linear-gradient(var(--m),var(--m)) 27px 23px/2px 10px no-repeat,
linear-gradient(90deg,transparent,var(--a)) 0 27.5px/23px 1px no-repeat,
linear-gradient(270deg,transparent,var(--a)) 33px 27.5px/23px 1px no-repeat,
linear-gradient(180deg,transparent,var(--a)) 27.5px 0/1px 23px no-repeat,
linear-gradient(0deg,transparent,var(--a)) 27.5px 33px/1px 23px no-repeat!important}
.cs-ov .cs-ro{position:absolute!important;display:block!important;left:18px;top:-22px;font:500 10px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.06em;white-space:nowrap;font-variant-numeric:tabular-nums;opacity:0}
.cs-ov .cs-ro b{font-weight:500;margin-right:10px!important}.cs-ov .cs-ro span{opacity:.55}
`;

// Styles go to the element's own document (iframes too) or to its shadow root (Lit, web components),
// once per root. A constructable sheet per document: no <style> tag, works under most CSPs.
const sheets = new WeakMap();
const styledRoots = new WeakSet();
function injectStyles(el) {
  const doc = el.ownerDocument;
  const root = el.getRootNode();
  const target = root.nodeType === 11 && root.host ? root : doc; // nodeType check works across realms
  if (styledRoots.has(target)) return;
  styledRoots.add(target);
  try {
    let sheet = sheets.get(doc);
    if (!sheet) {
      sheet = new doc.defaultView.CSSStyleSheet();
      sheet.replaceSync(CSS);
      sheets.set(doc, sheet);
    }
    target.adoptedStyleSheets = [...target.adoptedStyleSheets, sheet];
  } catch {
    const tag = doc.createElement("style");
    tag.setAttribute("data-crosshair-skeleton", "");
    tag.textContent = CSS;
    (target === doc ? doc.head : target).appendChild(tag);
  }
}

// Only for the readout counter: same curve as the expand, solved by bisection
function bezier(x1, y1, x2, y2) {
  const at = (t, a, b) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let lo = 0, hi = 1, t = x;
    for (let i = 0; i < 22; i++) {
      if (at(t, x1, x2) < x) lo = t; else hi = t;
      t = (lo + hi) / 2;
    }
    return at(t, y1, y2);
  };
}
const expandCurve = bezier(0.85, 0, 0.15, 1);

// ---------- Shared observers and frame loop ----------
// Two shared observers. Loading states build 100 px before the element scrolls in, so the skeleton is
// ready when it arrives; an auto play waits until the element is properly on screen (30% of it, or a
// strip 30% of the screen tall), so nobody misses the draw. Both always become true eventually.
const observers = {};
const ioCallbacks = new Map(); // element → { cb, auto }: the current registration
const pending = new Map(); // auto targets on screen but not yet past the gate → fail-open timer
const area = (e) => e.isIntersecting && e.intersectionRect.width > 0 && e.intersectionRect.height > 0; // not just touching an edge
const onScreen = (e) => area(e) && (e.intersectionRatio >= 0.3 || e.intersectionRect.height >= 0.3 * (e.rootBounds?.height || innerHeight));
const stopPending = (el) => { clearTimeout(pending.get(el)); pending.delete(el); };
const inViewport = (el) => {
  const r = el.getBoundingClientRect(), win = el.ownerDocument.defaultView || window; // the element's own window (iframes)
  return r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0 && r.top < win.innerHeight && r.left < win.innerWidth;
};
function seen(entries) {
  for (const e of entries) {
    const reg = ioCallbacks.get(e.target);
    if (!reg?.auto) continue;
    if (onScreen(e)) { stopPending(e.target); reg.cb(true); }
    else if (!area(e)) { stopPending(e.target); reg.cb(false); }
    else if (!pending.has(e.target)) {
      // Partly on screen but the gate can't be reached (a tall element, a small scroll box, a page that
      // can't scroll further): play anyway once it has been on screen for a second, so nothing stays hidden
      reg.cb(false);
      pending.set(e.target, setTimeout(() => {
        pending.delete(e.target);
        if (ioCallbacks.get(e.target) === reg && inViewport(e.target)) reg.cb(true);
      }, 1000));
    }
  }
}
function near(entries) {
  for (const e of entries) {
    const reg = ioCallbacks.get(e.target);
    if (reg && !reg.auto) reg.cb(e.isIntersecting);
  }
}
const handlers = { seen, near };
function observe(el, cb, auto = false) {
  const k = auto ? "seen" : "near";
  // 1e-30: any visible pixel crosses it (and it survives Chromium's float32 storage), so an edge touch and a first sliver are different callbacks
  observers[k] ||= new IntersectionObserver(handlers[k], auto ? { threshold: [0, 1e-30, 0.1, 0.2, 0.3, 0.5, 0.75, 1] } : { rootMargin: "100px" });
  stopPending(el);
  ioCallbacks.set(el, { cb, auto });
  observers[k].observe(el);
}
// Stop watching an element. Its updates already queued are dropped (they belong to this run, not to a
// run that may replace it); queued updates for every other element are still delivered.
function unobserve(el) {
  const held = []; // queued updates for other elements, with the run each belonged to
  for (const k in observers) {
    for (const e of observers[k].takeRecords()) if (e.target !== el) held.push([k, e, ioCallbacks.get(e.target)]);
    observers[k].unobserve(el);
  }
  ioCallbacks.delete(el);
  stopPending(el);
  // Deliver only once this element is fully cleaned up, and only to the run each update belonged to
  for (const [k, e, reg] of held) if (reg && ioCallbacks.get(e.target) === reg) handlers[k]([e]);
}

// One animation-frame loop for every skeleton that is drawing; it stops when none is
const ticking = new Set();
let tickFrame = 0;
function tick(now) {
  tickFrame = 0;
  ticking.forEach((fn) => fn(now));
  if (ticking.size) tickFrame = requestAnimationFrame(tick);
}
function startTicking(fn) {
  ticking.add(fn);
  if (!tickFrame) tickFrame = requestAnimationFrame(tick);
}
function stopTicking(fn) {
  ticking.delete(fn);
}

// ---------- DOM building (no HTML strings, so strict Trusted Types policies are fine) ----------
const SVG_NS = "http://www.w3.org/2000/svg";
function node(doc, tag, attrs, parent, svg = false) {
  const n = svg ? doc.createElementNS(SVG_NS, tag) : doc.createElement(tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}
const ARROW = "M2.4 2.4 L16.4 7.6 Q17.2 8 16.4 8.4 L10.6 10.6 L8.4 16.4 Q8 17.2 7.6 16.4 Z";
const CROSS = "M8 1.5v13M1.5 8h13";
function cursorNode(doc, parent) {
  const cur = node(doc, "div", { class: "cs-cur" }, parent);
  // Inline !important sizes: host rules such as `.chart svg { width: 140px }` must not resize the cursors
  const arrow = node(doc, "svg", { class: "arrow", width: 20, height: 20, viewBox: "0 0 20 20", style: "width:20px!important;height:20px!important" }, cur, true);
  node(doc, "path", { class: "f", d: ARROW, "stroke-width": "1.6", "stroke-linejoin": "round" }, arrow, true);
  node(doc, "path", { class: "e", d: ARROW, "stroke-width": "1.6", "stroke-linejoin": "round" }, arrow, true);
  const cross = node(doc, "svg", { class: "cross", width: 16, height: 16, viewBox: "0 0 16 16", style: "width:16px!important;height:16px!important" }, cur, true);
  node(doc, "path", { class: "e", d: CROSS, "stroke-width": "3.5", "stroke-linecap": "round" }, cross, true);
  node(doc, "path", { class: "l", d: CROSS, "stroke-width": "1.25", "stroke-linecap": "round" }, cross, true);
  return cur;
}
// A selection: outline plus four corner handles, hidden until used
function selectionNode(doc, parent) {
  const g = node(doc, "g", { display: "none" }, parent, true);
  node(doc, "rect", { class: "o" }, g, true);
  for (let i = 0; i < 4; i++) node(doc, "rect", { class: "hd", width: 6, height: 6 }, g, true);
  return g;
}
function paintSelection(g, x, y, w, h, op) {
  const key = `${f1(x)} ${f1(y)} ${f1(w)} ${f1(h)} ${f1(op)}`;
  if (g._k === key) return;
  g._k = key;
  if (op <= 0) return g.setAttribute("display", "none");
  g.removeAttribute("display");
  g.setAttribute("opacity", f1(op));
  const [o, ...hd] = g.childNodes;
  o.setAttribute("x", f1(x + 0.5));
  o.setAttribute("y", f1(y + 0.5));
  o.setAttribute("width", f1(Math.max(0, w - 1)));
  o.setAttribute("height", f1(Math.max(0, h - 1)));
  [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].forEach(([hx, hy], i) => {
    hd[i].setAttribute("x", f1(hx - 3));
    hd[i].setAttribute("y", f1(hy - 3));
  });
}
function paintBadge(b, x, y, w, h, op) {
  if (!b) return;
  const text = `${Math.round(w)} × ${Math.round(h)}`;
  const key = `${f1(x + w / 2)} ${f1(y + h + 7)} ${text} ${f1(op)}`;
  if (b._k === key) return;
  b._k = key;
  if (op <= 0 || w < 1) return (b.style.display = "none");
  b.style.display = "block";
  b.style.left = `${f1(x + w / 2)}px`;
  b.style.top = `${f1(y + h + 7)}px`;
  b.style.opacity = f1(op);
  b.textContent = text;
}

// Readouts sit above their element and take the parent's colour; selection handles and cursor edges
// use the background behind the skeleton. One watcher per document keeps both in step when the page
// switches theme (a class or data attribute on <html>/<body>, or the system colour scheme). It exists
// only while a skeleton is showing. Each skeleton also watches its own ancestors, for a theme set on a
// panel or a shadow host.
const themeWatchers = new Map(); // document → { subs: Map(key → paint), locals: Map(key → observer), stop() }
const THEME_ATTRS = ["class", "style", "data-theme", "data-mode", "data-color-scheme"];
function watchTheme(key, doc, paint, el) {
  let w = themeWatchers.get(doc);
  if (!w) {
    const win = doc.defaultView || window;
    const subs = new Map();
    let frame = 0;
    const refresh = () => {
      if (frame) return;
      frame = win.requestAnimationFrame(() => { frame = 0; subs.forEach((p) => p()); });
    };
    const mo = new win.MutationObserver(refresh);
    [doc.documentElement, doc.body].forEach((n) => n && mo.observe(n, { attributes: true }));
    const mq = win.matchMedia?.("(prefers-color-scheme: dark)");
    mq?.addEventListener?.("change", refresh);
    w = {
      subs,
      locals: new Map(),
      stop() {
        mo.disconnect();
        mq?.removeEventListener?.("change", refresh);
        if (frame) win.cancelAnimationFrame(frame);
      },
    };
    themeWatchers.set(doc, w);
  }
  w.subs.set(key, paint);
  const win = doc.defaultView || window;
  let frame = 0;
  const local = new win.MutationObserver(() => {
    if (!frame) frame = win.requestAnimationFrame(() => { frame = 0; if (w.subs.get(key) === paint) paint(); });
  });
  for (let n = el; n && n.nodeType === 1 && n !== doc.documentElement && n !== doc.body; n = n.parentElement || n.getRootNode()?.host) {
    local.observe(n, { attributes: true, attributeFilter: THEME_ATTRS });
  }
  w.locals.set(key, local);
  paint();
}
function unwatchTheme(key, doc) {
  const w = themeWatchers.get(doc);
  if (!w) return;
  w.subs.delete(key);
  w.locals.get(key)?.disconnect();
  w.locals.delete(key);
  if (!w.subs.size) {
    w.stop();
    themeWatchers.delete(doc);
  }
}
const transparent = (c) => !c || c === "transparent" || /^rgba\((?:[^,]*,){3}\s*0(?:\.0*)?\)$/.test(c) || /\/\s*0(?:\.0*)?%?\)$/.test(c);
// The first solid background at or above the element: what the handles and cursor edges are cut from
function backgroundOf(el) {
  const win = el.ownerDocument.defaultView || window;
  for (let n = el; n && n.nodeType === 1; n = n.parentElement || n.getRootNode()?.host) {
    const bg = win.getComputedStyle(n).backgroundColor;
    if (!transparent(bg)) return bg;
  }
  return "Canvas";
}

// ---------- Reading the shape ----------
const SKIP = new Set(["SCRIPT", "STYLE", "TEMPLATE", "NOSCRIPT", "BR", "WBR", "LINK", "META"]);
const MEDIA = new Set(["IMG", "VIDEO", "IFRAME", "PICTURE", "OBJECT", "EMBED", "CANVAS", "SVG"]);
const CONTROL = new Set(["BUTTON", "INPUT", "SELECT", "TEXTAREA", "PROGRESS", "METER"]);
const NO_CHILDREN = /^(IMG|VIDEO|AUDIO|CANVAS|SVG|INPUT|TEXTAREA|SELECT|IFRAME|PICTURE|EMBED|OBJECT|BR|HR)$/;
const kids = (n) => [...n.children].filter((c) => !c.classList.contains("cs-ov") && !SKIP.has(c.tagName.toUpperCase()));
const ownText = (n) => [...n.childNodes].some((c) => c.nodeType === 3 && c.data.trim());

function hasSurface(n) {
  const cs = getComputedStyle(n);
  return cs.backgroundImage !== "none" || parseFloat(cs.borderTopWidth) > 0 || !transparent(cs.backgroundColor);
}

// Converts viewport rects into the element's own padding-box coordinates, undoing any scale
// transform on the element or its ancestors (rotation is not supported)
function frameOf(el) {
  const r0 = el.getBoundingClientRect();
  const sx = el.offsetWidth ? r0.width / el.offsetWidth : 1;
  const sy = el.offsetHeight ? r0.height / el.offsetHeight : 1;
  return (r) => ({
    x: (r.left - r0.left) / sx - el.clientLeft,
    y: (r.top - r0.top) / sy - el.clientTop,
    w: r.width / sx,
    h: r.height / sy,
  });
}

// The element's outer (border-box) layout size, as DevTools shows it: unaffected by transforms
function outerSize(el) {
  if (el.offsetWidth || el.offsetHeight) return [el.offsetWidth, el.offsetHeight];
  const r = el.getBoundingClientRect();
  return [Math.round(r.width), Math.round(r.height)];
}

// Every element the cursors will draw ("leaves"), each with its skeleton blocks: an element with a
// surface (button, chip, image, input) keeps its own shape and radius; text becomes one bar per line.
function measure(el, W, H, o) {
  const leaves = [];
  if (o.trace !== "auto") return leaves;
  const doc = el.ownerDocument;
  const local = frameOf(el);
  const radius = (n) => getComputedStyle(n).borderRadius;
  const shape = (n, r) => ({ x: r.x, y: r.y, w: r.w, h: r.h, r: radius(n) });
  let blockCount = 0;
  const add = (n, r, blocks) => {
    if (leaves.length >= MAX_SHAPES || !blocks.length || blockCount >= MAX_BLOCKS) return;
    if (blockCount + blocks.length > MAX_BLOCKS) blocks = [shape(n, r)]; // over the budget: the element as one block
    blockCount += blocks.length;
    leaves.push({ el: n, x: r.x, y: r.y, w: r.w, h: r.h, blocks });
  };
  const isInline = (c) => getComputedStyle(c).display.startsWith("inline");

  // Text node by node, bounded by characters, nodes and rectangles: a long article costs the same as a short one
  const textBars = (n) => {
    const range = doc.createRange();
    const walker = doc.createTreeWalker(n, 4 /* NodeFilter.SHOW_TEXT */, { acceptNode: (t) => (t.parentElement?.closest(".cs-ov") ? 2 : 1) }); // skip the overlay's own labels
    const rects = [];
    let chars = 0, nodes = 0, t;
    while ((t = walker.nextNode()) && chars < MAX_TEXT && nodes++ < 200 && rects.length < 400) {
      if (!t.data.trim()) continue;
      range.setStart(t, 0);
      range.setEnd(t, Math.min(t.data.length, MAX_TEXT - chars));
      chars += t.data.length;
      for (const r of range.getClientRects()) if (r.width > 1 && r.height > 1) rects.push(r);
    }
    rects.sort((a, b) => a.top - b.top || a.left - b.left);
    const lines = [];
    for (const r of rects) {
      const L = lines[lines.length - 1];
      if (L && Math.min(L.b, r.bottom) - Math.max(L.t, r.top) > 0.5 * Math.min(L.b - L.t, r.height)) {
        L.l = Math.min(L.l, r.left); L.r = Math.max(L.r, r.right); L.t = Math.min(L.t, r.top); L.b = Math.max(L.b, r.bottom);
      } else if (lines.length < 8) lines.push({ l: r.left, r: r.right, t: r.top, b: r.bottom });
    }
    // Bars sit a little shorter than the glyph box, like a typical text skeleton
    const bars = lines.map((L) => {
      const b = local({ left: L.l, top: L.t, width: L.r - L.l, height: L.b - L.t });
      const h = b.h < 6 ? b.h : b.h * 0.62;
      return { x: b.x, y: b.y + (b.h - h) / 2, w: b.w, h, r: `${Math.min(4, h / 2)}px` };
    }).filter((b) => b.w >= 2 && b.y < H && b.y + b.h > 0);
    // Icons and chips inside the text keep their own small blocks
    for (const c of n.children) {
      if (c.classList.contains("cs-ov")) continue;
      if (bars.length >= 14) break;
      const t2 = c.tagName.toUpperCase();
      if (!(MEDIA.has(t2) || hasSurface(c))) continue;
      const r = local(c.getBoundingClientRect());
      if (r.w >= 2 && r.h >= 2) bars.push(shape(c, r));
    }
    return bars;
  };

  // The element itself is a headline, a paragraph, a button…: it is the one thing to draw
  const hostKids = kids(el);
  const inlineHost = hostKids.length && hostKids.length <= 40 && !hostKids.some((c) => c.hasAttribute("data-crosshair-part")) && hostKids.every(isInline);
  if (ownText(el) || inlineHost) {
    const box = { x: 0, y: 0, w: W, h: H };
    add(el, box, hasSurface(el) || CONTROL.has(el.tagName.toUpperCase()) ? [shape(el, box)] : textBars(el));
    return leaves;
  }

  // Three or more siblings of the same kind that have content of their own: rows of a table, items of a list
  const isRows = (cs) => cs.length >= 3 && cs.every((c) => c.tagName === cs[0].tagName && c.className === cs[0].className && !c.hasAttribute("data-crosshair-part")) &&
    (/^(TR|TH|TD|LI|DT|DD)$/.test(cs[0].tagName.toUpperCase()) || cs.every((c) => kids(c).length > 0));

  let budget = MAX_VISITS;
  const walk = (n) => {
    if (--budget < 0 || leaves.length >= MAX_SHAPES) return;
    const part = n.getAttribute("data-crosshair-part");
    if (part === "skip") return;
    // display:none and content-visibility only: while loading, everything is visibility:hidden on purpose
    if (n.checkVisibility && !n.checkVisibility()) return;
    const br = n.getBoundingClientRect();
    if (br.width < 1 || br.height < 1) {
      if (getComputedStyle(n).display === "contents") kids(n).forEach(walk);
      return;
    }
    const r = local(br);
    if (r.x >= W || r.y >= H || r.x + r.w <= 0 || r.y + r.h <= 0) return;
    const t = n.tagName.toUpperCase();
    const children = kids(n);
    // A run of simple shapes (chart bars, legend dots, swatches, a progress row) is one group: one selection
    // around all of them, and every shape settles at once instead of being drawn one by one
    if (!part && children.length >= GROUP_MIN && children.length <= GROUP_MAX && !MEDIA.has(t) && !CONTROL.has(t)) {
      const simple = (c) => !kids(c).length && !ownText(c) && (MEDIA.has(c.tagName.toUpperCase()) || hasSurface(c));
      if (children.every((c) => simple(c) && !c.hasAttribute("data-crosshair-part"))) {
        const shapes = children.map((c) => [c, local(c.getBoundingClientRect())]).filter(([, b]) => b.w >= 1 && b.h >= 1);
        if (shapes.length) {
          const x = Math.min(...shapes.map(([, b]) => b.x)), y = Math.min(...shapes.map(([, b]) => b.y));
          const w = Math.max(...shapes.map(([, b]) => b.x + b.w)) - x, h = Math.max(...shapes.map(([, b]) => b.y + b.h)) - y;
          return add(n, { x, y, w, h }, shapes.map(([c, b]) => shape(c, b)));
        }
      }
    }
    // Hinted parts, media and controls are one block in their own shape, whatever is inside
    if (part || MEDIA.has(t) || CONTROL.has(t) || n.getAttribute("role") === "img" || n.getAttribute("role") === "button") {
      return add(n, r, [shape(n, r)]);
    }
    // Repeated rows (table rows, list items, cards of one kind) are drawn in parallel: each row is read as
    // usual, then all of them become one group with one selection, so a table settles at once instead of
    // row by row. Not when the parent has text of its own (a label would be lost).
    if (!ownText(n) && isRows(children)) {
      const from = leaves.length;
      children.forEach(walk);
      const rows = leaves.splice(from);
      if (rows.length < 2) { leaves.push(...rows); return; }
      const x = Math.min(...rows.map((l) => l.x)), y = Math.min(...rows.map((l) => l.y));
      const w = Math.max(...rows.map((l) => l.x + l.w)) - x, h = Math.max(...rows.map((l) => l.y + l.h)) - y;
      leaves.push({ el: n, x, y, w, h, blocks: rows.flatMap((l) => l.blocks), group: true });
      return;
    }
    // Dense grids (a heatmap, a calendar) are one block in their own shape
    if (children.length > 40 && !children.some((c) => c.hasAttribute("data-crosshair-part"))) return add(n, r, [shape(n, r)]);
    const hinted = children.some((c) => c.hasAttribute("data-crosshair-part"));
    if (ownText(n) || (children.length && !hinted && children.every(isInline))) {
      // A text element: a surfaced one (button, chip, bubble) keeps its own shape, plain text becomes bars
      if (hasSurface(n)) return add(n, r, [shape(n, r)]);
      const bars = textBars(n);
      if (bars.length) return add(n, r, bars);
    }
    if (!children.length) {
      if (hasSurface(n)) add(n, r, [shape(n, r)]); // a coloured bar, an avatar circle; plain spacers are skipped
      return;
    }
    children.forEach(walk);
  };
  kids(el).forEach(walk);
  // The element itself is a table body or a list: its rows are one group too (the rows come in together at the swap)
  if (isRows(hostKids) && leaves.length > 1) {
    const x = Math.min(...leaves.map((l) => l.x)), y = Math.min(...leaves.map((l) => l.y));
    const w = Math.max(...leaves.map((l) => l.x + l.w)) - x, h = Math.max(...leaves.map((l) => l.y + l.h)) - y;
    return [{ el, x, y, w, h, blocks: leaves.flatMap((l) => l.blocks), group: true }];
  }
  return leaves;
}

// Grid lines land exactly on both edges; never more than ~48 lines however large the element
function buildGrid(doc, svg, W, H, cell) {
  cell = Math.max(cell, (W + H) / 48);
  const axis = (len) => {
    const n = Math.max(1, Math.round(len / cell)), out = [];
    for (let i = 1; i < n; i++) out.push(Math.round((i * len) / n) + 0.5);
    return out;
  };
  const xs = axis(W), ys = axis(H);
  const lines = [];
  const line = (d, delay) => lines.push({ n: node(doc, "path", { d, pathLength: "1", "stroke-dasharray": "1 1" }, svg, true), delay });
  xs.forEach((x) => line(`M${x} 0V${H}`, x / W));
  ys.forEach((y) => line(`M0 ${y}H${W}`, y / H));
  // Dots fade in as 12 diagonal bands: 12 animations, not one per dot
  const BANDS = 12, bands = [];
  if (xs.length * ys.length <= 900) {
    const groups = Array.from({ length: BANDS }, () => null);
    xs.forEach((x) => ys.forEach((y) => {
      const i = Math.min(BANDS - 1, Math.floor(((x + y) / (W + H)) * BANDS));
      groups[i] ||= node(doc, "g", {}, null, true);
      node(doc, "circle", { cx: x, cy: y, r: "1.15" }, groups[i], true);
    }));
    groups.forEach((g, i) => { if (g) { svg.appendChild(g); bands.push({ n: g, delay: i / (BANDS - 1) }); } });
  }
  return { lines, bands };
}

// The marquee: each cursor ("lane") takes the next element in reading order, travels to its top-left,
// presses, drags to its bottom-right and releases. Durations grow with the square root of distance, so
// long moves don't feel slow, and the whole draw is compressed to fit MAX_DRAW.
function schedule(leaves, W, H, t, start, laneCount, maxDraw) {
  const sk = t.drag / BUILD.drag; // the speed factor: minimum durations shrink with it too
  const K = {
    press: Math.min(60, t.drag * 0.25),
    settle: Math.min(80, t.drag * 0.35),
    gap: Math.min(70, t.drag * 0.3),
    selFade: Math.min(120, Math.max(30 * sk, t.drag * 0.5)),
    curFade: Math.min(200, Math.max(60 * sk, t.drag)),
    cross: Math.min(80, t.travel * 0.4),
  };
  const rand = rng(7);
  const origins = [[W + 28, H * 0.32], [-28, H * 0.58], [W * 0.62, H + 28], [W * 0.2, -28]];
  const lanes = Array.from({ length: laneCount }, (_, i) => ({ free: start + i * K.gap, x: origins[i][0], y: origins[i][1], entries: [] }));
  const entries = leaves.map((b) => {
    const lane = lanes.reduce((a, l) => (l.free < a.free ? l : a));
    const ts = lane.free;
    const arrive = ts + t.travel * clamp(Math.sqrt(Math.hypot(b.x - lane.x, b.y - lane.y) / 200), 0.5, 1.6);
    const dragStart = arrive + K.press;
    const dragEnd = dragStart + t.drag * clamp(Math.sqrt(Math.hypot(b.w, b.h) / 250), 0.6, 1.6);
    const e = { leaf: b, lane, from: { x: lane.x, y: lane.y }, ts, arrive, pressAt: arrive, dragStart, dragEnd, bend: (rand() < 0.5 ? -1 : 1) * (0.04 + rand() * 0.1) };
    lane.entries.push(e);
    lane.free = dragEnd + K.press;
    lane.x = b.x + b.w;
    lane.y = b.y + b.h;
    return e;
  });
  // Many elements: squeeze the whole draw into the time budget, keeping its rhythm
  const last = Math.max(start, ...entries.map((e) => e.dragEnd));
  const tail = Math.max(K.settle + t.fill, t.selHold + K.selFade, K.press + K.curFade);
  const room = Math.max(0, maxDraw - tail);
  const f = last - start > room ? room / (last - start) : 1; // room 0: everything at once
  const at = (v) => start + (v - start) * f;
  entries.forEach((e) => {
    e.ts = at(e.ts); e.arrive = at(e.arrive); e.pressAt = at(e.pressAt); e.dragStart = at(e.dragStart); e.dragEnd = at(e.dragEnd);
    e.settleAt = e.dragEnd + K.settle;
    e.selOff = e.dragEnd + t.selHold * f;
    e.press = K.press * f;
  });
  let end = start;
  entries.forEach((e) => { end = Math.max(end, e.selOff + K.selFade, e.settleAt + t.fill); });
  lanes.forEach((l) => { if (l.entries.length) end = Math.max(end, l.entries[l.entries.length - 1].dragEnd + K.press * f + K.curFade); });
  return { entries, lanes, end, K, f };
}

// Skeletons that start together are spaced out a little, so a page of them cascades in
// instead of every build drawing its first frames at the same moment (at most half a second)
// The host's children that are on screen (100 px margin). Reading positions is cheap once layout is
// done (10,000 rows take a few milliseconds); animating them is not, so only these get an animation.
function childrenOnScreen(all, vh) {
  return all.filter((c) => { const r = c.getBoundingClientRect(); return r.bottom > -100 && r.top < vh + 100; });
}

// The heavy steps (a build, the re-measure at the handover) go through one queue that runs them in
// slices of about 8 ms and yields in between, so twenty skeletons starting or finishing together never
// block a frame
const work = [];
let pumping = false;
function enqueue(fn) {
  work.push(fn);
  if (!pumping) { pumping = true; setTimeout(pump, 0); }
}
function pump() {
  const t0 = performance.now();
  do work.shift()(); while (work.length && performance.now() - t0 < 8);
  if (work.length) setTimeout(pump, 0); else pumping = false;
}

const SLOT = 60, MAX_QUEUE = 480;
let nextSlot = 0;
function buildSlot() {
  const now = performance.now();
  const at = Math.max(now, Math.min(nextSlot, now + MAX_QUEUE));
  nextSlot = at + SLOT;
  return at - now;
}

const pad4 = (n) => String(Math.max(0, Math.round(n))).padStart(4, "0");
const live = new WeakMap();
const active = new Set();

function noop() {
  const p = Promise.resolve();
  return { done: () => p, cancel() {}, finished: p, ending: true };
}

/**
 * Start a crosshair skeleton on an element.
 * @param {HTMLElement} el  The element that is loading. Give it its final size.
 * @param {Partial<typeof DEFAULTS>} [options]
 * @returns {{ done(): Promise<void>, cancel(): void, finished: Promise<void> }}
 */
export function crosshair(el, options = {}) {
  if (!NS_READY || !el) return noop();
  if (NO_CHILDREN.test(el.tagName.toUpperCase())) {
    // The overlay lives inside the element, so it needs one that can hold children
    console.warn("crosshair-skeleton: wrap <" + el.tagName.toLowerCase() + "> in a container and pass the container.");
    return noop();
  }
  live.get(el)?.supersede();
  injectStyles(el);

  const doc = el.ownerDocument;
  const win = doc.defaultView || window;
  const o = { ...DEFAULTS, ...options };
  const k = o.speed > 0 ? 1 / o.speed : 1;
  const t = Object.fromEntries(Object.entries(BUILD).map(([n, v]) => [n, v * k]));
  const reduced = win.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // A purely decorative play is skipped for people who asked for less motion: the content just shows
  if (o.auto && reduced) {
    if (el.getAttribute("data-crosshair") === "loading") el.setAttribute("data-crosshair", "done");
    return noop();
  }

  let state = "wait"; // wait → ready → queued → build → idle → reveal → done
  let visible = false, ov = null, ro = null, shownAt = 0, cleanAt = 0, revealQueued = false;
  let W = 0, H = 0, BW = 0, BH = 0, pulses = [], tracked = [];
  let leaves = [], sch = null, T = null, drawing = false, T0 = 0;
  let gridSvg = null, selSvg = null, blocksEl = null, badgesEl = null, cursEl = null, boxSel = null, boxBadge = null, chs = [], curEls = [];
  let roText = "";
  const timers = new Set();
  const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); };
  let resolve;
  const finished = new Promise((r) => (resolve = r));
  const themeKey = {};

  // Everything we change on the host, so cleanup can put it back exactly as it was
  const prevBusy = el.getAttribute("aria-busy");
  const prevHide = el.getAttribute("data-cs-hide");
  const hadInert = el.hasAttribute("inert");
  const hadStyle = el.hasAttribute("style");
  let prevPos = null, attrsRestored = false;
  const put = (name, value) => (value === null ? el.removeAttribute(name) : el.setAttribute(name, value));
  // At the reveal (or on cancel): content becomes visible and interactive again. Runs once, so a
  // value the app sets during the handover is never overwritten by the final cleanup.
  const restoreAttrs = () => {
    if (attrsRestored) return;
    attrsRestored = true;
    put("data-cs-hide", prevHide);
    put("aria-busy", prevBusy);
    if (!hadInert) el.removeAttribute("inert");
  };
  // At the end, once the overlay is gone (it is positioned against the host until then)
  const restoreHost = () => {
    restoreAttrs();
    if (prevPos) {
      if (prevPos.value) el.style.setProperty("position", prevPos.value, prevPos.priority);
      else el.style.removeProperty("position");
      if (!hadStyle && !el.getAttribute("style")) el.removeAttribute("style");
      prevPos = null;
    }
  };

  // Hidden, inert (no focus, clicks or screen reader access to the placeholder) and busy until the reveal
  el.removeAttribute("data-cs-show");
  el.setAttribute("data-cs-hide", "");
  el.setAttribute("aria-busy", "true");
  el.setAttribute("inert", "");
  later(() => { state = "ready"; maybeBuild(); }, o.grace);
  observe(el, (v) => {
    visible = v;
    if (state === "ready") maybeBuild();
    pulses.forEach((a) => (v ? a.play() : a.pause()));
  }, o.auto);

  function maybeBuild() {
    // Off-screen skeletons are not built until they scroll into view
    if (state !== "ready" || !visible) return;
    state = "queued";
    const wait = buildSlot();
    if (wait) later(() => enqueue(build), wait); else enqueue(build);
  }

  function setRo(label, w, h) {
    if (!ro) return;
    const text = `${label}|${pad4(w)} × ${pad4(h)}`;
    if (text === roText) return;
    roText = text;
    ro.firstChild.textContent = label;
    ro.lastChild.textContent = `${pad4(w)} × ${pad4(h)}`;
  }

  function build() {
    if (revealQueued || state !== "queued") return; // the data won the race: never draw
    if (!visible) { state = "ready"; return; } // scrolled away while queued: wait for it to come back
    state = "build";
    try {
      draw();
    } catch (err) {
      // Never leave content hidden because of a drawing problem, even if the element still declares loading
      console.warn("crosshair-skeleton: could not draw, showing the content instead.", err);
      el.setAttribute("data-cs-show", "");
      finish();
    }
  }

  // The overlay must not change the element's layout. As the last child it can switch off the element's
  // own :last-child rules (a list's last-row border, Tailwind's space-y), so if inserting it changes the
  // element's size, move it to the front, and keep whichever placement leaves the layout as it was.
  function place() {
    const before = el.getBoundingClientRect();
    const drift = () => { const r = el.getBoundingClientRect(); return Math.abs(r.width - before.width) + Math.abs(r.height - before.height); };
    el.appendChild(ov);
    const lastDrift = drift();
    if (lastDrift < 0.5) return;
    el.prepend(ov);
    if (drift() > lastDrift) el.appendChild(ov);
  }

  // The part of the element that is on screen, in its own coordinates, with a 100 px margin
  function viewY() {
    const r = el.getBoundingClientRect();
    const sy = el.offsetHeight ? r.height / el.offsetHeight : 1;
    return [(-r.top) / sy - el.clientTop - 100, (win.innerHeight - r.top) / sy - el.clientTop + 100];
  }

  // Inline size: host rules like `.card svg { width: 140px }` must not resize the overlay
  const svgAttrs = (cls, w, h) => ({ class: cls, width: w, height: h, viewBox: `0 0 ${w} ${h}`, style: `width:${w}px!important;height:${h}px!important` });

  // Skeleton blocks and the growing placeholder for each element
  function buildBlocks(list, layer) {
    list.forEach((lf) => {
      lf.wrap = node(doc, "div", { class: "cs-leaf" }, layer);
      lf.blocks.forEach((b) => {
        node(doc, "div", { class: "cs-b", style: `left:${f1(b.x)}px;top:${f1(b.y)}px;width:${f1(Math.max(1, b.w))}px;height:${f1(Math.max(1, b.h))}px;border-radius:${b.r}` }, lf.wrap);
      });
      lf.ph = node(doc, "div", { class: "cs-ph", style: `left:${f1(lf.x)}px;top:${f1(lf.y)}px` }, layer);
    });
  }

  function draw() {
    W = el.clientWidth; // the overlay covers the padding box
    H = el.clientHeight;
    [BW, BH] = outerSize(el); // the readout reports the element's outer size, as DevTools does
    if (W < 24 || H < 12) { // too small to draw; content just waits hidden (or, with auto, shows at once)
      state = "idle";
      if (o.auto) run.done();
      return;
    }
    leaves = measure(el, W, H, o);
    if (win.getComputedStyle(el).position === "static") {
      prevPos = { value: el.style.getPropertyValue("position"), priority: el.style.getPropertyPriority("position") };
      el.style.setProperty("position", "relative", "important");
    }

    const s = Math.max(0.4, Math.min(1, Math.min(W, H) / 140));
    const showRo = o.readout === true || (o.readout === "auto" && W >= 240 && H >= 120);
    const laneCount = typeof o.cursors === "number" ? clamp(Math.round(o.cursors), 1, 4) : leaves.length <= 2 ? 1 : leaves.length <= 5 ? 2 : 3;

    ov = node(doc, "div", { class: "cs-ov", "aria-hidden": "true" });
    const clip = node(doc, "div", { class: "cs-clip" }, ov);
    node(doc, "div", { class: "cs-fill" }, clip);
    gridSvg = node(doc, "svg", svgAttrs("cs-grid", W, H), clip, true);
    const grid = buildGrid(doc, gridSvg, W, H, o.cell);
    blocksEl = node(doc, "div", { class: "cs-layer" }, ov);
    buildBlocks(leaves, blocksEl);
    selSvg = node(doc, "svg", svgAttrs("cs-sel", W, H), ov, true);
    badgesEl = node(doc, "div", { class: "cs-layer" }, ov);
    cursEl = node(doc, "div", { class: "cs-layer" }, ov);
    if (o.trace !== "none") {
      boxSel = selectionNode(doc, selSvg);
      if (o.labels) boxBadge = node(doc, "div", { class: "cs-badge" }, badgesEl);
    }
    // Selections and labels are created when their drag starts and removed once they have faded,
    // so a skeleton with 90 elements never holds more than a handful of them

    chs = ["tl", "tr", "bl", "br"].map((c) => {
      const ch = node(doc, "div", { class: "cs-ch", "data-c": c, style: `scale:${s}` }, ov);
      node(doc, "i", {}, ch);
      return ch;
    });
    if (showRo) {
      ro = node(doc, "div", { class: "cs-ro" }, ov);
      node(doc, "b", {}, ro);
      node(doc, "span", {}, ro);
    }
    // Readout in the parent's colour; handles and cursor edges cut from the background behind
    watchTheme(themeKey, doc, () => {
      if (!ov) return;
      ov.style.setProperty("--cs-bg", backgroundOf(el));
      if (ro) ro.style.color = win.getComputedStyle(el.parentElement || el).color;
    }, el);
    place();
    shownAt = performance.now();

    if (reduced) {
      ov.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
      chs.forEach((ch) => (ch.style.opacity = 1));
      leaves.forEach((lf) => (lf.wrap.style.opacity = 1));
      if (ro) { ro.style.opacity = 1; setRo("AWAIT", BW, BH); }
      state = "idle";
      return;
    }

    const tGo = t.lock + BLINKS * t.blink;
    const gridStart = tGo + t.expand * 0.5;
    const dotStart = gridStart + t.draw * 0.45;
    const dotFade = t.draw * 0.5;
    const drawStart = tGo + t.drawStart;
    // Every build animation and the frame loop share one start time on the document timeline, so the
    // selections drawn per frame stay glued to the clip and corners the compositor animates
    T0 = doc.timeline.currentTime ?? 0;
    const at0 = (a) => { a.startTime = T0; return a; };
    // Only elements on screen (with a margin) get a cursor; the rest of a long list just fades its blocks in
    const [vTop, vBottom] = viewY();
    const shown = leaves.filter((lf) => lf.y < vBottom && lf.y + lf.h > vTop);
    leaves.filter((lf) => !shown.includes(lf)).forEach((lf) => at0(lf.wrap.animate([{ opacity: 0 }, { opacity: 1 }], { duration: t.fill, delay: drawStart, fill: "both" })));
    sch = shown.length ? schedule(shown, W, H, t, drawStart, laneCount, MAX_DRAW * k) : null;
    const boxEnd = o.trace !== "none" ? tGo + t.expand + t.selHold + Math.min(120 * k, Math.max(30 * k, t.expand * 0.25)) : 0;
    const end = Math.max(tGo + t.expand, dotStart + t.stagger + dotFade, sch ? sch.end : 0, boxEnd);
    cleanAt = tGo + t.expand; // never hand over while the corners are still travelling
    T = { tGo, gridStart, drawStart, end, phases: [[0, "LOCK"], [tGo, "MEASURE"], [gridStart, "MAP"], ...(sch ? [[drawStart, "DRAW"]] : []), [end, "AWAIT"]] };
    const back = (duration, delay, easing) => ({ duration, delay, easing, fill: "backwards" });

    // Lock-on: all four corners stacked at the origin, snapping in from blur, then two hard blinks
    chs.forEach((ch) => {
      const c = ch.dataset.c;
      at0(ch.animate([{ opacity: 0, scale: 1.8 * s }, { opacity: 1, scale: s }], { duration: t.lock, easing: EASE.lock, fill: "both" }));
      at0(ch.animate([{ filter: "blur(4px)" }, { filter: "blur(0px)" }], { duration: t.lock, easing: EASE.lock, fill: "backwards" }));
      at0(ch.firstChild.animate(
        [{ opacity: 1 }, { opacity: 1, offset: 0.5 }, { opacity: 0.08, offset: 0.5 }, { opacity: 0.08, offset: 0.999 }, { opacity: 1, offset: 1 }],
        { duration: t.blink, delay: t.lock, iterations: BLINKS }
      ));
      // Measure: corners travel out on the same curve as the clip, so the edges stay glued
      at0(ch.animate([{ translate: `${c[1] === "r" ? -W : 0}px ${c[0] === "b" ? -H : 0}px` }, { translate: "0px 0px" }], back(t.expand, tGo, EASE.expand)));
    });
    at0(clip.animate([{ clipPath: "inset(0 100% 100% 0)" }, { clipPath: "inset(0 0% 0% 0)" }], back(t.expand, tGo, EASE.expand)));

    // Map: grid lines sweep in from the origin, then the intersection dots
    grid.lines.forEach((l) => at0(l.n.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], back(t.draw, gridStart + l.delay * t.stagger, EASE.draw))));
    grid.bands.forEach((b) => at0(b.n.animate([{ opacity: 0 }, { opacity: 1 }], back(dotFade, dotStart + b.delay * t.stagger, "ease-out"))));
    if (ro) at0(ro.animate([{ opacity: 0, translate: "0 3px" }, { opacity: 1, translate: "0 0" }], { duration: 240, delay: t.lock * 0.5, easing: "ease-out", fill: "both" }));

    // Draw: the selections, blocks and cursors run in the shared frame loop, as a pure function of time
    if (sch && o.cursors !== false) curEls = sch.lanes.map(() => cursorNode(doc, cursEl));
    drawing = true;
    startTicking(render);

    // Wait: slow breathing on the grid, opacity only, so the compositor does it. Phase-locked to the
    // document clock so every skeleton on the page breathes together.
    later(() => {
      if (state === "build") state = "idle";
      // Nothing to wait for: rest on the finished skeleton for a moment, then hand over
      if (o.auto) return later(() => run.done(), AUTO_HOLD * k);
      if (!o.pulse) return;
      const a = gridSvg.animate([{ opacity: 1 }, { opacity: 0.4 }], { duration: PULSE, iterations: Infinity, direction: "alternate", easing: "ease-in-out" });
      a.startTime = Math.ceil(doc.timeline.currentTime / (2 * PULSE)) * 2 * PULSE;
      if (!visible) a.pause();
      pulses = [a];
    }, end);
  }

  // One frame of the build at time `now`
  function render(now) {
    if (!ov) return stopTicking(render);
    const tt = (doc.timeline.currentTime ?? now) - T0;
    if (tt > T.end + 50) {
      drawing = false;
      stopTicking(render);
    }
    if (!visible && drawing) return; // scrolled away: nothing to paint; it catches up when it comes back
    const { tGo } = T;
    const expEnd = tGo + t.expand;
    const e0 = expandCurve(prog(tt, tGo, t.expand));

    // The expand is the first marquee: the container's own selection, with the bottom-right corner as the drag handle
    if (boxSel) {
      const cFade = Math.min(120 * k, Math.max(30 * k, t.expand * 0.25));
      const op = tt >= tGo ? 1 - prog(tt, expEnd + t.selHold, cFade) : 0;
      paintSelection(boxSel, 0, 0, W * e0, H * e0, op);
      paintBadge(boxBadge, 0, 0, BW * e0, BH * e0, op);
    }

    if (sch) {
      const K = sch.K;
      for (const e of sch.entries) {
        if (e.done || tt < e.pressAt) continue; // finished, or not started yet (still in its initial state)
        const lf = e.leaf;
        const p = easeInOut(prog(tt, e.dragStart, e.dragEnd - e.dragStart));
        const w = lf.w * p, h = lf.h * p;
        // Placeholder grows with the drag, then settles into the skeleton blocks
        const on = tt >= e.dragStart;
        const fade = prog(tt, e.settleAt, t.fill);
        const phKey = on && fade < 1 ? `${f1(w)} ${f1(h)} ${f1(1 - fade)}` : "";
        if (lf.ph._k !== phKey) {
          lf.ph._k = phKey;
          lf.ph.style.display = phKey ? "block" : "none";
          if (phKey) {
            lf.ph.style.width = `${f1(w)}px`;
            lf.ph.style.height = `${f1(Math.max(1, h))}px`;
            lf.ph.style.opacity = f1(1 - fade);
          }
        }
        const wo = f1(fade);
        if (lf.wrap._o !== wo) { lf.wrap._o = wo; lf.wrap.style.opacity = wo; }
        const op = tt < e.selOff + K.selFade ? 1 - prog(tt, e.selOff, K.selFade) : 0;
        if (op > 0 && !lf.sel) {
          lf.sel = selectionNode(doc, selSvg);
          if (o.labels && lf.w >= 24) lf.badge = node(doc, "div", { class: "cs-badge" }, badgesEl);
        }
        if (lf.sel) {
          paintSelection(lf.sel, lf.x, lf.y, w, h, op);
          paintBadge(lf.badge, lf.x, lf.y, w, h, op);
        }
        if (op <= 0 && fade >= 1) {
          e.done = true;
          lf.sel?.remove();
          lf.badge?.remove();
          lf.sel = lf.badge = null;
        }
      }

      sch.lanes.forEach((lane, i) => {
        const cur = curEls[i];
        if (!cur) return;
        const es = lane.entries;
        if (!es.length || tt < es[0].ts) { if (cur._o !== 0) { cur._o = 0; cur.style.opacity = 0; } return; }
        let e = es[0];
        for (const x of es) if (x.ts <= tt) e = x;
        const lf = e.leaf;
        let x, y, op = prog(tt, es[0].ts, Math.min(120, K.curFade));
        if (tt < e.arrive) {
          const q = easeOut(prog(tt, e.ts, e.arrive - e.ts));
          const dx = lf.x - e.from.x, dy = lf.y - e.from.y;
          const L = Math.hypot(dx, dy) || 1;
          const off = Math.sin(Math.PI * q) * e.bend * Math.min(L, 300);
          x = e.from.x + dx * q + (-dy / L) * off;
          y = e.from.y + dy * q + (dx / L) * off;
        } else {
          const q = easeInOut(prog(tt, e.dragStart, e.dragEnd - e.dragStart));
          x = lf.x + lf.w * q;
          y = lf.y + lf.h * q;
        }
        if (e === es[es.length - 1]) {
          const out = prog(tt, e.dragEnd + e.press, K.curFade);
          op *= 1 - out;
          x += 14 * easeOut(out);
          y += 10 * easeOut(out);
        }
        const pressed = tt >= e.pressAt && tt < e.dragEnd + e.press * 0.7;
        const cross = tt >= e.arrive - K.cross && tt < e.dragEnd + e.press;
        const key = `${f1(x)} ${f1(y)} ${pressed} ${cross} ${f1(op)}`;
        if (cur._k === key) return;
        cur._k = key;
        cur._o = op;
        cur.classList.toggle("x", cross);
        cur.style.opacity = f1(op);
        cur.style.transform = `translate(${f1(x)}px,${f1(y)}px) scale(${f1((pressed ? 0.88 : 1) * CURSOR_SCALE * 100) / 100})`;
      });
    }

    if (ro && state !== "reveal") {
      let label = T.phases[0][1];
      for (const [at, name] of T.phases) if (tt >= at) label = name;
      setRo(label, BW * e0, BH * e0);
    }
  }

  function reveal() {
    if (state === "reveal" || state === "done") return;
    const wasIdle = state === "idle";
    state = "reveal";
    // A declared "loading" keeps content hidden until the app changes it; an auto run has no app to wait for
    if (o.auto) el.setAttribute("data-cs-show", "");
    timers.forEach(clearTimeout);
    timers.clear();
    if (!ov) return finish();
    // A re-render replaced the host's children and took the overlay with it: put it back for the handover
    if (!ov.isConnected) place();

    const now = T ? (doc.timeline.currentTime ?? 0) - T0 : performance.now() - shownAt; // build time, on the build's clock
    const D = reduced ? 200 : HAND.handoff * k;
    const opt = (duration, delay = 0) => ({ duration, delay, easing: EASE.out, fill: "forwards" });
    const NW = el.clientWidth, NH = el.clientHeight;
    if (!NW || !NH) return finish(); // hidden or collapsed just before the handover: nothing to reveal into

    // Lock onto the real content. It is rendered by now (still hidden), so measure it again. If it matches
    // what was drawn, the build carries on and every element waits for its own block; if it doesn't
    // (placeholder data with a different shape), the blocks are redrawn on the real layout at once.
    const fresh = measure(el, NW, NH, o);
    const same = NW === W && NH === H && fresh.length === leaves.length &&
      fresh.every((f, i) => f.el === leaves[i].el && Math.abs(f.x - leaves[i].x) < 1.5 && Math.abs(f.y - leaves[i].y) < 1.5 &&
        Math.abs(f.w - leaves[i].w) < 1.5 && Math.abs(f.h - leaves[i].h) < 1.5 && f.blocks.length === leaves[i].blocks.length &&
        f.blocks.every((b, j) => { const o = leaves[i].blocks[j]; return b.r === o.r && Math.abs(b.x - o.x) < 1.5 && Math.abs(b.y - o.y) < 1.5 && Math.abs(b.w - o.w) < 1.5 && Math.abs(b.h - o.h) < 1.5; }));
    let left = same && drawing && T ? Math.max(0, T.end - now) : 0; // build time still to run
    const entryOf = new Map(same && sch ? sch.entries.map((e) => [e.leaf, e]) : []);
    if (!same) {
      W = NW;
      H = NH;
      if (drawing) { drawing = false; stopTicking(render); }
      for (const svg of [gridSvg, selSvg]) for (const [k2, v] of Object.entries(svgAttrs(svg.getAttribute("class"), W, H))) svg.setAttribute(k2, v);
      gridSvg.replaceChildren();
      buildGrid(doc, gridSvg, W, H, o.cell);
      const old = blocksEl;
      blocksEl = node(doc, "div", { class: "cs-layer" }, null);
      old.after(blocksEl);
      buildBlocks(fresh, blocksEl);
      fresh.forEach((lf) => (lf.wrap.style.opacity = 1));
      if (!reduced) blocksEl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120 * k, easing: "ease-out" });
      old.animate([{ opacity: 1 }, { opacity: 0 }], opt(120 * k));
      leaves = fresh;
    } else if (!wasIdle && !drawing && sch) {
      left = 0;
    }
    [BW, BH] = outerSize(el);
    if (ro) setRo("READY", BW, BH);

    // The skeleton followed the theme while waiting; freeze its colour now, before any text colour animates
    ov.style.color = win.getComputedStyle(el).color;
    // Freeze the breathing where it is, so nothing jumps
    const og = +win.getComputedStyle(gridSvg).opacity;
    gridSvg.getAnimations().forEach((a) => a.cancel());
    gridSvg.style.opacity = og;
    pulses = [];

    // Only what is on screen is animated: a host with thousands of rows animates the few dozen in view,
    // and the rest simply appears (nobody can see it arrive). Rows are read in order and the scan stops
    // once 50 in a row sit below the screen.
    const hostKids = childrenOnScreen(kids(el), win.innerHeight);
    const [vTop, vBottom] = viewY();
    const onScreen = (lf) => lf.y < vBottom && lf.y + lf.h > vTop;
    const style = reduced ? "fade" : o.reveal;
    // Text sitting directly in the element can't take opacity, so it comes in through its colour
    // (the overlay's colour is frozen above; Chrome won't animate -webkit-text-fill-color)
    const ink = ownText(el) ? win.getComputedStyle(el).color : "";
    restoreAttrs();
    const opacityOf = (n) => +win.getComputedStyle(n).opacity; // each element comes back to its own opacity, not to 1
    let end = Math.max(D, left);
    const content = (n, frames, timing) => {
      tracked.push(n.animate(frames, { fill: "both", ...timing }));
      end = Math.max(end, (timing.delay || 0) + timing.duration);
    };
    const fadeText = (duration, delay) => ink && content(el, [{ color: "transparent" }, { color: ink }], { duration, delay, easing: EASE.out });

    // Build chrome (selections, labels, cursors, readout) clears once the build is done; grid and fill now
    const quick = Math.min(D * 0.3, 200);
    for (const layer of [selSvg, badgesEl, cursEl]) layer.animate([{ opacity: 1 }, { opacity: 0 }], opt(quick, left));
    if (ro) ro.animate([{ opacity: 1 }, { opacity: 0 }], opt(Math.max(D * 0.5, 200), left));
    gridSvg.animate([{ opacity: og }, { opacity: 0 }], opt(D * 0.45));
    ov.querySelector(".cs-fill").animate([{ opacity: 1 }, { opacity: 0 }], opt(D * 0.8));
    chs.forEach((ch) => ch.animate([{ opacity: 1 }, { opacity: 0 }], opt(D, left * 0.5)));
    end = Math.max(end, left + quick, left + Math.max(D * 0.5, 200), left * 0.5 + D, D * 0.8);

    const order = style === "flow" ? [...leaves].sort((a, b) => (Math.abs(a.y - b.y) < 4 ? a.x - b.x : a.y - b.y)) : leaves;
    if (style !== "fade" && order.length) {
      // The shell (cards, wrappers) fades in, then elements swap in place of their blocks in reading order;
      // none swaps before its own block has been drawn and shown (the draw itself is capped by MAX_DRAW)
      const inLeaves = new Set(order.map((lf) => lf.el));
      const item = HAND.item * k, step = HAND.step * k, start0 = D * 0.2;
      let shellAt = 0; // when the element itself is the group (a list of rows), its rows wait for their blocks
      // Only elements on screen take part in the cascade; the rest of a long list comes in at once.
      // The blur is kept for small sets: on many elements at once it costs more than it adds.
      const blur = order.filter(onScreen).length <= BLUR_MAX;
      let prev = -Infinity, i = 0;
      order.forEach((lf) => {
        const seen = onScreen(lf);
        const e = entryOf.get(lf);
        const ready = e && seen ? Math.max(0, e.settleAt + t.fill + HAND.minBlock * k - now) : 0;
        const at = seen ? Math.max(start0 + i++ * step, ready, style === "flow" ? prev + step : 0) : start0;
        if (seen) prev = at;
        if (lf.el === el) { fadeText(item, at); shellAt = at; }
        else if (seen) {
          // The rise and the blur only on screen, and only where the element has no translate or filter of its own
          const cs = win.getComputedStyle(lf.el);
          const rest = +cs.opacity;
          // A group (a table body, a long list) only fades: it may be mostly off screen
          const rise = !lf.group && (!cs.translate || cs.translate === "none");
          content(lf.el, rise ? [{ opacity: 0, translate: "0 4px" }, { opacity: rest, translate: "0 0" }] : [{ opacity: 0 }, { opacity: rest }], { duration: item, delay: at, easing: EASE.out });
          if (blur && !lf.group && cs.filter === "none") content(lf.el, [{ filter: "blur(3px)" }, { filter: "blur(0px)" }], { duration: item, delay: at, easing: EASE.out, fill: "backwards" });
        }
        lf.wrap.animate([{ opacity: 0 }], opt(item * 0.7, at));
        lf.ph.animate([{ opacity: 0 }], opt(item * 0.5, at));
      });
      hostKids.filter((c) => !inLeaves.has(c)).forEach((c) => content(c, [{ opacity: 0 }, { opacity: opacityOf(c) }], { duration: D * 0.5, delay: shellAt, easing: EASE.out }));
    } else {
      hostKids.forEach((c) => content(c, [{ opacity: 0 }, { opacity: opacityOf(c) }], { duration: D * 0.6, delay: left, easing: EASE.out }));
      fadeText(D * 0.6, left);
      blocksEl.animate([{ opacity: 1 }, { opacity: 0 }], opt(D * 0.45, left));
      end = Math.max(end, left + D);
    }
    // Once everything has landed: drop every animation and the overlay, leave the DOM as it was
    later(finish, end + 50);
  }

  function finish(superseded = false) {
    if (state === "done") return;
    state = "done";
    timers.forEach(clearTimeout);
    timers.clear();
    stopTicking(render);
    drawing = false;
    unobserve(el);
    unwatchTheme(themeKey, doc);
    if (live.get(el) === run) live.delete(el);
    active.delete(run);
    restoreHost();
    if (o.auto && !superseded) {
      // Nothing to wait for, so the element is done: a declared "loading" must not hide it again
      if (el.getAttribute("data-crosshair") === "loading") el.setAttribute("data-crosshair", "done");
      el.removeAttribute("data-cs-show");
    }
    tracked.forEach((a) => a.cancel());
    tracked = [];
    pulses = [];
    if (ov) {
      ov.getAnimations({ subtree: true }).forEach((a) => a.cancel());
      ov.remove();
    }
    ov = ro = null;
    resolve();
  }

  const run = {
    finished,
    /** The data is in and rendered: hand over (waits for a clean point if the skeleton is mid-build). */
    done() {
      if (state === "done" || revealQueued) return finished;
      revealQueued = true;
      // Always on a later tick: frameworks may call done() just before they write the new content
      if (!ov) later(finish, 0); // never drawn: a quick load, so no skeleton at all
      else later(() => enqueue(reveal), Math.max(0, shownAt + Math.max(o.minVisible, cleanAt) - performance.now()));
      return finished;
    },
    /** Stop at once and show the content as it is, no animation. (An element that still has
     *  data-crosshair="loading" stays hidden: the declared state wins until it changes.) */
    cancel() { finish(); },
    /** @internal a new run on the same element replaces this one: no "done" mark for an auto run */
    supersede() { finish(true); },
    /** @internal true once done() or cancel() has been called */
    get ending() { return revealQueued || state === "done"; },
  };
  run.el = el;
  live.set(el, run);
  active.add(run);
  return run;
}

/**
 * Declarative use: any element with data-crosshair="loading" gets a skeleton;
 * changing the attribute to anything else (or removing it) reveals the content.
 * Options: data-crosshair-reveal, data-crosshair-trace, data-crosshair-speed, data-crosshair-cursors, data-crosshair-auto.
 * Pass a shadow root to watch inside a web component.
 * @returns {() => void} stop watching (and stop the skeletons this watcher started)
 */
export function watch(root = NS_READY ? document : null) {
  if (!root) return () => {};
  const mine = new Set();
  const handle = (el) => {
    const v = el.getAttribute("data-crosshair");
    const current = live.get(el);
    if (v === "loading") {
      // Loading again while the previous run is still handing over: start a fresh one
      if (current && !current.ending) return;
      const d = el.dataset;
      const run = crosshair(el, {
        ...(d.crosshairReveal && { reveal: d.crosshairReveal }),
        ...(d.crosshairTrace && { trace: d.crosshairTrace }),
        ...(d.crosshairSpeed && { speed: +d.crosshairSpeed }),
        ...("crosshairAuto" in d && d.crosshairAuto !== "false" && { auto: true }), // a bare attribute counts
        ...(d.crosshairCursors && { cursors: d.crosshairCursors === "false" ? false : +d.crosshairCursors || true }),
      });
      mine.add(run);
      run.finished.then(() => mine.delete(run)); // owned until it has really finished, handover included
    } else {
      current?.done();
    }
  };
  root.querySelectorAll("[data-crosshair]").forEach(handle);
  const mo = new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === "attributes") handle(r.target);
      else r.addedNodes.forEach((n) => {
        if (n.nodeType !== 1) return;
        if (n.hasAttribute("data-crosshair")) handle(n);
        n.querySelectorAll("[data-crosshair]").forEach(handle);
      });
    }
    // An element removed while loading: stop its skeleton
    active.forEach((run) => { if (!run.el.isConnected) run.cancel(); });
  });
  mo.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-crosshair"] });
  return () => {
    mo.disconnect();
    mine.forEach((run) => run.cancel());
    mine.clear();
  };
}
