/* -------------------------------------------------
 *  DOM 初期化 & クラス連携
 * ------------------------------------------------- */
import {Editor} from "./editor.js";
import {FileIO} from "./io.js";
import {parseCSV} from "./utils.js";        // ★ 追加（CSV 解析用）

/* ----- DOM 取得 ----- */
const viewportEl = document.getElementById("viewport");
const overlayEl = document.getElementById("overlay");

const paletteEl = document.getElementById("palette");
const catTiles = document.getElementById("catTiles");
const catEnemies = document.getElementById("catEnemies");
const catColors = document.getElementById("catColors");
const brushInput = document.getElementById("brush");
const brushInfo = document.getElementById("brushInfo");

const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");

const fileInput = document.getElementById("fileInput");
const downloadBtn = document.getElementById("downloadBtn");
const saveSetBtn = document.getElementById("saveSetBtn");   // ★ 追加
const loadSetBtn = document.getElementById("loadSetBtn");  // ★ 追加
const dirInput = document.getElementById("dirInput");    // ★ 追加

const layerPanel = document.getElementById("layerPanel");
const mapSizeEl = document.getElementById("mapSize");

/* ----- インスタンス生成 ----- */
const editor = new Editor({
    viewportEl, overlayEl, paletteEl, brushInput, brushInfo,
    undoBtn, redoBtn, layerPanel, mapSizeEl,
    catTiles, catEnemies, catColors          // ★ 追加
});
new FileIO(fileInput, downloadBtn, editor);

function gridToCSV(grid) {
    return grid.map(r => r.join(",")).join("\n");
}

saveSetBtn.onclick = async () => {
    /* 対象 3 レイヤーを名前で検索（大小文字無視） */
    const targets = ["mapColor.csv", "mapChip.csv", "mapEnemyPop.csv"]
        .map(fn => ({
            fileName: fn,
            layer: editor.layers.find(l => l.name.toLowerCase() === fn.toLowerCase())
        }));

    /* レイヤーが見つからない場合は警告して中断 */
    if (targets.some(t => !t.layer)) {
        alert("保存対象のレイヤーが見つかりません。3 つとも読み込んでから実行してください。");
        return;
    }

    /* File System Access API が使える？ */
    if (window.showDirectoryPicker) {
        try {
            const dir = await window.showDirectoryPicker({id: "csv-set"});
            for (const {fileName, layer} of targets) {
                const handle   = await dir.getFileHandle(fileName, {create: true});
                const writable = await handle.createWritable();
                await writable.write(gridToCSV(layer.grid));
                await writable.close();
            }
            alert("保存が完了しました！");
        } catch (err) {
            if (err.name !== "AbortError")      // ユーザーがキャンセル
                alert("保存に失敗しました: " + err.message);
        }
    } else {
        /* Fallback: <a download> で 3 連続ダウンロード */
        targets.forEach(({fileName, layer}) => {
            const blob = new Blob([gridToCSV(layer.grid)], {type: "text/csv"});
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = fileName;
            a.style.display = "none";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
        });
        alert("お使いのブラウザではフォルダ書き込みに対応していないため、CSV を個別にダウンロードしました。");
    }
};
/* -------------------------------------------------
*  CSV ３点セット読込（フォルダ選択）
* ------------------------------------------------- */
loadSetBtn.onclick = () => dirInput.click();   // ボタン → 隠し input を開く

async function loadCsvSet(fileList) {
    const files = Array.from(fileList);
    const order = ["mapColor.csv", "mapChip.csv", "mapEnemyPop.csv"];

    for (const name of order) {
        const f = files.find(x => x.name === name);
        if (!f) {
            console.warn(`"${name}" が見つかりませんでした`);
            continue;
        }
        // File.text() は Promise<string> を返すので await で完了を待つ
        const csvText = await f.text();
        editor.addLayer(f.name, parseCSV(csvText));
    }
}

dirInput.addEventListener("change", ev => {
    loadCsvSet(ev.target.files);  // ← 置き換え
    ev.target.value = "";   // 選択状態をリセット
});

/* ★ パレットカテゴリ切替 */
catTiles.onchange = () => editor.palette.setCategory("tiles");
catEnemies.onchange = () => editor.palette.setCategory("enemies");
catColors.onchange = () => editor.palette.setCategory("colors");

/* Brush / Rect モード切替（ラジオボタン） */
const modeBrush = document.getElementById("modeBrush");
const modeRect = document.getElementById("modeRect");
modeBrush.onchange = () => (editor.mode = "brush");
modeRect.onchange = () => (editor.mode = "rect");
