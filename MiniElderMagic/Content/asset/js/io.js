/* -------------------------------------------------
 *  CSV ロード／保存
 * ------------------------------------------------- */
import { parseCSV } from "./utils.js";

export class FileIO {
    /**
     * @param {HTMLInputElement} fileInput
     * @param {HTMLButtonElement} downloadBtn
     * @param {import('./editor.js').Editor} editor
     */
    constructor(fileInput, downloadBtn, editor) {
        this.editor = editor;

        fileInput.addEventListener("change", ev => {
            const files = Array.from(ev.target.files);
            files.forEach(f => {
                const reader = new FileReader();
                reader.onload = e => this.editor.addLayer(f.name, parseCSV(e.target.result));
                reader.readAsText(f, "utf-8");
            });
            ev.target.value = ""; // reset
        });

        downloadBtn.onclick = () => {
            const layer = this.editor.activeLayer;
            if (!layer) return;
            const csv  = layer.grid.map(r => r.join(",")).join("\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = layer.name.replace(/\.csv$/i, "") + "_edited.csv";
            a.click();
            URL.revokeObjectURL(a.href);
        };
    }
}
