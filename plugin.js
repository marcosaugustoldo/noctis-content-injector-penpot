penpot.ui.open('Noctis Content Injector', 'ui.html', { width: 480, height: 620 });

// --- PALETAS PADRÃO ---
const defaultPalettes = [
  { id: 1, name: 'Padrão',      colors: ['#F8FAFD', '#FF6A00', '#0F172A'], isDeletable: false },
  { id: 2, name: 'Corporativo', colors: ['#F4F5F7', '#0052CC', '#172B4D'], isDeletable: false },
  { id: 3, name: 'Natureza',    colors: ['#CEC5AD', '#A27B5C', '#2C4830'], isDeletable: false },
  { id: 4, name: 'Impacto',     colors: ['#F5F5F5', '#E63946', '#1E1E1E'], isDeletable: false }
];

/* ========= UTILS ========= */
const rxText = /^texto\s*(\d+)\s*-\s*(.+)$/i;
function normalizeName(s) { return String(s || '').toLowerCase().replace(/\s|\-|_/g, ''); }
function keyName(base, n) { return normalizeName(base + ' ' + n); }

function parseCompactText(raw) {
  const map = new Map();
  if (!raw) return map;
  for (const line of raw.split(/\r?\n/)) {
    const m = line.trim().match(rxText);
    if (m) map.set(parseInt(m[1], 10), m[2]);
  }
  return map;
}

// Percorre filhos recursivamente — substitui findAllWithCriteria
function walkChildren(shape, predicate, results = []) {
  if (!shape.children) return results;
  for (const child of shape.children) {
    if (predicate(child)) results.push(child);
    walkChildren(child, predicate, results);
  }
  return results;
}

function getSelectedBoards() {
  // No Penpot, frames são chamados 'board'
  let boards = penpot.selection.filter(n => n.type === 'board');

  // Se nenhum board direto, verifica se há group/frame container
  if (boards.length === 0) {
    const containers = penpot.selection.filter(n => n.type === 'group' || n.type === 'frame');
    if (containers.length === 1 && containers[0].children) {
      const inner = containers[0].children.filter(n => n.type === 'board');
      if (inner.length >= 1) boards = inner;
    }
  }

  // Se 1 board selecionado, verifica se é container de boards internos
  if (boards.length === 1 && boards[0].children) {
    const inner = boards[0].children.filter(n => n.type === 'board');
    if (inner.length >= 2) boards = inner;
  }

  // Ordenação natural (igual ao original)
  const ROW_TOL = 12;
  const naturalChunks = (s) => String(s || '').toLowerCase().match(/\d+|\D+/g) || [String(s || '').toLowerCase()];
  function naturalCompare(a, b) {
    const aa = naturalChunks(a), bb = naturalChunks(b);
    const len = Math.max(aa.length, bb.length);
    for (let i = 0; i < len; i++) {
      const x = aa[i] || '', y = bb[i] || '';
      const dx = /^\d+$/.test(x), dy = /^\d+$/.test(y);
      if (dx && dy) { const nx = parseInt(x, 10), ny = parseInt(y, 10); if (nx !== ny) return nx - ny; }
      else if (x !== y) return x < y ? -1 : 1;
    }
    return 0;
  }

  const allHaveNumber = boards.length > 0 && boards.every(f => /\d+/.test(String(f.name)));
  if (allHaveNumber) {
    boards.sort((a, b) => naturalCompare(a.name || '', b.name || ''));
  } else {
    boards.sort((a, b) => {
      if (Math.abs(a.y - b.y) > ROW_TOL) return a.y - b.y;
      return a.x - b.x;
    });
  }
  return boards;
}

function hexToRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? { r: parseInt(r[1], 16) / 255, g: parseInt(r[2], 16) / 255, b: parseInt(r[3], 16) / 255 } : null;
}

function rgbToHex({ r, g, b }) {
  const h = (c) => ('0' + Math.round(c * 255).toString(16)).slice(-2);
  return `#${h(r)}${h(g)}${h(b)}`;
}

/* ========= SELECTION DATA ========= */
function getSelectionData() {
  const boards = getSelectedBoards();
  const frameData = boards.map((b, i) => ({ slide: i + 1, name: b.name || 'Board sem nome' }));
  const imageTargetRegex = /^imagem\d+$/i;
  const imageTargetsBySlide = {};

  boards.forEach((board, index) => {
    const slideNumber = index + 1;
    const targets = new Set();
    walkChildren(board, n => imageTargetRegex.test(normalizeName(n.name)))
      .forEach(n => targets.add(normalizeName(n.name)));
    if (targets.size > 0) imageTargetsBySlide[slideNumber] = Array.from(targets).sort();
  });

  return { frameCount: boards.length, frameData, imageTargets: imageTargetsBySlide };
}

/* ========= LOCAL STORAGE (síncrono no Penpot) ========= */
function loadPalettes() {
  try {
    const raw = penpot.localStorage.getItem('userPalettes');
    if (!raw) return defaultPalettes;
    const userPalettes = JSON.parse(raw);
    if (!Array.isArray(userPalettes)) return defaultPalettes;
    const userIds = userPalettes.map(p => p.id);
    const missing = defaultPalettes.filter(dp => !userIds.includes(dp.id));
    return [...missing, ...userPalettes];
  } catch (e) {
    return defaultPalettes;
  }
}

function savePalettes(palettes) {
  try {
    penpot.localStorage.setItem('userPalettes', JSON.stringify(palettes));
  } catch (e) {
    console.error('[plugin] Erro ao salvar paletas:', e);
  }
}

function sendInitialState() {
  penpot.ui.sendMessage({
    type: 'init',
    selectionData: getSelectionData(),
    userPalettes: loadPalettes()
  });
}

/* ========= EVENTS ========= */
penpot.on('selectionchange', () => {
  penpot.ui.sendMessage({ type: 'selection-update', data: getSelectionData() });
  // Thumbnails removidos (export por board ainda disponível via board.export mas
  // gerar 20 thumbs em paralelo impacta perf — desativado na versão inicial)
});

/* ========= BUSCA DE ALVOS ========= */
function findTextTarget(board, n) {
  const targetKey = keyName('texto', n);
  return walkChildren(board, node => node.type === 'text' && normalizeName(node.name) === targetKey)[0] || null;
}

function findImageTarget(board, targetName) {
  if (!board || !targetName) return null;
  const targetKey = normalizeName(targetName);
  // Procura o node pelo nome
  const found = walkChildren(board, n => normalizeName(n.name) === targetKey)[0];
  if (!found) return null;
  // Retorna o próprio node se tiver fills, ou primeiro filho com fills
  if (found.fills != null) return found;
  if (found.children) return found.children.find(c => c.fills != null) || null;
  return null;
}

/* ========= TEXTOS ========= */
// No Penpot não existe loadFontAsync — fontes já estão disponíveis no contexto
async function applyTextsToBoards(textMap, boards, report) {
  for (const board of boards) {
    for (const [n, value] of textMap) {
      if (!value) continue;
      const target = findTextTarget(board, n);
      if (target) {
        try {
          target.characters = value;
          report.textsApplied = (report.textsApplied || 0) + 1;
        } catch (err) {
          report.issues.push({ type: 'error', msg: `texto ${n}: ${String(err)}` });
        }
      }
    }
  }
}

function validateTexts(textRaw) {
  const boards = getSelectedBoards();
  const textMap = parseCompactText(textRaw);
  const issues = [];
  if (boards.length === 0) issues.push({ type: 'warn', msg: 'Nenhum board selecionado.' });
  if (textMap.size === 0) issues.push({ type: 'warn', msg: 'Nenhum texto no formato compacto detectado.' });
  for (const [n] of textMap) {
    const existsSomewhere = boards.some(b => !!findTextTarget(b, n));
    if (!existsSomewhere) issues.push({ type: 'warn', msg: `Layer "texto ${n}" não foi encontrado em nenhum board selecionado.` });
  }
  return { ok: !issues.some(i => i.type === 'error'), counts: { texts: textMap.size, boards: boards.length }, issues, boards, maps: { textMap } };
}

/* ========= IMAGENS ========= */
function decodeBase64(b64) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;
  let bufLen = b64.length * 3 / 4;
  if (b64[b64.length - 1] === '=') bufLen--;
  if (b64[b64.length - 2] === '=') bufLen--;
  const bytes = new Uint8Array(bufLen);
  let p = 0;
  for (let i = 0; i < b64.length; i += 4) {
    const a = lookup[b64.charCodeAt(i)], bv = lookup[b64.charCodeAt(i + 1)];
    const c = lookup[b64.charCodeAt(i + 2)], d = lookup[b64.charCodeAt(i + 3)];
    bytes[p++] = (a << 2) | (bv >> 4);
    if (p < bufLen) bytes[p++] = ((bv & 15) << 4) | (c >> 2);
    if (p < bufLen) bytes[p++] = ((c & 3) << 6) | d;
  }
  return bytes;
}

// Detecta mime type pelo header dos bytes
function detectMime(bytes) {
  if (bytes[0] === 0xFF && bytes[1] === 0xD8) return 'image/jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return 'image/png';
  if (bytes[0] === 0x47 && bytes[1] === 0x49) return 'image/gif';
  if (bytes[0] === 0x52 && bytes[4] === 0x57) return 'image/webp';
  return 'image/png'; // fallback
}

async function applyLocalImages(payload, boards, report) {
  for (const item of payload) {
    const idx = item.slide - 1;
    const board = boards[idx];
    const targetName = item.target;
    if (!board) { report.issues.push({ type: 'warn', msg: `slide ${item.slide}: board não encontrado.` }); continue; }
    if (!targetName) { report.issues.push({ type: 'warn', msg: `slide ${item.slide}: nenhum alvo especificado.` }); continue; }
    const node = findImageTarget(board, targetName);
    if (!node) { report.issues.push({ type: 'warn', msg: `slide ${item.slide}: layer "${targetName}" não encontrado.` }); continue; }

    try {
      const bytes = item.b64 ? decodeBase64(item.b64) : new Uint8Array(item.bytes || []);
      const mime = detectMime(bytes);

      // penpot.uploadMediaData retorna ImageData { width, height, mimeType, id }
      const imgData = await penpot.uploadMediaData('img-' + targetName, bytes, mime);

      // Substitui ou insere fill de imagem
      const existingFills = node.fills ? JSON.parse(JSON.stringify(node.fills)) : [];
      const imageIndex = existingFills.findIndex(f => f.fillImage != null);
      const newImageFill = { fillOpacity: 1, fillImage: imgData };

      if (imageIndex >= 0) {
        existingFills[imageIndex] = newImageFill;
      } else {
        existingFills.unshift(newImageFill);
      }
      node.fills = existingFills;
      report.imagesApplied = (report.imagesApplied || 0) + 1;
    } catch (err) {
      report.issues.push({ type: 'error', msg: `slide ${item.slide}, alvo ${targetName}: ${err.message}` });
    }
  }
}

/* ========= CORES INTELIGENTE ========= */
// No Penpot existe penpot.shapesColors e penpot.replaceColor, mas a lógica
// de "substituição por frequência" requer o mapeamento manual — mantida.
async function applyColorsSmart(newColorsHex, boards, report) {
  if (!newColorsHex || newColorsHex.length === 0) {
    report.issues.push({ type: 'warn', msg: 'Nenhuma cor recebida na paleta.' }); return;
  }

  const colorCounts = new Map();

  function countFills(node) {
    if (!node.fills || !Array.isArray(node.fills)) return;
    node.fills.forEach(fill => {
      if (fill.fillColor && (fill.fillOpacity == null || fill.fillOpacity > 0.5)) {
        const hex = fill.fillColor.toUpperCase();
        colorCounts.set(hex, (colorCounts.get(hex) || 0) + 1);
      }
    });
  }

  for (const board of boards) {
    countFills(board);
    walkChildren(board, () => true).forEach(countFills);
  }

  if (colorCounts.size === 0) {
    report.issues.push({ type: 'warn', msg: 'Nenhuma cor sólida encontrada.' }); return;
  }

  const oldColorsSorted = Array.from(colorCounts.entries()).sort((a, b) => b[1] - a[1]).map(e => e[0]);
  const colorMap = new Map();
  for (let i = 0; i < oldColorsSorted.length; i++) {
    if (newColorsHex[i]) colorMap.set(oldColorsSorted[i], newColorsHex[i].toUpperCase());
  }

  if (colorMap.size === 0) {
    report.issues.push({ type: 'error', msg: 'Não foi possível criar o mapa de cores.' }); return;
  }

  let changedCount = 0;

  function replaceFills(node) {
    if (!node.fills || !Array.isArray(node.fills) || node.fills.length === 0) return;
    const original = JSON.parse(JSON.stringify(node.fills));
    let changed = false;
    const newFills = original.map(fill => {
      if (fill.fillColor) {
        const hex = fill.fillColor.toUpperCase();
        if (colorMap.has(hex)) {
          changed = true;
          fill.fillColor = colorMap.get(hex);
        }
      }
      return fill;
    });
    if (changed) { node.fills = newFills; changedCount++; }
  }

  for (const board of boards) {
    replaceFills(board);
    walkChildren(board, () => true).forEach(replaceFills);
  }
  report.nodesChanged = changedCount;
}

/* ========= EXTRAÇÃO DE PALETA ========= */
function extractPalette(boards) {
  if (boards.length === 0) return [];
  const colorCounts = new Map();

  function countNode(node) {
    if (!node.fills || !Array.isArray(node.fills)) return;
    node.fills.forEach(fill => {
      if (fill.fillColor) {
        const hex = fill.fillColor.toUpperCase();
        if (hex !== '#FFFFFF' && hex !== '#000000') colorCounts.set(hex, (colorCounts.get(hex) || 0) + 1);
      }
    });
  }

  const board = boards[0];
  countNode(board);
  walkChildren(board, () => true).forEach(countNode);

  const sorted = Array.from(colorCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => e[0]);
  while (sorted.length < 3) sorted.push(sorted.length % 2 === 0 ? '#333333' : '#CCCCCC');
  return sorted;
}

/* ========= PERFIL ========= */
async function applyProfile(handle, name, avatarB64, boards, report) {
  for (const board of boards) {
    const allNodes = walkChildren(board, () => true);

    if (handle) {
      for (const node of allNodes) {
        if (node.type === 'text' && normalizeName(node.name) === 'perfil') {
          try { node.characters = handle; report.namesChanged = (report.namesChanged || 0) + 1; }
          catch (err) { report.issues.push({ type: 'warn', msg: `${node.name}: ${err.message}` }); }
        }
      }
    }

    if (name) {
      for (const node of allNodes) {
        if (node.type === 'text' && normalizeName(node.name) === 'nome') {
          try { node.characters = name; report.namesChanged = (report.namesChanged || 0) + 1; }
          catch (err) { report.issues.push({ type: 'warn', msg: `${node.name}: ${err.message}` }); }
        }
      }
    }

    if (avatarB64) {
      const avatarNames = ['fotoperfil', 'imagemperfil', 'imageperfil', 'avatar'];
      for (const node of allNodes) {
        const n = normalizeName(node.name);
        if (avatarNames.some(a => n === a)) {
          try {
            const bytes = decodeBase64(avatarB64);
            const mime = detectMime(bytes);
            const imgData = await penpot.uploadMediaData('avatar-' + n, bytes, mime);
            const existingFills = node.fills ? JSON.parse(JSON.stringify(node.fills)) : [];
            const imageIndex = existingFills.findIndex(f => f.fillImage != null);
            const newImageFill = { fillOpacity: 1, fillImage: imgData };
            if (imageIndex >= 0) existingFills[imageIndex] = newImageFill;
            else existingFills.unshift(newImageFill);
            node.fills = existingFills;
            report.avatarsChanged = (report.avatarsChanged || 0) + 1;
          } catch (err) {
            report.issues.push({ type: 'warn', msg: `${node.name}: ${err.message}` });
          }
        }
      }
    }
  }
}

/* ========= BRIDGE UI ⇄ PLUGIN ========= */
penpot.ui.onMessage(async (msg) => {
  try {
    if (msg.type === 'ui-ready') {
      sendInitialState();
      return;
    }

    if (msg.type === 'save-user-palettes') {
      savePalettes(msg.palettes);
      return;
    }

    if (msg.type === 'request-selection-update') {
      penpot.ui.sendMessage({ type: 'selection-update', data: getSelectionData() });
      return;
    }

    if (msg.type === 'apply-content') {
      const rep = validateTexts(msg.content);
      if (rep.ok && rep.maps.textMap.size > 0) {
        await applyTextsToBoards(rep.maps.textMap, rep.boards, rep);
      }
      rep.ok = !rep.issues.some(i => i.type === 'error');
      penpot.ui.sendMessage({ type: 'applied-content-result', report: rep });
    }

    if (msg.type === 'apply-local-images') {
      const boards = getSelectedBoards();
      const report = { issues: [], imagesApplied: 0 };
      await applyLocalImages(msg.images || [], boards, report);
      report.ok = !report.issues.some(i => i.type === 'error');
      penpot.ui.sendMessage({ type: 'applied-images', report });
    }

    if (msg.type === 'apply-colors') {
      const boards = getSelectedBoards();
      const report = { issues: [], nodesChanged: 0 };
      if (boards.length === 0) {
        report.issues.push({ type: 'error', msg: 'Nenhum board selecionado.' });
      } else {
        await applyColorsSmart(msg.colors || [], boards, report);
      }
      report.ok = !report.issues.some(i => i.type === 'error') && (report.nodesChanged || 0) > 0;
      penpot.ui.sendMessage({ type: 'applied-colors-result', report });
    }

    if (msg.type === 'apply-profile') {
      const boards = getSelectedBoards();
      const report = { namesChanged: 0, avatarsChanged: 0, issues: [] };
      if (boards.length === 0) {
        report.issues.push({ type: 'error', msg: 'Nenhum board selecionado.' });
      } else {
        await applyProfile(msg.handle, msg.name, msg.avatarB64, boards, report);
      }
      report.ok = !report.issues.some(i => i.type === 'error') && ((report.namesChanged || 0) + (report.avatarsChanged || 0) > 0);
      penpot.ui.sendMessage({ type: 'applied-profile-result', report });
    }

    if (msg.type === 'extract-palette') {
      const boards = getSelectedBoards();
      const colors = extractPalette(boards);
      penpot.ui.sendMessage({ type: 'extract-palette-result', colors });
    }

    if (msg.type === 'magic-apply') {
      const boards = getSelectedBoards();
      const report = { textsApplied: 0, imagesApplied: 0, colorsChanged: 0, profileApplied: 0, issues: [] };
      if (boards.length === 0) {
        report.issues.push({ type: 'error', msg: 'Nenhum board selecionado.' });
        penpot.ui.sendMessage({ type: 'magic-apply-result', report }); return;
      }
      if (msg.profileHandle || msg.profileName || msg.avatarB64) {
        const pr = { namesChanged: 0, avatarsChanged: 0, issues: [] };
        await applyProfile(msg.profileHandle, msg.profileName, msg.avatarB64, boards, pr);
        report.profileApplied = (pr.namesChanged || 0) + (pr.avatarsChanged || 0);
        report.issues = report.issues.concat(pr.issues);
      }
      if (msg.textContent && msg.textContent.trim()) {
        const textMap = parseCompactText(msg.textContent);
        if (textMap.size > 0) await applyTextsToBoards(textMap, boards, report);
      }
      if (msg.images && msg.images.length > 0) {
        await applyLocalImages(msg.images, boards, report);
      }
      if (msg.colors && msg.colors.length > 0) {
        const cr = { issues: [], nodesChanged: 0 };
        await applyColorsSmart(msg.colors, boards, cr);
        report.colorsChanged = cr.nodesChanged;
        report.issues = report.issues.concat(cr.issues);
      }
      report.ok = !report.issues.some(i => i.type === 'error');
      penpot.ui.sendMessage({ type: 'magic-apply-result', report });
    }

    // Export ZIP removido (não crítico). Se quiser reativar futuramente,
    // board.export({ type: 'png', scale: 2 }) está disponível na API do Penpot.

  } catch (e) {
    console.error('[plugin.js] Erro geral:', e);
    penpot.ui.sendMessage({ type: 'error-general', message: e.message });
  }
});
