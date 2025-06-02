/* -------------------------------------------------
 *  Undo / Redo 管理（レイヤ単位）
 * ------------------------------------------------- */
import { cloneGrid } from "./utils.js";

export class History {
    /** @param {Array<Array<string>>} grid */
    constructor(grid) {
        this.stack = [cloneGrid(grid)];
        this.idx   = 0;
        this.max   = 100;
    }
    push(grid) {
        // 直近より未来を切り捨て
        this.stack = this.stack.slice(0, this.idx + 1);
        this.stack.push(cloneGrid(grid));
        if (this.stack.length > this.max) this.stack.shift();
        this.idx = this.stack.length - 1;
    }
    canUndo() { return this.idx > 0; }
    canRedo() { return this.idx < this.stack.length - 1; }
    undo() {
        if (!this.canUndo()) return null;
        this.idx--;
        return cloneGrid(this.stack[this.idx]);
    }
    redo() {
        if (!this.canRedo()) return null;
        this.idx++;
        return cloneGrid(this.stack[this.idx]);
    }
}
