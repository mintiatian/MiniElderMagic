/* ------------------------------------------------------------------
 *  ScriptBuilderModel.js – v1.0 (extracted Model layer)
 *  コマンド配列の純粋なデータロジックを担当。
 *  DOM に一切依存しないため、ブラウザ以外の環境でも単体テスト可能。
 * ------------------------------------------------------------------ */

export class ScriptBuilderModel {
    constructor(initialCommands = []) {
        /** @type {Array<Object>} */
        this.commands = structuredClone(initialCommands);
        this.autoPageSerial = this._calcNextAutoSerial();
        this._listeners = new Set();
    }

    /* ============================================================
     *  Observer
     * ========================================================= */
    /** @param {(cmds:Array)=>void} fn */
    onChange(fn) {
        this._listeners.add(fn);
    }

    /** @param {(cmds:Array)=>void} fn */
    offChange(fn) {
        this._listeners.delete(fn);
    }

    _emit() {
        this._listeners.forEach(fn => fn(this.commands));
    }

    /* ============================================================
     *  CRUD
     * ========================================================= */
    /** @param {Object} cmd */
    addCommand(cmd) {
        this.commands.push(cmd);
        this._emit();
        return this.commands.length - 1;
    }

    /** @param {number} index @param {Object} cmd */
    updateCommand(index, cmd) {
        if (index < 0 || index >= this.commands.length) return false;
        this.commands[index] = cmd;
        this._emit();
        return true;
    }

    /** @param {number} index */
    removeCommand(index) {
        if (index < 0 || index >= this.commands.length) return false;
        this.commands.splice(index, 1);
        this._emit();
        return true;
    }

    /** @param {number} from @param {number} to */
    moveCommand(from, to) {
        if (from === to || from < 0 || to < 0 ||
            from >= this.commands.length || to >= this.commands.length) return false;
        const moved = this.commands.splice(from, 1)[0];
        this.commands.splice(to, 0, moved);
        this._emit();
        return true;
    }

    /* ============================================================
     *  Auto pageId
     * ========================================================= */
    generateNextPageId(tag="page") {
        return `${tag}${this.autoPageSerial++}`;
    }

    _calcNextAutoSerial() {
        let max = 0;
        this.commands.forEach(c => {
            if ((c.operation === "page" || c.operation === "exit") && c.pageId?.startsWith("page")) {
                const n = Number(c.pageId.slice(4));
                if (!Number.isNaN(n) && n > max) max = n;
            }
        });
        return max + 1;
    }

    /* ============================================================
     *  Export helpers
     * ========================================================= */
    buildLabelTable() {
        const t = {};
        this.commands.forEach((c, i) => {
            if ((c.operation === "page" || c.operation === "exit") && c.pageId) t[c.pageId] = i;
        });
        return t;
    }

    getFirstPageId() {
        const p = this.commands.find(c => c.operation === "page");
        return p?.pageId ?? "";
    }

    /* ============================================================
     *  Yes/No dialog helper (unchanged)
     * ========================================================= */
    ensureYesNoAnswers(dialogIdx) {
        ['yes', 'no'].forEach((v, off) => {
            const exists = this.commands.some(c => c.operation === 'answer' && c.answerValue === v);
            if (!exists) this.commands.splice(dialogIdx + 1 + off, 0, {operation: 'answer', answerValue: v});
        });
        this._emit();
    }

    /* ============================================================
     *  Condition helper – success / failure 用 page ノードを保証
     * ========================================================= */
    ensureConditionPages(conditionIdx) {
        const cmd = this.commands[conditionIdx];
        if (!cmd || cmd.operation !== 'condition') return;

        const toInsert = [];
        ['successPage', 'failurePage'].forEach(key => {
            const pid = cmd[key];
            if (!pid) return;                                   // 空なら何もしない
            const exists = this.commands.some(c =>
                (c.operation === 'page' || c.operation === 'exit') && c.pageId === pid);
            if (!exists) toInsert.push(pid);
        });
        toInsert.forEach((pid, off) => {
            this.commands.splice(conditionIdx + 1 + off, 0, {operation: 'page', pageId: pid});
        });
        if (toInsert.length) this._emit();
    }

    /* ============================================================
     *  JSON import / export
     * ========================================================= */
    /** @param {string} jsonStr */
    importJson(jsonStr) {
        let data;
        try {
            data = JSON.parse(jsonStr);
        } catch {
            throw new Error('JSON parse error');
        }
        const cmds = Array.isArray(data) ? data : Array.isArray(data.commands) ? data.commands : null;
        if (!cmds) throw new Error('commands[] not found');

        this.commands = structuredClone(cmds);
        this.autoPageSerial = this._calcNextAutoSerial();
        this._emit();
    }

    exportPayload() {
        return {
            commands: this.commands,
            labelTable: this.buildLabelTable(),
            entryPage: this.getFirstPageId()
        };
    }
}
