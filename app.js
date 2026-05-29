let STORE_DOTS = [];
let currentMapImageSrc = '';

const MAP_STORAGE_KEY = 'map-manager-v1.6-map';

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

const norm = (s) => String(s ?? '').split(',').map((x) => x.trim().toUpperCase()).filter(Boolean);
const csv = (arr) => [...new Set(arr)].sort().join(',');

const els = {
  tree: document.getElementById('category-tree'),
  map: document.getElementById('store-map'),
  status: document.getElementById('map-status'),
  subDots: document.getElementById('selected-sub-dots'),
  dotSubs: document.getElementById('dot-subcategories'),
  mainForm: document.getElementById('main-category-form'),
  mainInput: document.getElementById('main-category-input'),
  subForm: document.getElementById('sub-category-form'),
  subInput: document.getElementById('sub-category-input'),
  subMainSelect: document.getElementById('sub-main-select'),
  assignMain: document.getElementById('assign-main'),
  assignSub: document.getElementById('assign-sub'),
  codeArea: document.getElementById('category-code'),
  importCode: document.getElementById('import-code'),
  exportCode: document.getElementById('export-code'),
  codeStatus: document.getElementById('code-status'),
  mapFileInput: document.getElementById('map-file-input'),
  pngMapInput: document.getElementById('png-map-input'),
  dotCoordinatesInput: document.getElementById('dot-coordinates-input'),
  clearMap: document.getElementById('clear-map'),
  mapFileStatus: document.getElementById('map-file-status'),
};

function rebuildSelectors() {
  const mains = Object.keys(subShelfMap);
  [els.subMainSelect, els.assignMain].forEach((sel) => {
    sel.innerHTML = mains.map((m) => `<option>${escapeHtml(m)}</option>`).join('');
  });
  if (!mains.includes(state.selectedMain)) state.selectedMain = mains[0] || '';
  els.assignMain.value = state.selectedMain;
  els.subMainSelect.value = mains[0] || '';
  rebuildSubSelector();
}

function rebuildSubSelector() {
  state.selectedMain = els.assignMain.value;
  const subs = Object.keys(subShelfMap[state.selectedMain] || {});
  els.assignSub.innerHTML = subs.map((s) => `<option>${escapeHtml(s)}</option>`).join('');
  state.selectedSub = subs.includes(state.selectedSub) ? state.selectedSub : (subs[0] || '');
  els.assignSub.value = state.selectedSub;
  refreshViews();
}

function escapeHtml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function renderTree() {
  els.tree.innerHTML = '';
  const root = document.createElement('ul');
  for (const [main, subs] of Object.entries(subShelfMap)) {
    const li = document.createElement('li');
    const mainActive = main === state.selectedMain && !state.selectedSub ? ' active-category' : '';
    li.innerHTML = `
      <div class="category-line">
        <button class="category-select main-select${mainActive}" type="button" data-main="${escapeAttr(main)}">
          <strong>${escapeHtml(main)}</strong>
        </button>
        <button class="delete-btn" type="button" data-main="${escapeAttr(main)}">Delete main</button>
      </div>`;
    const subUl = document.createElement('ul');
    Object.keys(subs).forEach((sub) => {
      const subLi = document.createElement('li');
      const subActive = main === state.selectedMain && sub === state.selectedSub ? ' active-category' : '';
      subLi.innerHTML = `
        <div class="category-line">
          <button class="category-select sub-select${subActive}" type="button" data-main="${escapeAttr(main)}" data-sub="${escapeAttr(sub)}">${escapeHtml(sub)}</button>
          <button class="delete-btn" type="button" data-main="${escapeAttr(main)}" data-sub="${escapeAttr(sub)}">Delete sub</button>
        </div>`;
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

function refreshTreeSelection() {
  document.querySelectorAll('.category-select.active-category').forEach((el) => el.classList.remove('active-category'));
  if (!state.selectedMain) return;
  const selected = state.selectedSub
    ? `.category-select[data-main="${CSS.escape(state.selectedMain)}"][data-sub="${CSS.escape(state.selectedSub)}"]`
    : `.category-select[data-main="${CSS.escape(state.selectedMain)}"]:not([data-sub])`;
  const item = els.tree.querySelector(selected);
  if (item) item.classList.add('active-category');
}

function refreshViews() {
  const dots = getSelectedSubCodes();
  els.subDots.textContent = JSON.stringify({ main: state.selectedMain, sub: state.selectedSub, dots }, null, 2);
  refreshDots();
  refreshTreeSelection();
  if (state.selectedDot) {
    const rev = codeToSubcategoriesMap();
    const items = rev[state.selectedDot.id] || [];
    els.dotSubs.innerHTML = items.map((x) => `<li>${escapeHtml(x)}</li>`).join('') || '<li>No linked sub-categories</li>';
  }
}

function toggleSelectedSubDot(dotId) {
  if (!state.selectedMain || !state.selectedSub) {
    els.status.textContent = 'Choose a main category and sub-category before assigning dots.';
    return;
  }
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
  els.map.querySelectorAll('.map-dot').forEach((el) => el.remove());
  state.dotButtons.clear();
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
  updateMapEmptyState();
}

function updateMapEmptyState() {
  els.map.classList.toggle('empty', !currentMapImageSrc);
  els.map.classList.toggle('no-dots', STORE_DOTS.length === 0);
}

function normalizeImportedDots(dots) {
  if (!Array.isArray(dots)) throw new Error('The coordinate file must contain an array of dots.');
  const normalized = [];
  const seen = new Set();

  dots.forEach((dot, index) => {
    const id = String(dot?.id || '').trim().toUpperCase();
    const x = Number(dot?.x);
    const y = Number(dot?.y);

    if (!id) throw new Error(`Dot ${index + 1} is missing an id.`);
    if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error(`Dot ${id} must have numeric x and y values.`);
    if (x < 0 || x > 100 || y < 0 || y > 100) throw new Error(`Dot ${id} coordinates must be percentages from 0 to 100.`);
    if (seen.has(id)) throw new Error(`Duplicate dot id found: ${id}.`);

    seen.add(id);
    normalized.push({ id, x, y });
  });

  return normalized;
}

function extractBalancedBlock(source, startIndex, openChar, closeChar) {
  const start = source.indexOf(openChar, startIndex);
  if (start === -1) throw new Error(`Could not find opening ${openChar}.`);

  let depth = 0;
  let inString = false;
  let quote = '';
  let escaped = false;

  for (let i = start; i < source.length; i += 1) {
    const ch = source[i];

    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === quote) inString = false;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      inString = true;
      quote = ch;
    } else if (ch === openChar) {
      depth += 1;
    } else if (ch === closeChar) {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }

  throw new Error(`Could not find closing ${closeChar}.`);
}

function parseJavaScriptLiteral(text) {
  const cleaned = text.trim().replace(/,\s*([}\]])/g, '$1');
  try {
    return JSON.parse(cleaned);
  } catch (jsonError) {
    try {
      return Function(`"use strict"; return (${cleaned});`)();
    } catch (literalError) {
      throw new Error(`Could not parse coordinates. Use JSON or JS array format. ${literalError.message}`);
    }
  }
}

function extractDotsArrayText(source) {
  const markers = [
    /\bconst\s+STORE_DOTS\s*=/i,
    /\blet\s+STORE_DOTS\s*=/i,
    /\bvar\s+STORE_DOTS\s*=/i,
    /\bconst\s+dots\s*=/i,
    /\blet\s+dots\s*=/i,
    /\bvar\s+dots\s*=/i,
  ];

  for (const marker of markers) {
    const match = marker.exec(source);
    if (match) return extractBalancedBlock(source, match.index, '[', ']');
  }

  const trimmed = source.trim();
  if (trimmed.startsWith('[')) return extractBalancedBlock(trimmed, 0, '[', ']');
  if (trimmed.startsWith('{')) {
    const parsed = parseJavaScriptLiteral(trimmed);
    if (Array.isArray(parsed)) return trimmed;
    if (Array.isArray(parsed.dots)) return JSON.stringify(parsed.dots);
    if (Array.isArray(parsed.STORE_DOTS)) return JSON.stringify(parsed.STORE_DOTS);
  }

  throw new Error('No dot array found. Expected const dots = [...], const STORE_DOTS = [...], a JSON array, or { "dots": [...] }.');
}

function parseCoordinatesText(text) {
  const arrayText = extractDotsArrayText(String(text || ''));
  return normalizeImportedDots(parseJavaScriptLiteral(arrayText));
}

function parseMapHtml(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const img = doc.querySelector('.stage img') || doc.querySelector('img[src^="data:image"]') || doc.querySelector('img');
  if (!img || !img.getAttribute('src')) throw new Error('No map image found in the HTML file.');

  const dots = parseCoordinatesText(html);
  return { imageSrc: img.getAttribute('src'), dots };
}

function setMapImage(imageSrc) {
  currentMapImageSrc = imageSrc || '';
  if (!currentMapImageSrc) {
    els.map.style.backgroundImage = '';
    els.map.style.aspectRatio = '4 / 5';
    updateMapEmptyState();
    return;
  }

  els.map.style.backgroundImage = `url("${currentMapImageSrc.replace(/"/g, '%22')}")`;

  const image = new Image();
  image.onload = () => {
    if (image.naturalWidth && image.naturalHeight) {
      els.map.style.aspectRatio = `${image.naturalWidth} / ${image.naturalHeight}`;
      saveMapToStorage();
    }
  };
  image.src = currentMapImageSrc;
  updateMapEmptyState();
}

function setStoreDots(dots, shouldPrune = true) {
  STORE_DOTS = normalizeImportedDots(dots);
  state.selectedDot = null;
  renderStoreDots();
  const removed = shouldPrune ? pruneAssignmentsToExistingDots() : 0;
  refreshViews();
  els.dotSubs.innerHTML = '<li>No dot selected</li>';
  saveMapToStorage();
  return removed;
}

function pruneAssignmentsToExistingDots() {
  const existingDots = new Set(STORE_DOTS.map((dot) => dot.id));
  let removed = 0;

  for (const subs of Object.values(subShelfMap)) {
    for (const [sub, dotsCsv] of Object.entries(subs)) {
      const original = norm(dotsCsv);
      const filtered = original.filter((dotId) => existingDots.has(dotId));
      removed += original.length - filtered.length;
      subs[sub] = csv(filtered);
    }
  }

  return removed;
}

function saveMapToStorage() {
  try {
    localStorage.setItem(MAP_STORAGE_KEY, JSON.stringify({ imageSrc: currentMapImageSrc, dots: STORE_DOTS }));
  } catch (error) {
    // Large images can exceed localStorage limits. The current session still works.
    console.warn('Map could not be saved in this browser:', error);
  }
}

function loadMapFromStorage() {
  try {
    const saved = JSON.parse(localStorage.getItem(MAP_STORAGE_KEY) || 'null');
    if (!saved || typeof saved !== 'object') return false;
    if (saved.imageSrc) setMapImage(saved.imageSrc);
    if (Array.isArray(saved.dots)) setStoreDots(saved.dots, false);
    if (saved.imageSrc || Array.isArray(saved.dots)) {
      els.mapFileStatus.textContent = `Loaded saved map with ${STORE_DOTS.length} dots from this browser.`;
      return true;
    }
  } catch (error) {
    console.warn('Saved map could not be loaded:', error);
  }
  return false;
}

function importCompleteMapFile(file) {
  if (!file) return;

  const reader = new FileReader();
  els.mapFileStatus.textContent = `Reading ${file.name}...`;

  reader.onload = () => {
    try {
      const { imageSrc, dots } = parseMapHtml(String(reader.result || ''));
      setMapImage(imageSrc);
      const removed = setStoreDots(dots, true);
      els.mapFileStatus.textContent = `Imported map image and ${dots.length} dots from ${file.name}.${removed ? ` Removed ${removed} category dot assignment${removed === 1 ? '' : 's'} that do not exist on this map.` : ''}`;
      els.status.textContent = `Map changed to ${file.name}. Tap dots to attach/detach them from the selected sub-category.`;
    } catch (error) {
      els.mapFileStatus.textContent = `Could not import HTML map file: ${error.message}`;
    }
  };

  reader.onerror = () => {
    els.mapFileStatus.textContent = 'Could not read the selected HTML file.';
  };

  reader.readAsText(file);
}

function importPngMap(file) {
  if (!file) return;
  if (!file.type.includes('png') && !file.name.toLowerCase().endsWith('.png')) {
    els.mapFileStatus.textContent = 'Please choose a PNG file.';
    return;
  }

  const reader = new FileReader();
  els.mapFileStatus.textContent = `Reading ${file.name}...`;
  reader.onload = () => {
    setMapImage(String(reader.result || ''));
    els.mapFileStatus.textContent = `Imported PNG map ${file.name}. ${STORE_DOTS.length ? `${STORE_DOTS.length} existing dots are still loaded.` : 'Now upload dot-overlay coordinates.'}`;
    els.status.textContent = 'PNG map changed. Upload dot coordinates or use existing dots.';
  };
  reader.onerror = () => {
    els.mapFileStatus.textContent = 'Could not read the selected PNG file.';
  };
  reader.readAsDataURL(file);
}

function importDotCoordinatesFile(file) {
  if (!file) return;

  const reader = new FileReader();
  els.mapFileStatus.textContent = `Reading ${file.name}...`;
  reader.onload = () => {
    try {
      const dots = parseCoordinatesText(String(reader.result || ''));
      const removed = setStoreDots(dots, true);
      els.mapFileStatus.textContent = `Imported ${dots.length} dot coordinates from ${file.name}.${removed ? ` Removed ${removed} category dot assignment${removed === 1 ? '' : 's'} that do not exist in this overlay.` : ''}`;
      els.status.textContent = `${dots.length} dots loaded. Tap dots to attach/detach them from the selected sub-category.`;
    } catch (error) {
      els.mapFileStatus.textContent = `Could not import dot coordinates: ${error.message}`;
    }
  };
  reader.onerror = () => {
    els.mapFileStatus.textContent = 'Could not read the selected coordinate file.';
  };
  reader.readAsText(file);
}

function clearMap() {
  STORE_DOTS = [];
  currentMapImageSrc = '';
  state.selectedDot = null;
  localStorage.removeItem(MAP_STORAGE_KEY);
  setMapImage('');
  renderStoreDots();
  refreshViews();
  els.dotSubs.innerHTML = '<li>No dot selected</li>';
  els.mapFileStatus.textContent = 'Map image and dot overlay cleared.';
  els.status.textContent = 'Upload a map file or PNG plus dot coordinates to begin.';
}

function chooseCategory(main, sub = '') {
  if (!subShelfMap[main]) return;
  const subs = Object.keys(subShelfMap[main]);
  state.selectedMain = main;
  state.selectedSub = sub && subShelfMap[main][sub] !== undefined ? sub : (subs[0] || '');
  els.assignMain.value = state.selectedMain;
  els.assignSub.innerHTML = subs.map((s) => `<option>${escapeHtml(s)}</option>`).join('');
  els.assignSub.value = state.selectedSub;
  refreshViews();
  els.status.textContent = state.selectedSub
    ? `Showing dots for ${state.selectedMain} > ${state.selectedSub}`
    : `Selected ${state.selectedMain}. Add or choose a sub-category to assign dots.`;
}

function getExportableSubShelfMap() {
  const existingDots = new Set(STORE_DOTS.map((dot) => dot.id));
  const exportMap = {};

  for (const [main, subs] of Object.entries(subShelfMap)) {
    exportMap[main] = {};
    for (const [sub, dotsCsv] of Object.entries(subs)) {
      const validDots = norm(dotsCsv).filter((dotId) => existingDots.has(dotId));
      exportMap[main][sub] = csv(validDots);
    }
  }

  return exportMap;
}

function countDots(map) {
  let total = 0;
  for (const subs of Object.values(map)) {
    for (const dotsCsv of Object.values(subs)) {
      total += norm(dotsCsv).length;
    }
  }
  return total;
}

function formatCategoryCode() {
  const exportMap = getExportableSubShelfMap();
  return `const subShelfMap = ${JSON.stringify(exportMap, null, 2)};`;
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

    const parsed = parseJavaScriptLiteral(cleanImportText(raw));
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
  const exportMap = getExportableSubShelfMap();
  els.codeArea.value = formatCategoryCode();
  els.codeArea.focus();
  els.codeArea.select();

  const removed = countDots(subShelfMap) - countDots(exportMap);
  const baseMessage = `Exported ${Object.keys(exportMap).length} main categories and ${countSubcategories(exportMap)} sub-categories with ${countDots(exportMap)} existing dot assignments.`;
  els.codeStatus.textContent = removed > 0
    ? `${baseMessage} Removed ${removed} dot assignment${removed === 1 ? '' : 's'} that do not exist on the current map.`
    : baseMessage;
}

els.mainForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = els.mainInput.value.trim();
  if (!name || subShelfMap[name]) return;
  subShelfMap[name] = {};
  els.mainInput.value = '';
  renderTree();
  rebuildSelectors();
});

els.subForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const main = els.subMainSelect.value;
  const sub = els.subInput.value.trim();
  if (!main || !sub || subShelfMap[main][sub]) return;
  subShelfMap[main][sub] = '';
  els.subInput.value = '';
  renderTree();
  rebuildSelectors();
});

els.tree.addEventListener('click', (e) => {
  const selectBtn = e.target.closest('.category-select');
  if (selectBtn) {
    chooseCategory(selectBtn.dataset.main, selectBtn.dataset.sub || '');
    return;
  }

  const btn = e.target.closest('.delete-btn');
  if (!btn) return;
  const main = btn.dataset.main;
  const sub = btn.dataset.sub;
  if (sub) delete subShelfMap[main][sub];
  else delete subShelfMap[main];
  renderTree();
  rebuildSelectors();
});

els.assignMain.addEventListener('change', rebuildSubSelector);
els.assignSub.addEventListener('change', () => { state.selectedSub = els.assignSub.value; refreshViews(); });
els.importCode.addEventListener('click', importCategoryCode);
els.exportCode.addEventListener('click', exportCategoryCode);
els.mapFileInput.addEventListener('change', (e) => importCompleteMapFile(e.target.files[0]));
els.pngMapInput.addEventListener('change', (e) => importPngMap(e.target.files[0]));
els.dotCoordinatesInput.addEventListener('change', (e) => importDotCoordinatesFile(e.target.files[0]));
els.clearMap.addEventListener('click', clearMap);

renderTree();
rebuildSelectors();
renderStoreDots();
const loaded = loadMapFromStorage();
if (!loaded) {
  updateMapEmptyState();
  els.dotSubs.innerHTML = '<li>No dot selected</li>';
  els.status.textContent = 'Upload a complete HTML map file, or upload a PNG map and dot-overlay coordinates.';
}
