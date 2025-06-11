/* -------------------------------------------------
 *  main.js  –  MapEditor エントリポイント
 *  DOM 取得 & 連携ロジックを MapEditorMain クラスへ統合
 * ------------------------------------------------- */

import { Editor } from "./editor.js";
import { FileIO } from "./io.js";
import { parseCSV } from "./utils.js";
import {eventDataTable, EventDataTable} from "../../Script/Utils/DataTable.js";

/* -------------------------------------------------
 *  MapEditorMain
 * ------------------------------------------------- */
export class MapEditorMain {
    constructor() {

        const urls = {
            event: 'https://docs.google.com/spreadsheets/d/1Yz0RJs4WuimcoH2Af6c1JclQL46bgGOGj1QUqAnfXPc/export?format=csv',
        };

        this._loadedCount = 0;            // 進捗カウンター
        this._totalToLoad = Object.keys(urls).length;            // 期待ロード数

        EventDataTable.init(urls.event).then(() => this.initCount());

    }

    initCount() {
        ++this._loadedCount;
        console.log("MasterLoad : ", this._loadedCount, " / ", this._totalToLoad)
        if (this._loadedCount === this._totalToLoad) {
            this.init();                      // ← ここで後続処理
        }
    }

    init() {

        this.eventList = eventDataTable.table.keys();
        
        /* ----- DOM 取得 ----- */
        const $ = id => document.getElementById(id);

        this.viewportEl  = $("viewport");
        this.overlayEl   = $("overlay");

        this.paletteEl   = $("palette");
        this.catTiles    = $("catTiles");
        this.catEnemies  = $("catEnemies");
        this.catColors   = $("catColors");
        this.catEventlist   = $("catEventlist");
        this.catDroplist   = $("catDroplist");
        this.brushInput  = $("brush");
        this.brushInfo   = $("brushInfo");

        this.undoBtn     = $("undoBtn");
        this.redoBtn     = $("redoBtn");

        this.fileInput   = $("fileInput");
        this.downloadBtn = $("downloadBtn");
        this.saveSetBtn  = $("saveSetBtn");
        this.loadSetBtn  = $("loadSetBtn");
        this.dirInput    = $("dirInput");

        this.layerPanel  = $("layerPanel");
        this.mapSizeEl   = $("mapSize");
        this.runSheetsBtn= $("runSheetsBtn");

        this.modeBrush   = $("modeBrush");
        this.modeRect    = $("modeRect");
        this.modePick    = $("modePick");
        this.modeEvent    = $("modeEvent");

        /* ----- インスタンス生成 ----- */
        this.editor = new Editor({
            viewportEl: this.viewportEl,
            overlayEl : this.overlayEl,
            paletteEl : this.paletteEl,
            brushInput: this.brushInput,
            brushInfo : this.brushInfo,
            undoBtn   : this.undoBtn,
            redoBtn   : this.redoBtn,
            layerPanel: this.layerPanel,
            mapSizeEl : this.mapSizeEl,
            catTiles  : this.catTiles,
            catEnemies: this.catEnemies,
            catColors : this.catColors,
            catEventlist : this.catEventlist,
            catDroplist : this.catDroplist
        });
        new FileIO(this.fileInput, this.downloadBtn, this.editor);

        /* ----- イベント連携 ----- */
        this._bindUiEvents();
    }

    /* =========================================================
     *  private: UI ⇔ ロジック
     * =======================================================*/
    _bindUiEvents() {
        /* download_and_update_sheets.py 起動 */
        this.runSheetsBtn.onclick = () => {
            const toolUrl = new URL("./SheetsCsvTool.html", location.href).href;
            window.open(toolUrl, "_blank", "noopener");
        };

        /* CSV 3 点セット保存 */
        this.saveSetBtn.onclick = () => this._saveCsvSet();

        /* CSV 3 点セット読込 */
        this.loadSetBtn.onclick = async () => {
            try {
                const src = await this.pickDirectory("read");

                if (src instanceof FileList) {
                    // フォールバック: 既存処理を再利用
                    await this._loadCsvSet(src);
                } else {
                    // FileSystemDirectoryHandle 版
                    await this._loadCsvSetFromHandle(src);
                }
            } catch (e) {
                if (e.name !== "AbortError") console.warn(e);
            }
        };

        /* パレットカテゴリ切替 */
        this.catTiles .onchange = () => this.catTiles .checked && this._selectCategory("tiles" , /mapChip/i);
        this.catEnemies.onchange = () => this.catEnemies.checked && this._selectCategory("enemies", /mapEnemyPop/i);
        this.catColors .onchange = () => this.catColors .checked && this._selectCategory("colors", /mapColor/i);
        this.catEventlist .onchange = () => this.catEventlist .checked && this._selectCategory("EventList", /mapEvent/i);
        this.catDroplist .onchange = () => this.catDroplist .checked && this._selectCategory("exDrop", /mapDrop/i);

        /* ブラシ / 矩形 / ピック モード */
        this.modeBrush.onchange = () => this.editor.mode = "brush";
        this.modeRect .onchange = () => this.editor.mode = "rect";
        this.modePick .onchange = () => this.editor.mode = "pick";
        this.modeEvent .onchange = () => this.editor.mode = "event";
        
    }
    async _loadCsvSetFromHandle(dir) {
        const order = [
            "mapColor.csv",
            "mapChip.csv",
            "mapEnemyPop.csv",
            "mapEvent.csv",
            "mapDrop.csv"
        ];

        for (const name of order) {
            let fh;
            try { fh = await dir.getFileHandle(name); }
            catch { console.warn(`${name} が見つかりません`); continue; }

            const file = await fh.getFile();
            const csv  = await file.text();
            this.editor.addLayer(name, parseCSV(csv));
        }
    }
    /**
     * フォルダを選択し、読み書きモード／フォールバックを吸収したハンドルを返す
     * @param {"read"|"readwrite"} mode
     * @returns {Promise<FileSystemDirectoryHandle|FileList>}  フォールバック時は FileList
     */
    async pickDirectory(mode = "read") {
        // ★ File System Access API が使えればそちらを優先
        if (window.showDirectoryPicker) {
            try {
                const dir = await window.showDirectoryPicker({
                    startIn: "documents"
                });
                // 権限確認
                const perm = await dir.requestPermission({ mode });
                if (perm === "granted") return dir;
            } catch (err) {
                if (err.name !== "AbortError") console.warn(err);
                throw err; // ユーザーキャンセルなど
            }
        }

        // ★ 非対応ブラウザ → input[type=file]+webkitdirectory でフォールバック
        return new Promise((res, rej) => {
            const input = document.createElement("input");
            input.type = "file";
            input.webkitdirectory = true;
            input.hidden = true;
            document.body.appendChild(input);
            input.onchange = () => {
                document.body.removeChild(input);
                if (input.files.length) res(input.files);
                else rej(new Error("No folder selected"));
            };
            input.click();
        });
    }


    _selectCategory(cat, layerRegex) {
        this.editor.palette.setCategory(cat);
        const idx = this.editor.layers.findIndex(l => layerRegex.test(l.name));
        if (idx !== -1) this.editor.setActiveLayer(idx);
    }

    /* =========================================================
     *  CSV helpers
     * =======================================================*/
    _gridToCSV(grid) {
        return grid.map(r => r.join(",")).join("\n");
    }

    async _saveCsvSet() {
        const targets = ["mapColor.csv", "mapChip.csv", "mapEnemyPop.csv", "mapEvent.csv", "mapDrop.csv"].map(fn => ({
            fileName: fn,
            layer   : this.editor.layers.find(l => l.name.toLowerCase() === fn.toLowerCase())
        }));

        if (targets.some(t => !t.layer)) {
            alert("保存対象のレイヤーが見つかりません。"+targets.length+" つとも読み込んでから実行してください。");
            return;
        }

        // File System Access API が使える？
        if (window.showDirectoryPicker) {
            try {
                const dir = await window.showDirectoryPicker({ id: "csv-set" });
                for (const { fileName, layer } of targets) {
                    const handle    = await dir.getFileHandle(fileName, { create: true });
                    const writable  = await handle.createWritable();
                    await writable.write(this._gridToCSV(layer.grid));
                    await writable.close();
                }
                alert("保存が完了しました！");
            } catch (err) {
                if (err.name !== "AbortError")
                    alert("保存に失敗しました: " + err.message);
            }
        } else {
            // Fallback: individual download
            targets.forEach(({ fileName, layer }) => {
                const blob = new Blob([this._gridToCSV(layer.grid)], { type: "text/csv" });
                const a    = document.createElement("a");
                a.href      = URL.createObjectURL(blob);
                a.download  = fileName;
                a.style.display = "none";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(a.href);
            });
            alert("お使いのブラウザではフォルダ書き込みに対応していないため、CSV を個別にダウンロードしました。");
        }
    }

    async _loadCsvSet(fileList) {
        const files = Array.from(fileList);
        const order = ["mapColor.csv", "mapChip.csv", "mapEnemyPop.csv", "mapEvent.csv", "mapDrop.csv"];

        for (const name of order) {
            const f = files.find(x => x.name === name);
            if (!f) {
                console.warn(`"${name}" が見つかりませんでした`);
                continue;
            }
            const csvText = await f.text();
            this.editor.addLayer(f.name, parseCSV(csvText));
        }
    }

    /* =========================================================
     *  static boot helper
     * =======================================================*/
    static initEditor() {
        return new MapEditorMain();
    }
}

/* -------------------------------------------------
 *  Boot
 * ------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
    MapEditorMain.initEditor();
});
