/* ------------------------------------------------------------------
 *  ScriptBuilderModel.js
 *  データロジック (コマンド配列の管理)
 * ------------------------------------------------------------------ */

import { FIELD_DEFS } from "./ScriptBuilderUtils.js";

export class ScriptBuilderModel {
    constructor() {
        this.commands = [];
        this.autoPageSerial = 1;
        this._listeners = new Set();
    }

    /* ============================================================
     *  Observer
     * ========================================================= */
    onChange(fn) { this._listeners.add(fn); }
    offChange(fn) { this._listeners.delete(fn); }
    _emit()      { this._listeners.forEach(fn => fn(this.commands)); }

    /* ============================================================
     *  Auto pageId
     * ========================================================= */
    generateNextPageId() {
        return `page${this.autoPageSerial++}`;
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
     *  CRUD
     * ========================================================= */
    addCommand(cmd, index = null) {
        if (index === null) {
            this.commands.push(cmd);
            index = this.commands.length - 1;
        } else {
            this.commands[index] = cmd;
        }

        /* yes/no dialog → answer 自動補完 */
        if (cmd.operation === "dialog" && cmd.dialogMode === "yesno") {
            this._ensureYesNoAnswers(index);
        }

        this.autoPageSerial = this._calcNextAutoSerial();
        this._emit();
        return index;
    }

    updateCommand(index, cmd) {
        this.addCommand(cmd, index);
    }

    moveCommand(from, to) {
        if (from === to) return;
        const moved = this.commands.splice(from, 1)[0];
        this.commands.splice(to, 0, moved);
        this._emit();
    }

    /* ============================================================
     *  Import / Export
     * ========================================================= */
    importJson(jsonStr) {
        jsonStr = jsonStr.trim();
        if (!jsonStr) throw new Error("JSON が空です");

        let data;
        try {
            data = JSON.parse(jsonStr);
        } catch (e) {
            throw new Error("JSON の解析に失敗しました");
        }

        const cmds = Array.isArray(data) ? data
            : Array.isArray(data.commands) ? data.commands
                : null;
        if (!cmds) throw new Error("commands 配列が見つかりません");

        this.commands = structuredClone(cmds);
        this.autoPageSerial = this._calcNextAutoSerial();
        this._emit();
    }

    exportData() {
        return {
            commands: this.commands,
            labelTable: this._buildLabelTable(),
            entryPage: this._getFirstPageId()
        };
    }

    /* ============================================================
     *  Utils
     * ========================================================= */
    _ensureYesNoAnswers(dialogIdx) {
        ["yes", "no"].forEach((v, off) => {
            const exists = this.commands.some(c => c.operation === "answer" && c.answerValue === v);
            if (!exists) this.commands.splice(dialogIdx + 1 + off, 0, { operation: "answer", answerValue: v });
        });
    }

    buildPageIdList() {
        return this.commands
            .filter(c => (c.operation === "page" || c.operation === "exit") && c.pageId)
            .map(c => c.pageId);
    }

    getSuggestions() {
        const list = [];
        if (!this.commands.some(c => c.operation === "exit")) {
            list.push({ label: "exit ノード (pageId=end)", template: { operation: "exit", pageId: "end" } });
        }
        this.commands.filter(c => c.operation === "dialog" && c.dialogMode === "yesno").forEach(() => {
            ["yes", "no"].forEach(v => {
                if (!this.commands.some(c => c.operation === "answer" && c.answerValue === v))
                    list.push({ label: `answer \"${v}\"`, template: { operation: "answer", answerValue: v } });
            });
        });
        return list;
    }

    _buildLabelTable() {
        const t = {};
        this.commands.forEach((c, i) => {
            if ((c.operation === "page" || c.operation === "exit") && c.pageId) t[c.pageId] = i;
        });
        return t;
    }

    _getFirstPageId() {
        const p = this.commands.find(c => c.operation === "page");
        return p?.pageId ?? "";
    }
}

export default ScriptBuilderModel;