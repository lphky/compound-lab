const KEY = 'compound-lab-v1';
const blank = () => ({ done: {}, best: null, prefs: { large: false, reveal: false, calm: false } });

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (!saved || typeof saved !== 'object') return blank();
    return { ...blank(), ...saved, done: { ...saved.done }, prefs: { ...blank().prefs, ...saved.prefs } };
  } catch {
    return blank();
  }
}

export const state = load();
export let storageOk = true;

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    storageOk = true;
  } catch {
    storageOk = false;
  }
  return storageOk;
}

export function markDone(level) {
  if (state.done[level]) return false;
  state.done[level] = true;
  save();
  document.dispatchEvent(new Event('progress-change'));
  return true;
}

export function clearProgress() {
  state.done = {};
  state.best = null;
  save();
  document.dispatchEvent(new Event('progress-change'));
}

export const doneCount = () => [1, 2, 3, 4, 5, 6].filter((n) => state.done[n]).length;
export const hasBadge = () => doneCount() === 6;
