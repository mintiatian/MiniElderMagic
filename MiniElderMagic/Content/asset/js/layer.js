/* -------------------------------------------------
 *  1 レイヤーのデータと描画
 * ------------------------------------------------- */
import { isColor, cloneGrid } from "./utils.js";
import { History } from "./history.js";

export class Layer {
    /**
     * @param {string} name
     * @param {Array<Array<string>>} grid
     * @param {number} cell
     */
    constructor(name, grid, cell) {
        this.name   = name;
        this.grid   = grid;
        this.cell   = cell;

        // Canvas
        this.canvas = document.createElement("canvas");
        this.canvas.className = "canvas-layer";
        this.canvas.width  = grid[0].length * cell;
        this.canvas.height = grid.length    * cell;
        this.ctx = this.canvas.getContext("2d");

        // 状態
        this.visible = true;
        this.history = new History(grid);
        this.redraw();
    }

    drawCell(r, c) {
        const val = this.grid[r][c] || "";
        const x   = c * this.cell;
        const y   = r * this.cell;

        if (isColor(val)) {
            this.ctx.fillStyle = val;
            this.ctx.fillRect(x, y, this.cell, this.cell);
        } else {
            this.ctx.clearRect(x, y, this.cell, this.cell);
            if (val) {
                this.ctx.font = `${this.cell * 0.7}px serif`;
                this.ctx.textAlign = "center";
                this.ctx.textBaseline = "middle";
                this.ctx.fillText(val, x + this.cell / 2, y + this.cell / 2);
            }
        }
    }
    redraw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (let r = 0; r < this.grid.length; r++)
            for (let c = 0; c < this.grid[0].length; c++)
                this.drawCell(r, c);
    }

    /** Undo/Redo ラッパ */
    pushHistory()  { this.history.push(this.grid); }
    undo() {
        const g = this.history.undo();
        if (g) { this.grid = g; this.redraw(); }
    }
    redo() {
        const g = this.history.redo();
        if (g) { this.grid = g; this.redraw(); }
    }
}
