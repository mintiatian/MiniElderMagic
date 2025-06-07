/* -------------------------------------------------
 *  エディタ本体（レイヤー管理・描画・操作）
 * ------------------------------------------------- */

import {Palette} from "./palette.js";
import {Layer} from "./layer.js";
import {Viewport} from "./viewport.js";
import {DEFAULT_CELL, MIN_ROWS, MIN_COLS, paletteEnemyEmojis, paletteEmojis,paletteExDropEmojis} from "./constants.js";
import {padGrid} from "./utils.js";
import {cloneGrid, isColor} from "./utils.js";


import {UIEventDialog} from '../../Script/UI/UIEventDialog.js';
import {eventDataTable} from "../../Script/Utils/DataTable.js";

export class Editor {
    /**
     * @param {object} deps - 必要な DOM と初期値
     */
    constructor({
                    viewportEl, overlayEl, paletteEl, brushInput, brushInfo,
                    undoBtn, redoBtn, layerPanel, mapSizeEl,
                    catTiles, catEnemies, catColors, catEventlist,catDroplist          // ★ 追加
                }) {
        /* DOM refs */
        this.viewportEl = viewportEl;
        this.overlayEl = overlayEl;
        this.brushInput = brushInput;
        this.brushInfo = brushInfo;
        this.undoBtn = undoBtn;
        this.redoBtn = redoBtn;
        this.layerPanel = layerPanel;
        this.mapSizeEl = mapSizeEl;
        /* パレットカテゴリ切替用ラジオ */
        this.catTiles = catTiles;
        this.catEnemies = catEnemies;
        this.catColors = catColors;
        this.catEventlist = catEventlist;
        this.catDroplist = catDroplist;

        /* サブ管理クラス */
        this.palette = new Palette(paletteEl);
        this.viewport = new Viewport(viewportEl, overlayEl);

        /* 状態 */
        this.layers = [];
        this.activeIdx = -1;
        this.brushSize = 1;
        this.mode = "brush";       // brush / rect
        this.painting = false;
        this.dragStart = null;     // {r,c}

        /* 初期イベント */
        this._bindUI();

        this.overlayEl.style.zIndex = 9999;   // ブラシプレビューなどは常に最前面
    }

    _guessCategory(name) {
        if (/mapColor/i.test(name)) return "colors";
        if (/mapEnemyPop/i.test(name)) return "enemies";
        if (/mapChip/i.test(name)) return "tiles";
        if (/mapEvent/i.test(name)) return "mapEvent";
        if (/mapDrop/i.test(name)) return "exDrop";
        return "tiles";                      // mapChip など
    }

    /* -------------- public getters ----------------- */
    get activeLayer() {
        return this.layers[this.activeIdx] ?? null;
    }

    /* -------------- レイヤー操作 -------------------- */
    addLayer(name, grid) {
        /* ---- ① 1 枚目のみ – 必要なら 108×192 まで拡張 ---- */
        if (this.layers.length === 0) {
            ({grid, rows: this.rows, cols: this.cols} = padGrid(grid, MIN_ROWS, MIN_COLS));
            this.mapSizeEl.textContent = `(${this.rows}×${this.cols})`;
            this.overlayEl.width = this.cols * DEFAULT_CELL;
            this.overlayEl.height = this.rows * DEFAULT_CELL;

            const worldW = this.cols * DEFAULT_CELL * this.viewport.scale;
            const worldH = this.rows * DEFAULT_CELL * this.viewport.scale;
            this.viewport.centerView(worldW, worldH);
            this.viewport.applyWorldOffset(worldW, worldH);   // ★ 追加

        } else {
            /* ---- ② 2 枚目以降 – 既定サイズに合わせてパディング ---- */
            ({grid} = padGrid(grid, this.rows, this.cols));
        }
        const layer = new Layer(name, grid, DEFAULT_CELL);
        this.layers.push(layer);
        this.viewportEl.insertBefore(layer.canvas, this.overlayEl); // ← 位置はそのまま

        // ★ 追加：読み込み順＝描画順を z-index で固定（小さいほど奥）
        layer.canvas.style.zIndex = this.layers.length;
        this.viewportEl.insertBefore(layer.canvas, this.overlayEl);
        this._createLayerUI(layer, this.layers.length - 1);

        if (this.activeIdx === -1) this.setActiveLayer(0);
    }

    setActiveLayer(idx) {
        this.activeIdx = idx;
        this.layers.forEach((l, i) => {
            l.canvas.style.pointerEvents = i === idx ? "auto" : "none";
        });
        this.layerPanel.querySelectorAll("input.paint")
            .forEach(r => (r.checked = +r.dataset.i === idx));


        /* ── ここでパレットを自動切替 ── */
        const cat = this._guessCategory(this.layers[idx].name);
        this.palette.setCategory(cat);
        this.catTiles.checked = cat === "tiles";
        this.catEnemies.checked = cat === "enemies";
        this.catColors.checked = cat === "colors";
        this.catEventlist.checked = cat === "mapEvent";
        this.catDroplist.checked = cat === "exDrop";

        

        /* Undo/Redo ボタン更新 */
        this._updateUndoRedoButtons();
    }

    /* -------------- 描画処理 ----------------------- */
    _paintAt(r, c) {
        const layer = this.activeLayer;
        if (!layer) return;
        const off = Math.floor(this.brushSize / 2);
        for (let dr = 0; dr < this.brushSize; dr++) {
            for (let dc = 0; dc < this.brushSize; dc++) {
                const rr = r + dr - off, cc = c + dc - off;
                if (rr < 0 || cc < 0 || rr >= this.rows || cc >= this.cols) continue;
                layer.grid[rr][cc] = this.palette.random();
                layer.drawCell(rr, cc);
            }
        }
    }
    _getGrid(r, c) {
        const layer = this.activeLayer;
        if (!layer) return;
        const off = Math.floor(this.brushSize / 2);
        for (let dr = 0; dr < this.brushSize; dr++) {
            for (let dc = 0; dc < this.brushSize; dc++) {
                const rr = r + dr - off, cc = c + dc - off;
                if (rr < 0 || cc < 0 || rr >= this.rows || cc >= this.cols) continue;
                return layer.grid[rr][cc];
            }
        }
        return null;
    }

    _clearOverlay() {
        const ctx = this.overlayEl.getContext("2d");
        ctx.clearRect(0, 0, this.overlayEl.width, this.overlayEl.height);
    }

    _showBrushPreview(r, c) {
        const ctx = this.overlayEl.getContext("2d");
        this._clearOverlay();
        const off = Math.floor(this.brushSize / 2);
        ctx.strokeStyle = "yellow";
        ctx.globalAlpha = .6;
        ctx.lineWidth = 1;
        ctx.strokeRect(
            (c - off) * DEFAULT_CELL, (r - off) * DEFAULT_CELL,
            this.brushSize * DEFAULT_CELL, this.brushSize * DEFAULT_CELL
        );
        ctx.globalAlpha = 1;
    }

    _showRectPreview(r1, c1, r2, c2) {
        const ctx = this.overlayEl.getContext("2d");
        this._clearOverlay();
        const rs = Math.min(r1, r2), re = Math.max(r1, r2);
        const cs = Math.min(c1, c2), ce = Math.max(c1, c2);
        ctx.strokeStyle = "yellow";
        ctx.globalAlpha = .6;
        ctx.lineWidth = 1;
        ctx.strokeRect(
            cs * DEFAULT_CELL, rs * DEFAULT_CELL,
            (ce - cs + 1) * DEFAULT_CELL, (re - rs + 1) * DEFAULT_CELL
        );
        ctx.globalAlpha = 1;
    }

    /* -------------- UI & イベント ------------------ */
    _bindUI() {
        /* ブラシサイズ */
        const updateBrush = () => {
            this.brushSize = Math.max(1, Math.min(100, Number(this.brushInput.value) || 1));
            this.brushInfo.textContent = `${this.brushSize}×${this.brushSize}`;
        };
        this.brushInput.addEventListener("input", updateBrush);
        updateBrush();

        /* Undo/Redo */
        this.undoBtn.onclick = () => {
            this.activeLayer?.undo();
            this._updateUndoRedoButtons();
        };
        this.redoBtn.onclick = () => {
            this.activeLayer?.redo();
            this._updateUndoRedoButtons();
        };

        /* マウス操作 */
        this.viewportEl.addEventListener("mousedown", ev => this._onMouseDown(ev));
        window.addEventListener("mousemove", ev => this._onMouseMove(ev));
        window.addEventListener("mouseup", ev => this._onMouseUp(ev));
        this.viewportEl.addEventListener("contextmenu", ev => ev.preventDefault());

        /* キーボード操作 */
        window.addEventListener("keydown", ev => this._onKey(ev));
    }

    _createLayerUI(layer, idx) {
        const row = document.createElement('div');      // ← label → div
        row.className = 'layer-row';                    // 好みでクラスを付ける

        row.innerHTML = `
        <button class="reorder up"   data-i="${idx}" title="上へ">▲</button>
        <button class="reorder down" data-i="${idx}" title="下へ">▼</button>

        <!-- 表示 ON/OFF と描画選択だけを label で包む -->
        <label><input type="checkbox" class="show"  data-i="${idx}" checked></label>
        <label><input type="radio"    name="paint"  class="paint" data-i="${idx}"></label>

        <span class="layer-name">${layer.name}</span>`;   // テキストは span
        this.layerPanel.appendChild(row);

        row.querySelector(".show").onchange = e => {
            layer.visible = e.target.checked;
            layer.canvas.style.visibility = layer.visible ? "visible" : "hidden";
        };
        row.querySelector(".paint").onchange = () => this.setActiveLayer(idx);

        /* ▲▼ 入れ替え */
        row.querySelector(".up").onclick = () => this._swapLayers(idx, idx - 1);
        row.querySelector(".down").onclick = () => this._swapLayers(idx, idx + 1);
    }

    _updateUndoRedoButtons() {
        const l = this.activeLayer;
        this.undoBtn.disabled = !l || !l.history.canUndo();
        this.redoBtn.disabled = !l || !l.history.canRedo();
    }

    /* -------------- interaction handlers -------------- */
    _onMouseDown(ev) {
        const [r, c] = this.viewport.clientToCell(ev, DEFAULT_CELL);
        if (this.mode === "pick") {     /* ←★スポイト処理 */
            const layer = this.activeLayer;
            if (!layer) return;
            const val = layer.grid?.[r]?.[c] ?? "";

            /* カテゴリを自動判定してパレット＆ラジオを切替 */
            if (isColor(val)) {
                this.palette.setCategory("colors");
                this.catColors.checked = true;
            } else if (paletteEnemyEmojis.includes(val)) {
                this.palette.setCategory("enemies");
                this.catEnemies.checked = true;
            } else if (paletteEmojis.includes(val)) {
                this.palette.setCategory("tiles");
                this.catTiles.checked = true;
            } else if (paletteExDropEmojis.includes(val)) {
                this.palette.setCategory("exDrop");
                this.catDroplist.checked = true;
            } else {
                this.palette.setCategory("mapEvent");
                this.catEventlist.checked = true;
            }
            this.palette.select(val);    // 選択状態を更新
            /* ── スポイト完了 → ブラシへ戻す ───────────────── */
            this.mode = "brush";                // 内部状態を切替
            document.getElementById("modeBrush").checked = true;  // ラジオも更新
        } else if (ev.button === 0) {              // 左クリック
            if (this.mode === "brush") {
                this.activeLayer?.pushHistory();
                this.painting = true;
                this._paintAt(r, c);
                this._showBrushPreview(r, c);
            } else if (this.mode === "event") {

                this._showBrushPreview(r, c);
                const eventName =this._getGrid(r, c);
                console.log("event:", eventName);
                
                const eventData = eventDataTable.get(eventName);
                document.querySelectorAll('.ui-event-dialog').forEach((e) => e.remove());
                const dlg = new UIEventDialog(document.body, {
                    titleEmoji: eventData.titleEmoji,
                    getItemCount: () => 99,
                    changeItemCount: () => {
                    },
                    onExit: () => console.log('dialog closed'),
                });
                dlg.run(eventData.text);
            } else {
                this.dragStart = {r, c};
                this._showRectPreview(r, c, r, c);
            }
            ev.preventDefault();
        } else if (ev.button === 2) {       // 右ドラッグでパン
            this.viewportEl.dataset.panning = "1";
            this.viewportEl.style.cursor = "grabbing";
            this.viewportEl.dataset.sx = ev.clientX;
            this.viewportEl.dataset.sy = ev.clientY;
            this.viewportEl.dataset.sl = this.viewportEl.scrollLeft;
            this.viewportEl.dataset.st = this.viewportEl.scrollTop;
        }
    }

    _onMouseMove(ev) {
        if (this.viewportEl.dataset.panning === "1") {
            this.viewportEl.scrollLeft = this.viewportEl.dataset.sl - (ev.clientX - this.viewportEl.dataset.sx);
            this.viewportEl.scrollTop = this.viewportEl.dataset.st - (ev.clientY - this.viewportEl.dataset.sy);
            return;
        }
        const [r, c] = this.viewport.clientToCell(ev, DEFAULT_CELL);
        if (this.mode === "brush" || this.mode === "event") {
            this._showBrushPreview(r, c);
            if (this.painting) this._paintAt(r, c);
        } else if (this.dragStart) {
            this._showRectPreview(this.dragStart.r, this.dragStart.c, r, c);
        }
    }

    _onMouseUp(ev) {
        if (this.viewportEl.dataset.panning === "1") {
            this.viewportEl.dataset.panning = "";
            this.viewportEl.style.cursor = "grab";
            return;
        }
        const [r, c] = this.viewport.clientToCell(ev, DEFAULT_CELL);
        if (this.mode === "brush") {
            this.painting = false;
            this._clearOverlay();
        } else if (this.dragStart) {
            this.activeLayer?.pushHistory();
            const rs = Math.min(this.dragStart.r, r), re = Math.max(this.dragStart.r, r);
            const cs = Math.min(this.dragStart.c, c), ce = Math.max(this.dragStart.c, c);
            for (let rr = rs; rr <= re; rr++)
                for (let cc = cs; cc <= ce; cc++) {
                    this.activeLayer.grid[rr][cc] = this.palette.random();
                    this.activeLayer.drawCell(rr, cc);
                }
            this.dragStart = null;
            this._clearOverlay();
        }
    }

    _onKey(ev) {
        const k = ev.key.toLowerCase();
        // Undo / Redo
        if ((ev.ctrlKey || ev.metaKey) && !ev.shiftKey && k === "z") {
            ev.preventDefault();
            this.undoBtn.click();
            return;
        }
        if ((ev.ctrlKey || ev.metaKey) && (k === "y" || (ev.shiftKey && k === "z"))) {
            ev.preventDefault();
            this.redoBtn.click();
            return;
        }

        // WASD scroll
        const step = 64;
        switch (k) {
            case "w":
                this.viewportEl.scrollTop -= step;
                break;
            case "s":
                this.viewportEl.scrollTop += step;
                break;
            case "a":
                this.viewportEl.scrollLeft -= step;
                break;
            case "d":
                this.viewportEl.scrollLeft += step;
                break;
        }
    }

    /**
     * レイヤーを入れ替えて UI / z-index / activeIdx を同期
     * @param {number} from
     * @param {number} to
     */
    _swapLayers(from, to) {
        if (to < 0 || to >= this.layers.length) return;   // はみ出し防止

        /* 配列を swap */
        [this.layers[from], this.layers[to]] =
            [this.layers[to], this.layers[from]];

        /* z-index を描画順で振り直し */
        this.layers.forEach((l, i) => (l.canvas.style.zIndex = i + 1));

        /* レイヤーキャンバスを DOM 上でも並び替え */
        this.layers.forEach(l => this.viewportEl.insertBefore(l.canvas, this.overlayEl));

        /* アクティブ番号も更新 */
        if (this.activeIdx === from) this.activeIdx = to;
        else if (this.activeIdx === to) this.activeIdx = from;

        /* パネルを作り直して data-i を揃える */
        this._rebuildLayerPanel();
    }

    /** パネルをクリア → 現在の layers で再生成 */
    _rebuildLayerPanel() {
        this.layerPanel.innerHTML = "";
        this.layers.forEach((l, i) => this._createLayerUI(l, i));

        /* paint ラジオを復元 */
        if (this.activeIdx >= 0) {
            this.layerPanel.querySelector(`input.paint[data-i="${this.activeIdx}"]`).checked = true;
        }
    }

}
