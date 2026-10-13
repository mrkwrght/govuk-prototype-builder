// ---------- Export: every screen and route, ready for the Prototype Kit ----------
// Loaded before app.js. Produces:
//   app/views/<page>.html   one Nunjucks view per screen
//   app/flow-routes.js      POST routes for the whole flow (routes.js requires it)
// and offers them as a .zip download or as a single Node setup script to paste and run.

const EXPORT_INSTALL_NOTES = [
    '1. Copy the app folder into your Prototype Kit project (merge it with the existing app folder).',
    "2. Add this line to app/routes.js:  require('./flow-routes')",
    '3. Restart the kit and visit the first screen.',
    ''
].join('\n');

// Run a generator against another page by temporarily making it the current one.
function withPage(page, generate) {
    const kept = [state.items, state.title];
    [state.items, state.title] = [page.items, page.title];
    try {
        return generate();
    } finally {
        [state.items, state.title] = kept;
    }
}

function exportFiles() {
    const files = state.pages.map(page => ({
        name: `app/views/${page.name}.html`,
        content: withPage(page, generateNunjucks)
    }));
    files.push({ name: 'app/flow-routes.js', content: generateRoutes() });
    return files;
}

// A Node script that writes the files into a Prototype Kit project and links the routes.
function setupScript(files) {
    const body = files.map(f => `    ${JSON.stringify(f.name)}: ${JSON.stringify(f.content)}`).join(',\n');
    return `// Run from the root of your Prototype Kit project:  node import-flow.js
const fs = require('fs')
const path = require('path')

if (!fs.existsSync('app')) {
  console.error('No app folder found. Run this from the root of your Prototype Kit project.')
  process.exit(1)
}

const files = {
${body}
}

for (const [file, content] of Object.entries(files)) {
  const existed = fs.existsSync(file)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, content)
  console.log((existed ? 'Replaced ' : 'Wrote ') + file)
}

const line = "require('./flow-routes')"
const routes = 'app/routes.js'
if (fs.existsSync(routes) && !fs.readFileSync(routes, 'utf8').includes(line)) {
  fs.appendFileSync(routes, '\\n' + line + '\\n')
  console.log('Added ' + line + ' to ' + routes)
}
`;
}

// ----- Minimal zip writer (files are stored, not compressed) -----
function crc32(bytes) {
    let crc = -1;
    for (const byte of bytes) {
        crc ^= byte;
        for (let k = 0; k < 8; k++) crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1));
    }
    return ~crc >>> 0;
}

function buildZip(files) {
    const encoder = new TextEncoder();
    const parts = [], directory = [];
    let offset = 0;
    files.forEach(file => {
        const name = encoder.encode(file.name), data = encoder.encode(file.content);
        const crc = crc32(data), size = data.length;
        const local = new DataView(new ArrayBuffer(30));
        local.setUint32(0, 0x04034b50, true);
        local.setUint16(4, 20, true);       // version needed
        local.setUint16(6, 0x0800, true);   // UTF-8 names
        local.setUint16(12, 33, true);      // date: 1980-01-01
        local.setUint32(14, crc, true);
        local.setUint32(18, size, true);
        local.setUint32(22, size, true);
        local.setUint16(26, name.length, true);
        parts.push(new Uint8Array(local.buffer), name, data);
        const entry = new DataView(new ArrayBuffer(46));
        entry.setUint32(0, 0x02014b50, true);
        entry.setUint16(4, 20, true);
        entry.setUint16(6, 20, true);
        entry.setUint16(8, 0x0800, true);
        entry.setUint16(14, 33, true);
        entry.setUint32(16, crc, true);
        entry.setUint32(20, size, true);
        entry.setUint32(24, size, true);
        entry.setUint16(28, name.length, true);
        entry.setUint32(42, offset, true);  // where the file starts
        directory.push(new Uint8Array(entry.buffer), name);
        offset += 30 + name.length + size;
    });
    const directorySize = directory.reduce((n, part) => n + part.length, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true);
    end.setUint16(8, files.length, true);
    end.setUint16(10, files.length, true);
    end.setUint32(12, directorySize, true);
    end.setUint32(16, offset, true);
    return new Blob([...parts, ...directory, new Uint8Array(end.buffer)], { type: 'application/zip' });
}

async function copyText(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (_) {
        const box = document.createElement('textarea');
        box.value = text;
        document.body.appendChild(box);
        box.select();
        let ok = false;
        try { ok = document.execCommand('copy'); } catch (__) { }
        box.remove();
        return ok;
    }
}

function renderExport(sb) {
    const files = exportFiles();
    const names = state.pages.map(p => p.name);
    const duplicates = [...new Set(names.filter((n, i) => names.indexOf(n) !== i))];
    const warning = duplicates.length
        ? `<p class="hint" role="alert"><b>Warning:</b> more than one screen is named ${duplicates.map(escapeHtml).join(', ')}. Rename them, or only one will be kept.</p>`
        : '';
    sb.innerHTML = `
        <h2>Export to the Prototype Kit</h2>
        <p class="hint">${state.pages.length} screen${state.pages.length === 1 ? '' : 's'} and their routes, as ${files.length} files:</p>
        ${warning}
        <ul class="filelist">${files.map(f => `<li>${escapeHtml(f.name)}</li>`).join('')}</ul>
        <div class="row">
            <button class="btn" data-export="zip">Download .zip</button>
            <button class="btn s" data-export="script">Copy setup script</button>
        </div>
        <p class="hint" id="exmsg" role="status"></p>
        <details>
            <summary>How to add these to your prototype</summary>
            <p class="hint"><b>Zip:</b> unzip it, copy the <code>app</code> folder into your Prototype Kit project, then add <code>require('./flow-routes')</code> to <code>app/routes.js</code>.</p>
            <p class="hint"><b>Setup script:</b> paste it into a file called <code>import-flow.js</code> in your project's root folder and run <code>node import-flow.js</code>. It writes every file and adds the require line for you.</p>
            <p class="hint">Downloads can be blocked on some pages. If nothing downloads, use the setup script.</p>
        </details>`;
}

document.addEventListener('click', async ev => {
    const button = ev.target.closest('[data-export]');
    if (!button) return;
    const files = exportFiles();
    const message = $('#exmsg');
    if (button.dataset.export === 'zip') {
        const blob = buildZip([...files, { name: 'INSTALL.txt', content: EXPORT_INSTALL_NOTES }]);
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'govuk-prototype-flow.zip';
        document.body.appendChild(link);
        link.click();
        link.remove();
        message.textContent = 'Zip created. If nothing downloaded, use the setup script instead.';
    } else {
        const ok = await copyText(setupScript(files));
        message.textContent = ok ? 'Setup script copied. Save it as import-flow.js and run it with node.' : 'Could not copy automatically.';
    }
});
