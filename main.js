// main.js — Noctis Content Injector
penpot.ui.open("Noctis Injector", "index.html", {
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

function findTextTargetsDeep(node, targetKey, results = []) {
    if (node.type === 'text' && normalizeName(node.name) === targetKey) {
        results.push(node);
    }
    if (node.children && node.children.length > 0) {
        node.children.forEach(child => findTextTargetsDeep(child, targetKey, results));
    }
    return results;
}

penpot.ui.onMessage((msg) => {
    if (msg.type === 'apply-content') {
        const boards = getSelectedBoards();
        if (boards.length === 0) return;

        const textMap = parseCompactText(msg.content);
        
        boards.forEach(board => {
            for (const [n, value] of textMap) {
                if (!value) continue;
                const targets = findTextTargetsDeep(board, normalizeName(`texto ${n}`));
                targets.forEach(target => {
                    target.characters = value; 
                });
            }
        });
    }
});
