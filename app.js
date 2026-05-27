const STORE_DOTS = [
  { id: 'D400', x: 75.57, y: 5.95 }, { id: 'D500', x: 71.37, y: 10.13 }, { id: 'D300', x: 80.27, y: 10.13 },
  { id: 'D900', x: 62.0, y: 10.13 }, { id: 'E100', x: 49.33, y: 19.14 }, { id: 'D200', x: 80.25, y: 20.75 },
  { id: 'D100', x: 80.39, y: 29.07 }, { id: 'D600', x: 71.47, y: 29.08 }, { id: 'D800', x: 61.98, y: 29.09 },
  { id: 'F400', x: 16.58, y: 29.97 }, { id: 'F300', x: 28.85, y: 29.98 }, { id: 'E200', x: 45.19, y: 29.98 },
  { id: 'D700', x: 66.68, y: 32.89 }, { id: 'F500', x: 16.63, y: 38.97 }, { id: 'F200', x: 28.88, y: 38.98 },
  { id: 'C700', x: 71.56, y: 40.45 }, { id: 'E300', x: 45.18, y: 41.0 }, { id: 'B100', x: 71.55, y: 45.34 },
  { id: 'C600', x: 61.85, y: 45.35 }, { id: 'A600', x: 83.44, y: 45.35 }, { id: 'F700', x: 16.62, y: 50.47 },
  { id: 'F100', x: 28.87, y: 50.47 }, { id: 'E400', x: 45.22, y: 50.93 }, { id: 'A500', x: 83.46, y: 55.02 },
  { id: 'C500', x: 61.91, y: 55.03 }, { id: 'B200', x: 71.73, y: 55.04 }, { id: 'G100', x: 20.03, y: 63.28 },
  { id: 'G200', x: 32.28, y: 63.29 }, { id: 'I400', x: 33.43, y: 67.63 }, { id: 'K400', x: 14.97, y: 67.63 },
  { id: 'J100', x: 25.02, y: 67.64 }, { id: 'H100', x: 48.37, y: 67.64 }, { id: 'A400', x: 83.46, y: 67.65 },
  { id: 'B300', x: 71.66, y: 67.65 }, { id: 'C400', x: 62.18, y: 67.66 }, { id: 'J200', x: 25.0, y: 75.2 },
  { id: 'K300', x: 14.98, y: 75.2 }, { id: 'I300', x: 33.45, y: 75.21 }, { id: 'H200', x: 48.37, y: 75.21 },
  { id: 'C300', x: 62.07, y: 75.21 }, { id: 'B400', x: 71.63, y: 75.22 }, { id: 'A300', x: 83.45, y: 75.23 },
  { id: 'A200', x: 83.47, y: 84.21 }, { id: 'C200', x: 62.1, y: 84.21 }, { id: 'B500', x: 71.67, y: 84.21 },
  { id: 'K200', x: 14.98, y: 84.21 }, { id: 'J300', x: 25.05, y: 84.21 }, { id: 'I200', x: 33.46, y: 84.21 },
  { id: 'H300', x: 48.39, y: 84.22 }, { id: 'J400', x: 25.0, y: 93.2 }, { id: 'B600', x: 71.71, y: 93.21 },
  { id: 'H400', x: 48.37, y: 93.21 }, { id: 'K100', x: 14.98, y: 93.21 }, { id: 'A100', x: 83.46, y: 93.21 },
  { id: 'C100', x: 62.07, y: 93.22 }, { id: 'I100', x: 33.45, y: 93.22 },
];

const subShelfMap = {
  'Kaffi og te': { Kaffi: 'A100,A200', Te: 'A100,A200', 'Heitt súkkulaði': 'A100,A200' },
  'Kornvörur': { Brauð: 'A100,A200,A300,A400,C500,C600', Núðlur: 'B300,B400,B500', Pasta: 'B300,B400,B500,C500,C600,D700,D800' },
  'Drykkjarvörur': { Vatn: 'A400,A500,A600,K100', Gos: 'A400,A500,A600,K100,C600', Safi: 'A400,A500,A600,D700,D800,B600,C600' },
};

const state = {
  selectedDot: null,
  selectedMain: '',
  selectedSub: '',
  dotButtons: new Map(),
};

const norm = (s) => s.split(',').map((x) => x.trim().toUpperCase()).filter(Boolean);
const csv = (arr) => [...new Set(arr)].sort().join(',');

const els = {
  tree: document.getElementById('category-tree'), map: document.getElementById('store-map'), status: document.getElementById('map-status'),
  subDots: document.getElementById('selected-sub-dots'), dotSubs: document.getElementById('dot-subcategories'),
  mainForm: document.getElementById('main-category-form'), mainInput: document.getElementById('main-category-input'),
  subForm: document.getElementById('sub-category-form'), subInput: document.getElementById('sub-category-input'), subMainSelect: document.getElementById('sub-main-select'),
  assignMain: document.getElementById('assign-main'), assignSub: document.getElementById('assign-sub'),
  codeArea: document.getElementById('category-code'), importCode: document.getElementById('import-code'),
  exportCode: document.getElementById('export-code'), codeStatus: document.getElementById('code-status'),
};

function rebuildSelectors() {
  const mains = Object.keys(subShelfMap);
  [els.subMainSelect, els.assignMain].forEach((sel) => {
    sel.innerHTML = mains.map((m) => `<option>${m}</option>`).join('');
  });
  if (!mains.includes(state.selectedMain)) state.selectedMain = mains[0] || '';
  els.assignMain.value = state.selectedMain;
  els.subMainSelect.value = mains[0] || '';
  rebuildSubSelector();
}

function rebuildSubSelector() {
  state.selectedMain = els.assignMain.value;
  const subs = Object.keys(subShelfMap[state.selectedMain] || {});
  els.assignSub.innerHTML = subs.map((s) => `<option>${s}</option>`).join('');
  state.selectedSub = subs.includes(state.selectedSub) ? state.selectedSub : (subs[0] || '');
  els.assignSub.value = state.selectedSub;
  refreshViews();
}

function renderTree() {
  els.tree.innerHTML = '';
  const root = document.createElement('ul');
  for (const [main, subs] of Object.entries(subShelfMap)) {
    const li = document.createElement('li');
    li.innerHTML = `<div class="category-line"><strong>${main}</strong><button class="delete-btn" data-main="${main}">Delete main</button></div>`;
    const subUl = document.createElement('ul');
    Object.keys(subs).forEach((sub) => {
      const subLi = document.createElement('li');
      subLi.innerHTML = `<div class="category-line">${sub}<button class="delete-btn" data-main="${main}" data-sub="${sub}">Delete sub</button></div>`;
      subUl.appendChild(subLi);
    });
    li.appendChild(subUl);
    root.appendChild(li);
  }
  els.tree.appendChild(root);
}

function codeToSubcategoriesMap() {
  const map = {};
  for (const [main, subs] of Object.entries(subShelfMap)) {
    for (const [sub, dotsCsv] of Object.entries(subs)) {
      for (const code of norm(dotsCsv)) {
        (map[code] ||= []).push(`${main} > ${sub}`);
      }
    }
  }
  return map;
}

function getSelectedSubCodes() {
  return norm((subShelfMap[state.selectedMain] || {})[state.selectedSub] || '');
}

function refreshDots() {
  const selectedCodes = new Set(getSelectedSubCodes());
  for (const [id, btn] of state.dotButtons.entries()) {
    btn.classList.toggle('bound', selectedCodes.has(id));
  }
}

function refreshViews() {
  const dots = getSelectedSubCodes();
  els.subDots.textContent = JSON.stringify({ main: state.selectedMain, sub: state.selectedSub, dots }, null, 2);
  refreshDots();
  if (state.selectedDot) {
    const rev = codeToSubcategoriesMap();
    const items = rev[state.selectedDot.id] || [];
    els.dotSubs.innerHTML = items.map((x) => `<li>${x}</li>`).join('') || '<li>No linked sub-categories</li>';
  }
}

function toggleSelectedSubDot(dotId) {
  const selected = new Set(getSelectedSubCodes());
  if (selected.has(dotId)) selected.delete(dotId);
  else selected.add(dotId);
  subShelfMap[state.selectedMain][state.selectedSub] = csv([...selected]);
  refreshViews();
}

function selectStoreDot(dot, button) {
  state.selectedDot = dot;
  document.querySelectorAll('.map-dot.active').forEach((el) => el.classList.remove('active'));
  button.classList.add('active');
  toggleSelectedSubDot(dot.id);
  els.status.textContent = `Selected ${dot.id} and toggled it for ${state.selectedMain} > ${state.selectedSub}`;
}

function renderStoreDots() {
  STORE_DOTS.forEach((dot) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'map-dot';
    button.title = dot.id;
    button.setAttribute('aria-label', `Select store location ${dot.id}`);
    button.style.left = `${dot.x}%`;
    button.style.top = `${dot.y}%`;
    button.addEventListener('click', () => selectStoreDot(dot, button));
    els.map.appendChild(button);
    state.dotButtons.set(dot.id, button);
  });
}

function formatCategoryCode() {
  return `const subShelfMap = ${JSON.stringify(subShelfMap, null, 2)};`;
}

function cleanImportText(raw) {
  let text = raw.trim();
  text = text.replace(/^const\s+subShelfMap\s*=\s*/i, '');
  text = text.replace(/^let\s+subShelfMap\s*=\s*/i, '');
  text = text.replace(/^var\s+subShelfMap\s*=\s*/i, '');
  if (text.endsWith(';')) text = text.slice(0, -1).trim();
  if (!text.startsWith('{')) text = `{${text}`;
  if (!text.endsWith('}')) text = `${text}}`;
  return text.replace(/,\s*([}\]])/g, '$1');
}

function normalizeImportedMap(imported) {
  if (!imported || typeof imported !== 'object' || Array.isArray(imported)) {
    throw new Error('Imported code must be an object of main categories.');
  }

  const normalized = {};
  for (const [main, subs] of Object.entries(imported)) {
    if (!subs || typeof subs !== 'object' || Array.isArray(subs)) {
      throw new Error(`Category "${main}" must contain sub-categories.`);
    }
    normalized[main] = {};
    for (const [sub, dots] of Object.entries(subs)) {
      const rawDots = Array.isArray(dots) ? dots.join(',') : String(dots ?? '');
      normalized[main][sub] = csv(norm(rawDots));
    }
  }
  return normalized;
}

function replaceSubShelfMap(nextMap) {
  Object.keys(subShelfMap).forEach((key) => delete subShelfMap[key]);
  Object.assign(subShelfMap, nextMap);
}

function countSubcategories(map) {
  return Object.values(map).reduce((total, subs) => total + Object.keys(subs).length, 0);
}

function getUnknownImportedDots(map) {
  const known = new Set(STORE_DOTS.map((dot) => dot.id));
  const unknown = new Set();
  for (const subs of Object.values(map)) {
    for (const dotsCsv of Object.values(subs)) {
      for (const dotId of norm(dotsCsv)) {
        if (!known.has(dotId)) unknown.add(dotId);
      }
    }
  }
  return [...unknown].sort();
}

function importCategoryCode() {
  try {
    const raw = els.codeArea.value.trim();
    if (!raw) {
      els.codeStatus.textContent = 'Paste category code before importing.';
      return;
    }

    const parsed = JSON.parse(cleanImportText(raw));
    const nextMap = normalizeImportedMap(parsed);
    replaceSubShelfMap(nextMap);
    state.selectedMain = Object.keys(subShelfMap)[0] || '';
    state.selectedSub = '';
    renderTree();
    rebuildSelectors();

    const unknown = getUnknownImportedDots(nextMap);
    const baseMessage = `Imported ${Object.keys(nextMap).length} main categories and ${countSubcategories(nextMap)} sub-categories.`;
    els.codeStatus.textContent = unknown.length
      ? `${baseMessage} Unknown dot codes kept: ${unknown.join(', ')}`
      : baseMessage;
  } catch (error) {
    els.codeStatus.textContent = `Could not import code: ${error.message}`;
  }
}

function exportCategoryCode() {
  els.codeArea.value = formatCategoryCode();
  els.codeArea.focus();
  els.codeArea.select();
  els.codeStatus.textContent = `Exported ${Object.keys(subShelfMap).length} main categories and ${countSubcategories(subShelfMap)} sub-categories.`;
}

els.mainForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = els.mainInput.value.trim();
  if (!name || subShelfMap[name]) return;
  subShelfMap[name] = {};
  els.mainInput.value = '';
  renderTree(); rebuildSelectors();
});

els.subForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const main = els.subMainSelect.value;
  const sub = els.subInput.value.trim();
  if (!main || !sub || subShelfMap[main][sub]) return;
  subShelfMap[main][sub] = '';
  els.subInput.value = '';
  renderTree(); rebuildSelectors();
});

els.tree.addEventListener('click', (e) => {
  const btn = e.target.closest('.delete-btn');
  if (!btn) return;
  const main = btn.dataset.main;
  const sub = btn.dataset.sub;
  if (sub) delete subShelfMap[main][sub];
  else delete subShelfMap[main];
  renderTree(); rebuildSelectors();
});

els.assignMain.addEventListener('change', rebuildSubSelector);
els.assignSub.addEventListener('change', () => { state.selectedSub = els.assignSub.value; refreshViews(); });
els.importCode.addEventListener('click', importCategoryCode);
els.exportCode.addEventListener('click', exportCategoryCode);

renderStoreDots();
renderTree();
rebuildSelectors();
els.status.textContent = 'Tap dots to attach/detach them from the selected sub-category.';
