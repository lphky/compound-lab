export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const FACES = {
  dan: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="22" fill="#2a78d6"/><circle cx="24" cy="24" r="17" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="2"/><circle cx="17" cy="21" r="2.6" fill="#fff"/><circle cx="31" cy="21" r="2.6" fill="#fff"/><path d="M17 31h14" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>',
  fuk: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="22" fill="#eb6834"/><circle cx="24" cy="24" r="17" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="2"/><circle cx="17" cy="21" r="2.6" fill="#fff"/><circle cx="31" cy="21" r="2.6" fill="#fff"/><path d="M16 29c3 6 13 6 16 0" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>',
};

export const talk = (who, text) => `<div class="talk ${who}"><span class="face">${FACES[who]}</span><p><b>${who === 'dan' ? '單仔' : '複仔'}</b>${text}</p></div>`;

export const slider = ({ id, label, min, max, step, value, text }) => `
  <label class="slider" for="${id}">
    <span>${label}<output id="${id}-out">${text(value)}</output></span>
    <input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}">
  </label>`;

export function bindSlider(root, { id, text }, onInput) {
  const input = $(`#${id}`, root);
  const out = $(`#${id}-out`, root);
  input.addEventListener('input', () => {
    const value = Number(input.value);
    out.textContent = text(value);
    onInput(value);
  });
  return (value) => { input.value = value; out.textContent = text(value); };
}

export const seg = (name, label, options, value) => `
  <div class="seg" role="group" aria-label="${label}" data-seg="${name}">
    ${options.map((o) => `<button type="button" data-value="${o.value}" aria-pressed="${o.value === value}">${o.label}</button>`).join('')}
  </div>`;

export function bindSeg(root, name, onPick) {
  const box = $(`[data-seg="${name}"]`, root);
  box.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (!button) return;
    $$('button', box).forEach((b) => b.setAttribute('aria-pressed', b === button));
    onPick(button.dataset.value);
  });
}

export function feedback(el, kind, html) {
  el.className = `feedback ${kind}`;
  el.innerHTML = html;
  el.hidden = false;
}

export const stat = (label, value, note = '') => `<div class="stat"><span>${label}</span><strong>${value}</strong>${note ? `<small>${note}</small>` : ''}</div>`;
export const revealButton = (id) => `<button type="button" class="teacher-only" id="${id}">教師揭曉</button>`;
