/* -------------------------------------------------
 *  Emoji Map CSV Editor  –  Canvas Edition
 *  (extracted from the original <script> in MapEditor.html)
 * ------------------------------------------------- */

/* ---------- Config --------------------------------------------------- */
const paletteEmojis = [
    "", "", "", "🧱", "⛰️", "🏔️", "🌋", "🗻", "🪨", "🌊",
    "🟫", "🟩", "🟨", "🟥", "🟫", "🌉", "🌲", "🌳", "🌴", "🏝️",
    "🌾", "🍀", "🌿", "🏜️", "🪵", "🏠", "🏡", "🏘️", "🏚️", "🏕️",
    "⛺", "🏖️", "🏟️", "🎪", "🏛️", "🛖", "🏦", "🏰", "⛪", "🕌",
    "🛕", "👾", "👹", "👻", "🐉", "🧟", "👺", "🦇", "🐺", "🤖", "🎃"
];

const paletteColors = [
    "#0d0d0d", "#1a0000", "#330000", "#1a0d00", "#1a1400",
    "#443300", "#1a1a00", "#001a00", "#002233", "#00001a",
    "#1a0033", "#1a0014", "#0d001a", "#1a1a1a"
];

const MIN_CELL = 4;          // 最小セルサイズ (px)
const MAX_CELL = 96;         // 最大セルサイズ (px)

let cellSize = parseInt(getComputedStyle(document.documentElement)
    .getPropertyValue("--cell")) || 32;   // CSS 変数 → js へ
let scale = 1;

/* ---------- State ---------------------------------------------------- */
const layers = [];           // { name, grid, canvas, ctx, visible, undo, undoIdx, ui }
let rows = 0, cols = 0;

let activeLayerIndex = -1;
let selectedEmojis   = [""]; // 単一 or 複数選択
let brushSize        = 1;
let mode             = "brush"; // "brush" | "rect"
let painting         = false;
let dragStart        = null;    // {r,c}

/* ---------- DOM refs ------------------------------------------------- */
const viewport   = document.getElementById("viewport");
const overlay    = document.getElementById("overlay");
const octx       = overlay.getContext("2d");

const paletteEl  = document.getElementById("palette");
const brushEl    = document.getElementById("brush");
const brushInfo  = document.getElementById("brushInfo");

const undoBtn    = document.getElementById("undoBtn");
const redoBtn    = document.getElementById("redoBtn");

const fileInput  = document.getElementById("fileInput");
const downloadBtn= document.getElementById("downloadBtn");

const layerPanel = document.getElementById("layerPanel");
const mapSizeEl  = document.getElementById("mapSize");

/* ---------- Helpers -------------------------------------------------- */
const isColor = v => typeof v === "string" && v.startsWith("#");

function randomEmoji() {
    return selectedEmojis[Math.floor(Math.random() * selectedEmojis.length)] || "";
}
function parseCSV(text) {
    return text.trim().split(/\r?\n/).map(row => row.split(","));
}

/* ---------- Drawing -------------------------------------------------- */
function drawCell(layer, r, c) {
    const val = layer.grid[r][c] || "";
    const x   = c * cellSize;
    const y   = r * cellSize;

    if (isColor(val)) {
        layer.ctx.fillStyle = val;
        layer.ctx.fillRect(x, y, cellSize, cellSize);
    } else {
        layer.ctx.clearRect(x, y, cellSize, cellSize);
        if (val) {
            layer.ctx.font         = `${cellSize * 0.7}px serif`;
            layer.ctx.textAlign    = "center";
            layer.ctx.textBaseline = "middle";
            layer.ctx.fillText(val, x + cellSize / 2, y + cellSize / 2);
        }
    }
}

function redrawLayer(layer) {
    layer.ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        drawCell(layer, r, c);
    }
}

/* ---------- History (per-layer undo) -------------------------------- */
function pushHistory(layer) {
    layer.undo = layer.undo.slice(0, layer.undoIdx + 1);
    layer.undo.push(layer.grid.map(r => r.slice()));
    if (layer.undo.length > 100) layer.undo.shift();
    layer.undoIdx = layer.undo.length - 1;
    updateUndoRedoButtons();
}

function undo() {
    const l = layers[activeLayerIndex];
    if (!l || l.undoIdx <= 0) return;
    l.undoIdx--;
    l.grid = l.undo[l.undoIdx].map(r => r.slice());
    redrawLayer(l);
    updateUndoRedoButtons();
}
function redo() {
    const l = layers[activeLayerIndex];
    if (!l || l.undoIdx >= l.undo.length - 1) return;
    l.undoIdx++;
    l.grid = l.undo[l.undoIdx].map(r => r.slice());
    redrawLayer(l);
    updateUndoRedoButtons();
}
function updateUndoRedoButtons() {
    const l = layers[activeLayerIndex] || { undoIdx: 0, undo: [1] };
    undoBtn.disabled = l.undoIdx <= 0;
    redoBtn.disabled = l.undoIdx >= l.undo.length - 1;
}

/* ---------- Palette -------------------------------------------------- */
function renderPalette() {
    paletteEl.innerHTML = "";

    function makeBtn(label, isColorChip) {
        const btn = document.createElement("button");
        if (isColorChip) {
            btn.style.background = label;
            btn.title            = label;
        } else {
            btn.textContent = label || "␣";
            btn.title       = label || "blank";
        }

        btn.onclick = ev => {
            if (ev.shiftKey) {
                // multi-select
                if (selectedEmojis.includes(label)) {
                    selectedEmojis = selectedEmojis.filter(x => x !== label);
                    btn.classList.remove("sel");
                } else {
                    selectedEmojis.push(label);
                    btn.classList.add("sel");
                }
            } else {
                // single
                selectedEmojis = [label];
                document.querySelectorAll(".palette .sel")
                    .forEach(el => el.classList.remove("sel"));
                btn.classList.add("sel");
            }
        };
        return btn;
    }

    paletteEmojis .forEach(e => paletteEl.appendChild(makeBtn(e, false)));
    paletteColors .forEach(c => paletteEl.appendChild(makeBtn(c, true)));
    paletteEl.querySelector("button").classList.add("sel");
}
renderPalette();

/* ---------- Layer handling ------------------------------------------ */
function createCanvasLayer(w, h) {
    const c = document.createElement("canvas");
    c.width  = w;
    c.height = h;
    c.className = "canvas-layer";
    viewport.insertBefore(c, overlay);
    return c;
}

function addLayer(name, grid) {
    if (layers.length === 0) {
        rows = grid.length;
        cols = grid[0].length;
        mapSizeEl.textContent = `(${rows}×${cols})`;
        overlay.width  = cols * cellSize;
        overlay.height = rows * cellSize;
    } else {
        // 他レイヤに合わせて切り詰め
        grid = grid.slice(0, rows).map(r => r.slice(0, cols));
    }

    const canvas = createCanvasLayer(cols * cellSize, rows * cellSize);
    const ctx    = canvas.getContext("2d");

    const layer = {
        name,
        grid,
        canvas,
        ctx,
        visible: true,
        undo:   [grid.map(r => r.slice())],
        undoIdx: 0,
        ui:     null
    };
    layers.push(layer);
    redrawLayer(layer);
    createLayerUI(layer, layers.length - 1);
    if (activeLayerIndex === -1) setActiveLayer(0);
}

function createLayerUI(layer, idx) {
    const row = document.createElement("label");
    row.innerHTML =
        `<input type="checkbox" class="show" data-i="${idx}" checked>
         <input type="radio" name="paint" class="paint" data-i="${idx}">
         ${layer.name}`;
    layerPanel.appendChild(row);
    layer.ui = row;

    row.querySelector(".show").onchange = e => {
        layer.visible = e.target.checked;
        layer.canvas.style.visibility = layer.visible ? "visible" : "hidden";
    };
    row.querySelector(".paint").onchange = () => setActiveLayer(idx);
}

function setActiveLayer(i) {
    activeLayerIndex = i;
    document.querySelectorAll("input.paint")
        .forEach(r => (r.checked = +r.dataset.i === i));

    layers.forEach((l, idx) => {
        l.canvas.style.pointerEvents = idx === i ? "auto" : "none";
        if (idx === i) viewport.insertBefore(l.canvas, overlay);
    });
    updateUndoRedoButtons();
}

/* ---------- Painting ------------------------------------------------- */
function paintAt(r, c) {
    const l = layers[activeLayerIndex];
    if (!l) return;

    const off = Math.floor(brushSize / 2);
    for (let dr = 0; dr < brushSize; dr++) {
        for (let dc = 0; dc < brushSize; dc++) {
            const rr = r + dr - off,
                cc = c + dc - off;
            if (rr < 0 || cc < 0 || rr >= rows || cc >= cols) continue;

            const val = randomEmoji();
            l.grid[rr][cc] = val;
            drawCell(l, rr, cc);
        }
    }
}

/* ---------- Preview overlay ----------------------------------------- */
function clearOverlay() {
    octx.clearRect(0, 0, overlay.width, overlay.height);
}

function showBrushPreview(r, c) {
    clearOverlay();
    const off = Math.floor(brushSize / 2);
    octx.strokeStyle   = "yellow";
    octx.globalAlpha   = 0.6;
    octx.lineWidth     = 1;
    octx.strokeRect((c - off) * cellSize, (r - off) * cellSize,
        brushSize * cellSize, brushSize * cellSize);
    octx.globalAlpha = 1;
}

function showRectPreview(r1, c1, r2, c2) {
    clearOverlay();
    const rs = Math.min(r1, r2), re = Math.max(r1, r2);
    const cs = Math.min(c1, c2), ce = Math.max(c1, c2);
    octx.strokeStyle   = "yellow";
    octx.globalAlpha   = 0.6;
    octx.lineWidth     = 1;
    octx.strokeRect(cs * cellSize, rs * cellSize,
        (ce - cs + 1) * cellSize, (re - rs + 1) * cellSize);
    octx.globalAlpha = 1;
}

/* ---------- Coordinate helpers -------------------------------------- */
function clientToCell(ev) {
    const rect = viewport.getBoundingClientRect();
    const x = (ev.clientX - rect.left + viewport.scrollLeft) / scale;
    const y = (ev.clientY - rect.top  + viewport.scrollTop ) / scale;
    return [Math.floor(y / cellSize), Math.floor(x / cellSize)];
}

/* ---------- Interaction (mouse) ------------------------------------- */
viewport.addEventListener("mousedown", ev => {
    const [r, c] = clientToCell(ev);

    if (ev.button === 0) {          // Left
        const l = layers[activeLayerIndex];
        if (!l) return;

        if (mode === "brush") {
            pushHistory(l);
            painting = true;
            paintAt(r, c);
            showBrushPreview(r, c);
        } else {
            dragStart = { r, c };
            showRectPreview(r, c, r, c);
        }
        ev.preventDefault();
    } else if (ev.button === 2) {   // Right (panning)
        viewport.dataset.panning = "1";
        viewport.style.cursor = "grabbing";
        viewport.dataset.sx = ev.clientX;
        viewport.dataset.sy = ev.clientY;
        viewport.dataset.sl = viewport.scrollLeft;
        viewport.dataset.st = viewport.scrollTop;
    }
});
window.addEventListener("mousemove", ev => {
    if (viewport.dataset.panning === "1") {
        viewport.scrollLeft = viewport.dataset.sl - (ev.clientX - viewport.dataset.sx);
        viewport.scrollTop  = viewport.dataset.st - (ev.clientY - viewport.dataset.sy);
        return;
    }

    const [r, c] = clientToCell(ev);
    if (mode === "brush") {
        showBrushPreview(r, c);
        if (painting) paintAt(r, c);
    } else if (dragStart) {
        showRectPreview(dragStart.r, dragStart.c, r, c);
    }
});
window.addEventListener("mouseup", ev => {
    if (viewport.dataset.panning === "1") {
        viewport.dataset.panning = "";
        viewport.style.cursor = "grab";
        return;
    }

    const l = layers[activeLayerIndex];
    if (!l) { clearOverlay(); return; }

    const [r, c] = clientToCell(ev);

    if (mode === "brush") {
        painting = false;
        clearOverlay();
    } else if (dragStart) {
        pushHistory(l);
        const rs = Math.min(dragStart.r, r), re = Math.max(dragStart.r, r);
        const cs = Math.min(dragStart.c, c), ce = Math.max(dragStart.c, c);
        for (let rr = rs; rr <= re; rr++)
            for (let cc = cs; cc <= ce; cc++) {
                l.grid[rr][cc] = randomEmoji();
                drawCell(l, rr, cc);
            }
        dragStart = null;
        clearOverlay();
    }
});
viewport.addEventListener("contextmenu", ev => {
    ev.preventDefault();
    const [r, c] = clientToCell(ev);
    const l = layers[activeLayerIndex];
    if (!l) return;
    pushHistory(l);
    selectedEmojis = [""];
    paintAt(r, c);
    showBrushPreview(r, c);
});

/* ---------- Interaction (keyboard) ---------------------------------- */
window.addEventListener("keydown", ev => {
    const k = ev.key.toLowerCase();

    // Undo / Redo
    if ((ev.ctrlKey || ev.metaKey) && !ev.shiftKey && k === "z") {
        ev.preventDefault(); undo(); return;
    }
    if ((ev.ctrlKey || ev.metaKey) &&
        (k === "y" || (ev.shiftKey && k === "z"))) {
        ev.preventDefault(); redo(); return;
    }

    // WASD scroll
    const step = 64;
    switch (k) {
        case "w": viewport.scrollTop  -= step; break;
        case "s": viewport.scrollTop  += step; break;
        case "a": viewport.scrollLeft -= step; break;
        case "d": viewport.scrollLeft += step; break;
    }
});

/* ---------- Zoom ----------------------------------------------------- */
viewport.addEventListener("wheel", ev => {
    ev.preventDefault();
    const factor   = ev.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.max(MIN_CELL / cellSize,
        Math.min(4, scale * factor));
    if (newScale === scale) return;

    const rect = viewport.getBoundingClientRect();
    const mx = ev.clientX - rect.left + viewport.scrollLeft;
    const my = ev.clientY - rect.top  + viewport.scrollTop;
    const ratio = newScale / scale;

    scale = newScale;
    layers.forEach(l => (l.canvas.style.transform = `scale(${scale})`));
    overlay.style.transform = `scale(${scale})`;

    viewport.scrollLeft = mx * ratio - (ev.clientX - rect.left);
    viewport.scrollTop  = my * ratio - (ev.clientY - rect.top);
});

/* ---------- Brush size ---------------------------------------------- */
function updateBrush() {
    brushSize      = Math.max(1, Math.min(100, Number(brushEl.value) || 1));
    brushInfo.textContent = `${brushSize}×${brushSize}`;
}
brushEl.addEventListener("input", updateBrush);
updateBrush();

/* ---------- File I/O ------------------------------------------------- */
fileInput.addEventListener("change", ev => {
    const files = Array.from(ev.target.files);
    if (!files.length) return;

    files.forEach(f => {
        const reader = new FileReader();
        reader.onload = e => addLayer(f.name, parseCSV(e.target.result));
        reader.readAsText(f, "utf-8");
    });

    ev.target.value = "";      // reset
});

downloadBtn.onclick = () => {
    const l = layers[activeLayerIndex];
    if (!l) return;

    const csv  = l.grid.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = l.name.replace(/\.csv$/i, "") + "_edited.csv";
    a.click();
    URL.revokeObjectURL(a.href);
};

undoBtn.onclick = undo;
redoBtn.onclick = redo;
updateUndoRedoButtons();

/* ---------- Expose some helpers (optional) -------------------------- */
export { addLayer, layers };   // 外部から呼びたい場合だけ
