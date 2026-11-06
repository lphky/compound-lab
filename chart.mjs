import { niceScale, axisMoney, money } from './math.mjs';

export const COLORS = { simple: '#2a78d6', compound: '#eb6834', principal: '#1baf7a', ink: '#52606b' };

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const pathOf = (pts) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('');

export class Chart {
  constructor(host, spec = {}) {
    this.host = host;
    this.spec = { xMax: 10, series: [], cursor: null, snap: 1, ...spec };
    host.classList.add('chart');
    host.innerHTML = '<div class="chart-legend"></div><div class="chart-readout"></div><div class="chart-plot" tabindex="0" role="slider"></div>';
    this.legendEl = host.querySelector('.chart-legend');
    this.readoutEl = host.querySelector('.chart-readout');
    this.plot = host.querySelector('.chart-plot');
    this.width = 0;
    this.refresh = () => { this.width = 0; this.render(); };
    document.addEventListener('chart-refresh', this.refresh);
    this.observer = new ResizeObserver(() => { if (this.plot.clientWidth !== this.width) this.render(); });
    this.observer.observe(this.plot);
    this.bind();
    this.render();
  }

  destroy() {
    this.observer.disconnect();
    document.removeEventListener('chart-refresh', this.refresh);
  }

  set(patch) {
    Object.assign(this.spec, patch);
    this.render();
  }

  bind() {
    const { plot } = this;
    plot.addEventListener('pointerdown', (e) => {
      this.dragging = true;
      plot.setPointerCapture?.(e.pointerId);
      this.pointer(e);
    });
    plot.addEventListener('pointermove', (e) => {
      if (this.dragging || (e.pointerType === 'mouse' && !this.spec.handle)) this.pointer(e);
    });
    const stop = () => { this.dragging = false; };
    plot.addEventListener('pointerup', stop);
    plot.addEventListener('pointercancel', stop);
    plot.addEventListener('keydown', (e) => this.key(e));
  }

  limit() {
    return this.spec.reveal ?? this.spec.xMax;
  }

  moveCursor(x) {
    const { spec } = this;
    const snapped = clamp(Math.round(x / spec.snap) * spec.snap, spec.xMin ?? 0, this.limit());
    if (snapped === spec.cursor) return;
    spec.cursor = snapped;
    spec.onCursor?.(snapped);
    this.render();
  }

  pointer(e) {
    if (!this.geo) return;
    const { left, top } = this.plot.getBoundingClientRect();
    const { spec, geo } = this;
    if (spec.handle) {
      const value = geo.invY(e.clientY - top);
      const { min, max, step, onChange } = spec.handle;
      onChange(clamp(Math.round(value / step) * step, min, max));
      return;
    }
    if (spec.cursor === undefined || spec.noCursor) return;
    this.moveCursor(geo.invX(e.clientX - left));
  }

  key(e) {
    const { spec } = this;
    if (spec.handle) {
      const { y, step, min, max, onChange } = spec.handle;
      const delta = { ArrowUp: step, ArrowRight: step, ArrowDown: -step, ArrowLeft: -step }[e.key];
      if (!delta) return;
      e.preventDefault();
      onChange(clamp(y + delta, min, max));
      return;
    }
    if (spec.noCursor) return;
    const now = spec.cursor ?? 0;
    const target = { ArrowRight: now + spec.snap, ArrowUp: now + spec.snap, ArrowLeft: now - spec.snap, ArrowDown: now - spec.snap, Home: 0, End: this.limit() }[e.key];
    if (target === undefined) return;
    e.preventDefault();
    this.moveCursor(target);
  }

  bounds() {
    const { spec } = this;
    const values = [
      ...spec.series.flatMap((s) => s.points.map((p) => p[1])),
      ...(spec.stack?.rows ?? []).map((r) => r.values.reduce((a, b) => a + b, 0)),
      ...(spec.marks ?? []).map((m) => m.y),
      spec.handle?.max ?? 0,
    ];
    return niceScale(spec.yMax ?? Math.max(...values, 1));
  }

  render() {
    const { spec, plot } = this;
    const width = plot.clientWidth;
    if (!width) return;
    this.width = width;
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) / 16;
    const narrow = width < 460;
    const lines = spec.series.filter((s) => s.points.length);
    const labelled = lines.filter((s) => s.endLabel !== false && s.label);
    const longest = Math.max(0, ...labelled.map((s) => [...s.label].length));
    const right = narrow || !labelled.length ? 16 : Math.min(150, 20 + longest * 13.5) * rem;
    const m = { top: 16 * rem, right, bottom: 40 * rem, left: (narrow ? 58 : 72) * rem };
    const height = spec.height ?? clamp(width * 0.52, 270, 460) * Math.min(rem, 1.15);
    const { max, step } = this.bounds();
    const xMin = spec.xMin ?? 0;
    const pw = width - m.left - m.right;
    const ph = height - m.top - m.bottom;
    const X = (x) => m.left + ((x - xMin) / (spec.xMax - xMin || 1)) * pw;
    const Y = (y) => m.top + ph - (y / max) * ph;
    this.geo = {
      invX: (px) => xMin + ((px - m.left) / pw) * (spec.xMax - xMin),
      invY: (py) => ((m.top + ph - py) / ph) * max,
    };
    const parts = [];
    for (let v = 0; v <= max + step / 2; v += step) {
      parts.push(`<line class="grid" x1="${m.left}" x2="${width - m.right}" y1="${Y(v)}" y2="${Y(v)}"/><text class="tick" x="${m.left - 8}" y="${Y(v) + 4}" text-anchor="end">${axisMoney(v)}</text>`);
    }
    const span = spec.xMax - xMin;
    const room = Math.max(2, Math.floor(pw / (46 * rem)));
    const xStep = [1, 2, 5, 10, 20].find((k) => span / k <= room) ?? 20;
    for (let v = xMin; v <= spec.xMax + 1e-9; v += xStep) {
      parts.push(`<text class="tick" x="${X(v)}" y="${m.top + ph + 20 * rem}" text-anchor="middle">${v}</text>`);
    }
    parts.push(`<text class="axis-name" x="${m.left + pw / 2}" y="${height - 3}" text-anchor="middle">${spec.xName ?? '年'}</text>`);

    const limit = spec.reveal ?? spec.xMax;
    if (spec.vspan) parts.push(`<rect class="focus-span" x="${X(xMin)}" y="${m.top}" width="${X(Math.min(spec.vspan, limit)) - X(xMin)}" height="${ph}"/>`);

    if (spec.band) {
      const rows = spec.band.rows.filter((r) => r[0] <= limit + 1e-9);
      if (rows.length > 1) {
        const up = rows.map((r) => [X(r[0]), Y(r[2])]);
        const down = rows.map((r) => [X(r[0]), Y(r[1])]).reverse();
        parts.push(`<path class="band" fill="${spec.band.color}" d="${pathOf([...up, ...down])}Z"/>`);
      }
    }

    if (spec.stack) {
      const { rows, parts: defs } = spec.stack;
      const slot = pw / (spec.xMax - xMin + 1);
      const barW = clamp(slot * 0.72, 3, 44);
      rows.forEach((row) => {
        const cx = m.left + (row.x - xMin + 0.5) * slot;
        let base = 0;
        const active = spec.cursor === row.x;
        const topIndex = row.values.reduce((last, v, i) => (v > 0 ? i : last), 0);
        const segments = row.values.map((v, i) => {
          if (v <= 0) return '';
          const y1 = Y(base);
          base += v;
          const y2 = Y(base);
          const h = Math.max(0, y1 - y2 - (i < topIndex ? 2 : 0));
          const rad = i === topIndex ? Math.min(4, barW / 2, h) : 0;
          const x = cx - barW / 2;
          const yTop = y2 + (i === topIndex ? 0 : 2);
          const d = rad
            ? `M${x} ${y1}V${yTop + rad}Q${x} ${yTop} ${x + rad} ${yTop}H${x + barW - rad}Q${x + barW} ${yTop} ${x + barW} ${yTop + rad}V${y1}Z`
            : `M${x} ${y1}V${y1 - h}H${x + barW}V${y1}Z`;
          return `<path d="${d}" fill="${defs[i].color}"/>`;
        }).join('');
        parts.push(`<g class="bar${spec.cursor !== null && spec.cursor !== undefined && !active ? ' dim' : ''}">${segments}</g>`);
      });
      this.geo.invX = (px) => xMin + Math.floor((px - m.left) / slot);
    }

    if (spec.hline) {
      const y = Y(spec.hline.y);
      parts.push(`<line class="focus-line" x1="${m.left}" x2="${width - m.right}" y1="${y}" y2="${y}"/><text class="focus-text" x="${m.left + 8}" y="${y - 7}">${spec.hline.label}</text>`);
    }

    const ends = [];
    lines.forEach((s) => {
      const visible = s.points.filter((p) => p[0] <= limit + 1e-9);
      if (visible.length < 1) return;
      const capped = visible.map(([x, y]) => [X(x), Y(y)]);
      parts.push(`<path class="line" d="${pathOf(capped)}" stroke="${s.color}" stroke-width="${s.width ?? 2.5}"${s.dash ? ` stroke-dasharray="${s.dash}"` : ''}/>`);
      const [ex, ey] = capped[capped.length - 1];
      if (s.endLabel !== false && s.label && !narrow) ends.push({ x: ex, y: ey, label: s.label });
    });
    ends.sort((a, b) => a.y - b.y);
    const gap = 18 * rem;
    ends.forEach((e, i) => { if (i && e.y - ends[i - 1].y < gap) e.y = ends[i - 1].y + gap; });
    ends.forEach((e) => parts.push(`<text class="end-label" x="${e.x + 8}" y="${e.y + 4}">${e.label}</text>`));

    if (spec.stepNote) {
      const { x0, x1, y0, y1, label } = spec.stepNote;
      parts.push(`<path class="step-note" d="M${X(x0)} ${Y(y0)}H${X(x1)}V${Y(y1)}"/><text class="focus-text" x="${X(x1) + 6}" y="${(Y(y0) + Y(y1)) / 2}">${label}</text>`);
    }

    const cursor = spec.cursor;
    const showCursor = cursor !== null && cursor !== undefined && !spec.noCursor && !spec.handle;
    if (showCursor && !spec.stack) {
      parts.push(`<line class="crosshair" x1="${X(cursor)}" x2="${X(cursor)}" y1="${m.top}" y2="${m.top + ph}"/>`);
      lines.forEach((s) => {
        const hit = s.points.find((p) => Math.abs(p[0] - cursor) < 1e-9);
        if (hit && cursor <= limit) parts.push(`<circle class="dot" cx="${X(hit[0])}" cy="${Y(hit[1])}" r="5.5" fill="${s.color}"/>`);
      });
    }

    (spec.marks ?? []).forEach((mk) => {
      const px = X(mk.x);
      const py = Y(mk.y);
      const left = px > m.left + pw * 0.7;
      parts.push(`<circle class="dot mark" cx="${px}" cy="${py}" r="7" fill="${mk.color ?? COLORS.ink}"/><text class="mark-text" x="${px + (left ? -12 : 12)}" y="${py - 10}" text-anchor="${left ? 'end' : 'start'}">${mk.label ?? ''}</text>`);
    });

    if (spec.handle) {
      const { x, y, label } = spec.handle;
      parts.push(`<line class="crosshair" x1="${X(x)}" x2="${X(x)}" y1="${m.top}" y2="${m.top + ph}"/><circle class="handle-halo" cx="${X(x)}" cy="${Y(y)}" r="20"/><circle class="handle" cx="${X(x)}" cy="${Y(y)}" r="10"/><text class="mark-text" x="${X(x) - 18}" y="${Y(y) - 16}" text-anchor="end">${label ?? money(y)}</text>`);
    }

    plot.classList.toggle('has-handle', Boolean(spec.handle));
    plot.innerHTML = `<svg width="${width}" height="${height}" aria-hidden="true">${parts.join('')}</svg>`;
    this.renderLegend();
    this.renderReadout(showCursor);
    this.aria(showCursor);
  }

  renderLegend() {
    const { spec } = this;
    const items = [
      ...spec.series.filter((s) => s.label).map((s) => ({ ...s, kind: 'line' })),
      ...(spec.stack?.parts ?? []).map((p) => ({ ...p, kind: 'box' })).reverse(),
      ...(spec.band?.label ? [{ ...spec.band, kind: 'area' }] : []),
    ];
    this.legendEl.innerHTML = items.length < 2 ? '' : items.map((i) => {
      const key = i.kind === 'line'
        ? `<svg width="26" height="10" aria-hidden="true"><line x1="1" x2="25" y1="5" y2="5" stroke="${i.color}" stroke-width="3"${i.dash ? ` stroke-dasharray="${i.dash}"` : ''}/></svg>`
        : `<i class="swatch ${i.kind}" style="background:${i.color}"></i>`;
      return `<span>${key}${i.label}</span>`;
    }).join('');
  }

  renderReadout(show) {
    const { spec } = this;
    if (!spec.readout) { this.readoutEl.hidden = true; return; }
    this.readoutEl.hidden = false;
    const data = spec.readout(show ? spec.cursor : null);
    this.readoutEl.innerHTML = `<b>${data.title}</b>${(data.rows ?? []).map((r) => `<span>${r.color ? `<i class="swatch" style="background:${r.color}"></i>` : ''}${r.label} <strong>${r.value}</strong></span>`).join('')}`;
  }

  aria(show) {
    const { spec, plot } = this;
    plot.setAttribute('aria-label', spec.aria ?? '互動圖表');
    if (spec.handle) {
      plot.setAttribute('aria-valuemin', spec.handle.min);
      plot.setAttribute('aria-valuemax', spec.handle.max);
      plot.setAttribute('aria-valuenow', spec.handle.y);
      plot.setAttribute('aria-valuetext', `預測 ${money(spec.handle.y)}`);
      return;
    }
    plot.setAttribute('aria-valuemin', spec.xMin ?? 0);
    plot.setAttribute('aria-valuemax', this.limit());
    plot.setAttribute('aria-valuenow', spec.cursor ?? 0);
    plot.setAttribute('aria-valuetext', show ? this.readoutEl.textContent : '未選取年份');
  }
}
