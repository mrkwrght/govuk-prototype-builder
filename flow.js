// ---------- Flow view: screens as cards, wired together with arrows ----------
// Loaded before app.js. It reads and writes the same page data as the editor:
//   page.next          the screen to go to after the form is submitted
//   page.branch[key]   the screen to go to for one radio answer ("name=value")
//   page.x, page.y     the card's position on the flow board

const CARD_W = 220;
const FLOW_HELP = 'Drag a card to move it. Drag from a blue dot onto another screen to connect them. Click \u00d7 on an arrow to remove it.';
let flowMessage = '';
let flowDrag = null; // the card or wire currently being dragged

const pageById = id => state.pages.find(p => p.id === id);
const targetOf = (page, key) => key === '' ? page.next : (page.branch || {})[key] || '';

// The output ports of a page: a default "next" port, plus one per radio option.
function outputPorts(page) {
    const radios = page.items.filter(i => i.t === 'radios');
    const ports = [{ key: '', label: radios.length ? 'Otherwise' : 'Next screen' }];
    radios.forEach(r => splitLines(r.p.options).forEach(option => {
        ports.push({ key: r.p.name + '=' + slugify(option), label: 'If ' + option });
    }));
    return ports;
}

function placeNewCards() {
    state.pages.forEach((p, i) => {
        if (p.x == null) {
            p.x = 30 + (i % 3) * 270;
            p.y = 30 + Math.floor(i / 3) * 240;
        }
    });
}

function cardHtml(page, index) {
    const ports = outputPorts(page).map(port => `
        <div class="fport">
            <span>${escapeHtml(port.label)}</span>
            <i class="port" data-src="${page.id}" data-key="${escapeHtml(port.key)}" title="Drag to another screen"></i>
        </div>`).join('');
    return `
        <div class="fcard${index === state.cur ? ' on' : ''}" data-card="${page.id}" style="left:${page.x}px;top:${page.y}px;width:${CARD_W}px">
            <i class="inport" data-in="${page.id}"></i>
            <div class="fcard-head"><b>/${escapeHtml(page.name)}</b><button class="btn s" data-edit="${index}">Edit</button></div>
            <div class="fcard-body">${escapeHtml(page.title)}<span class="hint">${page.items.length} components</span></div>
            ${ports}
        </div>`;
}

function renderFlow() {
    const flowEl = $('#flow');
    const active = state.view === 'flow';
    flowEl.hidden = !active;
    $('#cv').hidden = active;
    if (!active) return;
    placeNewCards();
    const width = Math.max(...state.pages.map(p => p.x)) + CARD_W + 80;
    const height = Math.max(...state.pages.map(p => p.y)) + 300;
    flowEl.innerHTML = `
        <p class="flow-help" role="status">${escapeHtml(flowMessage || FLOW_HELP)}</p>
        <div class="flow-board" id="board" style="width:${width}px;height:${height}px">
            <svg class="flow-wires" id="wires"></svg>
            ${state.pages.map(cardHtml).join('')}
        </div>`;
    drawWires();
}

// Position of an element's centre, relative to the flow board.
function centreOf(el, board) {
    const b = board.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return [r.left + r.width / 2 - b.left, r.top + r.height / 2 - b.top];
}

const curve = ([x1, y1], [x2, y2]) => `M${x1},${y1} C${x1 + 70},${y1} ${x2 - 70},${y2} ${x2 - 8},${y2}`;

function drawWires() {
    const board = $('#board');
    if (!board) return;
    let svg = `<defs>
        <marker id="arrow-next" class="arrow-next" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z"/></marker>
        <marker id="arrow-branch" class="arrow-branch" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z"/></marker>
    </defs>`;
    state.pages.forEach(page => outputPorts(page).forEach(port => {
        const target = targetOf(page, port.key);
        const from = board.querySelector(`.port[data-src="${page.id}"][data-key="${port.key}"]`);
        const to = target && board.querySelector(`.inport[data-in="${target}"]`);
        if (!from || !to) return;
        const a = centreOf(from, board), b = centreOf(to, board);
        const kind = port.key === '' ? 'next' : 'branch';
        svg += `<path class="wire ${kind}" d="${curve(a, b)}" marker-end="url(#arrow-${kind})"/>
            <g class="cut" data-cut-src="${page.id}" data-cut-key="${escapeHtml(port.key)}" transform="translate(${(a[0] + b[0]) / 2},${(a[1] + b[1]) / 2})">
                <title>Remove this connection</title><circle r="9"/><text y="4">\u00d7</text>
            </g>`;
    }));
    $('#wires').innerHTML = svg + '<path id="tempwire" class="wire temp"/>';
}

function connect(srcId, key, targetId) {
    const src = pageById(srcId);
    if (key === '') src.next = targetId;
    else (src.branch = src.branch || {})[key] = targetId;
    if (hasForm(src.items)) {
        flowMessage = '';
    } else {
        src.items.push(createItem('button')); // a screen needs a button to submit to the next one
        flowMessage = `Added a Continue button to /${src.name} so it can move on to the next screen.`;
    }
}

function disconnect(srcId, key) {
    const src = pageById(srcId);
    if (key === '') src.next = '';
    else delete (src.branch || {})[key];
    flowMessage = '';
}

// ----- Dragging cards and wires (pointer events work for mouse and touch) -----
document.addEventListener('pointerdown', ev => {
    const board = $('#board');
    if (!board || $('#flow').hidden) return;
    const port = ev.target.closest('.port');
    const card = ev.target.closest('.fcard');
    if (port) {
        flowDrag = { type: 'wire', src: port.dataset.src, key: port.dataset.key, from: centreOf(port, board) };
        ev.preventDefault();
    } else if (card && !ev.target.closest('button')) {
        const page = pageById(card.dataset.card);
        flowDrag = { type: 'card', page, el: card, startX: ev.clientX, startY: ev.clientY, x: page.x, y: page.y, moved: false };
        ev.preventDefault();
    }
});

document.addEventListener('pointermove', ev => {
    if (!flowDrag) return;
    const board = $('#board');
    if (flowDrag.type === 'card') {
        const d = flowDrag;
        const dx = ev.clientX - d.startX, dy = ev.clientY - d.startY;
        if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
        d.page.x = Math.max(0, d.x + dx);
        d.page.y = Math.max(0, d.y + dy);
        d.el.style.left = d.page.x + 'px';
        d.el.style.top = d.page.y + 'px';
        drawWires();
    } else {
        const b = board.getBoundingClientRect();
        $('#tempwire').setAttribute('d', curve(flowDrag.from, [ev.clientX - b.left + 8, ev.clientY - b.top]));
        const over = document.elementFromPoint(ev.clientX, ev.clientY);
        document.querySelectorAll('.fcard.drop').forEach(c => c.classList.remove('drop'));
        const card = over && over.closest('.fcard');
        if (card && card.dataset.card !== flowDrag.src) card.classList.add('drop');
    }
});

document.addEventListener('pointerup', ev => {
    if (!flowDrag) return;
    const d = flowDrag;
    flowDrag = null;
    if (d.type === 'wire') {
        const over = document.elementFromPoint(ev.clientX, ev.clientY);
        const card = over && over.closest('.fcard');
        if (card && card.dataset.card !== d.src) connect(d.src, d.key, card.dataset.card);
        renderFlow();
        renderSidebar();
        saveState();
    } else if (d.moved) {
        saveState();
    } else {
        goPage(state.pages.indexOf(d.page)); // a click selects the screen
    }
});

document.addEventListener('click', ev => {
    const view = ev.target.closest('[data-view]');
    const edit = ev.target.closest('[data-edit]');
    const cut = ev.target.closest('[data-cut-src]');
    if (view) {
        state.view = view.dataset.view;
        renderAll();
    } else if (edit) {
        state.view = 'page';
        goPage(+edit.dataset.edit);
    } else if (cut) {
        disconnect(cut.dataset.cutSrc, cut.dataset.cutKey);
        renderFlow();
        renderSidebar();
        saveState();
    } else if (ev.target.closest('[data-tidy]')) {
        state.pages.forEach(p => { p.x = null; });
        renderFlow();
        saveState();
    }
});
