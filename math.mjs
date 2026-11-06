export const simpleAmount = (P, r, t) => P * (1 + (r / 100) * t);
export const compoundAmount = (P, r, t, m = 1) => P * (1 + r / 100 / m) ** (m * t);
export const perPeriod = (r, t, m = 1) => ({ rate: r / m, n: m * t });
export const principalFrom = (A, r, t, m = 1) => A / (1 + r / 100 / m) ** (m * t);
export const rateFrom = (P, A, t) => ((A / P) ** (1 / t) - 1) * 100;

export function breakdown(P, r, t, m = 1) {
  const amount = compoundAmount(P, r, t, m);
  const interestOnPrincipal = (P * r * t) / 100;
  return { principal: P, interestOnPrincipal, interestOnInterest: Math.max(0, amount - P - interestOnPrincipal), amount };
}

export function schedule(P, r, years, m = 1) {
  return Array.from({ length: years + 1 }, (_, year) => ({
    year,
    simple: simpleAmount(P, r, year),
    compound: compoundAmount(P, r, year, m),
    gap: compoundAmount(P, r, year, m) - simpleAmount(P, r, year),
    ...breakdown(P, r, year, m),
  }));
}

export function curve(fn, from, to, stepsPerYear = 1) {
  const count = Math.round((to - from) * stepsPerYear);
  return Array.from({ length: count + 1 }, (_, i) => {
    const x = from + i / stepsPerYear;
    return [x, fn(x)];
  });
}

export const money = (v) => `${v < 0 ? '-' : ''}$${Math.round(Math.abs(v)).toLocaleString('en-US')}`;
export const num = (v, d = 2) => String(Number(v.toFixed(d)));

export function axisMoney(v) {
  if (v >= 1e8) return `$${num(v / 1e8, 1)}億`;
  if (v >= 1e5) return `$${num(v / 1e4, 1)}萬`;
  return `$${Math.round(v).toLocaleString('en-US')}`;
}

export function niceScale(value, target = 5) {
  const safe = value > 0 ? value : 1;
  const raw = safe / target;
  const power = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].find((k) => k * power >= raw) * power;
  return { step, max: Math.ceil(safe / step) * step };
}

export function parseAnswer(text) {
  const clean = String(text ?? '').replace(/[,，\s$＄%％元]/g, '');
  if (clean === '') return null;
  const value = Number(clean);
  return Number.isFinite(value) ? value : null;
}

export const near = (a, b, tolerance) => Math.abs(a - b) <= tolerance;
