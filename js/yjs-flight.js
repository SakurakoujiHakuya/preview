/* Update-flight overlay for <yjs-collab-lab>. Driven only by the lab's real
   Y.Doc update / deliver events; never changes counts, bytes or doc content. */
(() => {
  'use strict';
  const FLY = 240, STAGGER = 60, BOUNCE = 120, MARK = 300, MAX_VISIBLE = 5;
  const REPLAY = '\u91CD\u653E\u540C\u4E00 update', SYNC = '\u8865\u9F50\u5DEE\u91CF';
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CSS = `
.editors{position:relative;gap:48px}
.peer{position:relative}
.peer textarea{position:relative;z-index:1;background:transparent}
.mirror{position:absolute;left:0;right:0;bottom:0;overflow:hidden;pointer-events:none;padding:16px;font:16px/1.8 system-ui,sans-serif;white-space:pre-wrap;overflow-wrap:break-word;color:transparent;z-index:0}
.mirror mark{color:transparent;border-radius:3px;background:color-mix(in srgb,var(--c) 28%,transparent);transition:background ${MARK}ms ease-out}
.mirror mark.out{background:transparent}
.flight{position:absolute;inset:0;pointer-events:none;z-index:2}
.flight .wire{position:absolute;background:var(--flight-line,#9aa3a8)}
.flight .dot{position:absolute;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%;left:0;top:0}
.flight .a{background:var(--flight-a,#0B6E8A)}.flight .b{background:var(--flight-b,#9B3F8F)}
.flight .more{position:absolute;font:600 10px/1 ui-monospace,monospace;color:var(--y-muted,#53645c);transform:translate(-50%,-50%);left:0;top:0}
.logs{height:168px;overflow-y:auto}
#toggle{min-width:132px}
@media(max-width:560px){#toggle{min-width:0}.toolbar{display:grid;grid-template-columns:1fr 1fr}.toolbar button{padding:10px 6px;font-size:13px;white-space:nowrap;min-height:44px}}
@media(max-width:560px){.editors{gap:24px}}`;

  function enhance(el) {
    const lab = el.lab, root = el.shadowRoot;
    if (!lab || !root || el._flight) return;
    el._flight = true;
    const style = document.createElement('style'); style.textContent = CSS; root.appendChild(style);
    const editors = root.querySelector('.editors');
    const peers = [...root.querySelectorAll('.peer')];
    const areas = el.areas;
    const layer = document.createElement('div'); layer.className = 'flight'; layer.setAttribute('aria-hidden', 'true');
    const wire = document.createElement('i'); wire.className = 'wire'; layer.appendChild(wire);
    editors.appendChild(layer);
    const mirrors = areas.map(a => { const m = document.createElement('div'); m.className = 'mirror'; m.setAttribute('aria-hidden', 'true'); a.before(m); a.addEventListener('scroll', () => { m.scrollTop = a.scrollTop; }); return m; });
    const queue = [0, 0]; // locally held updates per origin side (mirrors lab.pending)
    let queueEls = [];

    // Geometry: endpoints are the facing edges of A and B; the wire spans the gap.
    function geom() {
      const e = editors.getBoundingClientRect(), a = peers[0].getBoundingClientRect(), b = peers[1].getBoundingClientRect();
      const stacked = b.top >= a.bottom - 1;
      if (stacked) { const x = a.left - e.left + a.width / 2; return { stacked, p: [{ x, y: a.bottom - e.top }, { x, y: b.top - e.top }] }; }
      const y = a.top - e.top + a.height / 2; return { stacked, p: [{ x: a.right - e.left, y }, { x: b.left - e.left, y }] };
    }
    function layout() {
      const g = geom(), [p, q] = g.p;
      Object.assign(wire.style, g.stacked
        ? { left: p.x + 'px', top: p.y + 'px', width: '1px', height: (q.y - p.y) + 'px' }
        : { left: p.x + 'px', top: p.y + 'px', height: '1px', width: (q.x - p.x) + 'px' });
      mirrors.forEach((m, i) => { m.style.top = areas[i].offsetTop + 'px'; m.style.height = areas[i].offsetHeight + 'px'; });
      drawQueue();
    }
    const mid = g => ({ x: (g.p[0].x + g.p[1].x) / 2, y: (g.p[0].y + g.p[1].y) / 2 });
    // Queued dots: a column per side at the midpoint (A on the A side, B on the B side).
    function queueSlot(g, side, k) {
      const m = mid(g), off = side ? 6 : -6, step = 11, start = -((Math.min(queue[side], MAX_VISIBLE + 1) - 1) * step) / 2;
      return g.stacked ? { x: m.x + start + k * step, y: m.y + off } : { x: m.x + off, y: m.y + start + k * step };
    }
    function drawQueue() {
      queueEls.forEach(n => n.remove()); queueEls = [];
      const g = geom();
      [0, 1].forEach(side => {
        const n = queue[side]; if (!n) return;
        const shown = Math.min(n, MAX_VISIBLE);
        for (let k = 0; k < shown; k++) {
          const s = queueSlot(g, side, k), d = dot(side); d.style.transform = `translate(${s.x}px,${s.y}px)`; d.dataset.queued = side; queueEls.push(d);
        }
        if (n > MAX_VISIBLE) {
          const s = queueSlot(g, side, shown), t = document.createElement('span'); t.className = 'more'; t.textContent = '+' + (n - MAX_VISIBLE);
          if (g.stacked) s.x += 6; else s.y += 4;
          t.style.transform = `translate(${s.x}px,${s.y}px) translate(-50%,-50%)`; layer.appendChild(t); queueEls.push(t);
        }
      });
    }
    function dot(side) { const d = document.createElement('i'); d.className = 'dot ' + (side ? 'b' : 'a'); layer.appendChild(d); return d; }

    let lastLaunch = 0;
    function launch(from, to, kind, range, fromPt) {
      const now = performance.now(), delay = Math.max(0, lastLaunch + STAGGER - now); lastLaunch = now + delay;
      const land = () => range && highlight(to, range, from);
      if (reduced()) { if (kind !== 'bounce') setTimeout(land, delay); return; }
      const g = geom(), a = fromPt || g.p[from], b = g.p[to], d = dot(from);
      const t = (p) => `translate(${p.x}px,${p.y}px)`;
      d.style.transform = t(a);
      const frames = kind === 'bounce' ? [{ transform: t(a), offset: 0 }, { transform: t(b), offset: FLY / (FLY + BOUNCE) }, { transform: t(a), opacity: 0, offset: 1 }] : [{ transform: t(a) }, { transform: t(b) }];
      const anim = d.animate(frames, { duration: kind === 'bounce' ? FLY + BOUNCE : FLY, delay, easing: 'ease-out', fill: 'forwards' });
      anim.onfinish = () => { d.remove(); if (kind !== 'bounce') land(); };
    }

    // Per-char highlight: a text mirror behind the transparent textarea marks the inserted range.
    const timers = [0, 0];
    function highlight(i, [s, e], from) {
      const text = lab.values()[i]; if (e <= s || e > text.length) return;
      const m = mirrors[i]; m.replaceChildren(text.slice(0, s));
      const mk = document.createElement('mark'); mk.style.setProperty('--c', `var(--flight-${from ? 'b' : 'a'})`); mk.textContent = text.slice(s, e);
      m.append(mk, text.slice(e) + '\n'); m.scrollTop = areas[i].scrollTop;
      clearTimeout(timers[i]);
      timers[i] = setTimeout(() => { mk.classList.add('out'); timers[i] = setTimeout(() => m.replaceChildren(), MARK); }, MARK);
    }
    function diff(a, b) {
      let s = 0; while (s < a.length && s < b.length && a[s] === b[s]) s++;
      let ea = a.length, eb = b.length; while (ea > s && eb > s && a[ea - 1] === b[eb - 1]) { ea--; eb--; }
      return eb > s ? [s, eb] : null;
    }

    // Hook the lab's own transport. Original behaviour runs unchanged first.
    function bindDocs() {
      queue[0] = queue[1] = 0;
      lab.docs.forEach((doc, n) => doc.on('update', (u, origin) => {
        if (origin === 'remote' || (lab.connected && !lab.hold)) return;
        queue[n]++; drawQueue();
      }));
      drawQueue();
    }
    const origReset = lab.reset.bind(lab), origDeliver = lab.deliver.bind(lab);
    lab.reset = function () { origReset(); bindDocs(); };
    lab.deliver = function (from, to, update, label) {
      const before = lab.values()[to];
      origDeliver(from, to, update, label);
      const range = diff(before, lab.values()[to]);
      if (label === REPLAY) return launch(from, to, 'bounce', null);
      if (label === SYNC) {
        const n = queue[from]; const g = geom();
        const pts = Array.from({ length: n }, (_, k) => queueSlot(g, from, Math.min(k, MAX_VISIBLE - 1)));
        queue[from] = 0; drawQueue();
        pts.forEach((p, k) => launch(from, to, 'fly', k === n - 1 ? range : null, p));
        return;
      }
      launch(from, to, 'fly', range);
    };
    bindDocs();
    layout();
    new ResizeObserver(layout).observe(editors);

    // One-shot scripted demo on first view, using the real docs. Skipped under reduced motion
    // or once the visitor has touched the lab.
    let touched = false;
    root.addEventListener('pointerdown', () => { touched = true; }, true);
    root.addEventListener('keydown', () => { touched = true; }, true);
    const io = new IntersectionObserver(es => {
      if (!es.some(e => e.isIntersecting)) return;
      io.disconnect();
      if (reduced() || touched) return;
      lab.demo();
      setTimeout(() => { if (!touched && !lab.connected) lab.toggle(); }, 1400);
    }, { threshold: 0.4 });
    io.observe(editors);
  }

  if (!('customElements' in window)) return;
  customElements.whenDefined('yjs-collab-lab').then(() => document.querySelectorAll('yjs-collab-lab').forEach(enhance));
})();
