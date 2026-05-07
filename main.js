// main.js — Noctis Content Injector
penpot.ui.open("Noctis Injector", `index.html?theme=${penpot.theme}`, {
    width: 380,
    height: 520
});

const rxText = /^texto\s*(\d+)\s*-\s*(.+)$/i;

function normalizeName(s) {
    return String(s || '').toLowerCase().replace(/\s|\-|_/g, '');
}

function parseCompactText(raw) {
    const map = new Map();
    if (!raw) return map;
    for (const line of raw.split(/\r?\n/)) {
        const m = line.trim().match(rxText);
        if (m) map.set(parseInt(m[1], 10), m[2]);
    }
    return map;
}

function getSelectedBoards() {
    const sel = penpot.selection;
    let boards = sel.filter(n => n.type === 'board');
    if (boards.length === 0) {
        sel.forEach(node => {
            if (node.children) {
                const inner = node.children.filter(n => n.type === 'board');
                boards = boards.concat(inner);
            }
        });
    }
    boards.sort((a, b) => a.x - b.x);
    return boards;
}

function findTextTargetsDeep(node, n, results = []) {
    if (node.type === 'text') {
        const keyText = normalizeName('text ' + n);
        const keyTexto = normalizeName('texto ' + n);
        const norm = normalizeName(node.name);
        if (norm === keyText || norm === keyTexto) {
            results.push(node);
        }
    }
    if (node.children && node.children.length > 0) {
        node.children.forEach(child => findTextTargetsDeep(child, n, results));
    }
    return results;
}

penpot.ui.onMessage((msg) => {
    if (msg.type !== 'apply-content') return;

    try {
        const boards = getSelectedBoards();
        if (boards.length === 0) {
            penpot.ui.sendMessage({ type: 'inject-result', ok: false, error: 'Nenhum board selecionado.' });
            return;
        }

        const textMap = parseCompactText(msg.content);
        if (textMap.size === 0) {
            penpot.ui.sendMessage({ type: 'inject-result', ok: false, error: 'Nenhum texto válido encontrado no formato.' });
            return;
        }

        let total = 0;
        boards.forEach(board => {
            for (const [n, value] of textMap) {
                if (!value) continue;
                const targets = findTextTargetsDeep(board, n);
                targets.forEach(target => {
                    target.characters = value;
                    total++;
                });
            }
        });

        penpot.ui.sendMessage({ type: 'inject-result', ok: true, total });
    } catch (e) {
        penpot.ui.sendMessage({ type: 'inject-result', ok: false, error: e.message || 'Erro inesperado.' });
    }
});