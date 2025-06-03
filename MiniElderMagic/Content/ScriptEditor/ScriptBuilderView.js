/* ------------------------------------------------------------------
 *  ScriptBuilderView.js – v3.2 (robust View)
 *  UI レンダラー (DOM 操作 & イベント)
 * ------------------------------------------------------------------ */

import { $, FIELD_DEFS, createSelect } from "./ScriptBuilderUtils.js";
import { ScriptBuilderModel } from "./ScriptBuilderModel.js";

export class ScriptBuilderView {
    constructor() {
        /* ---- DOM 取得 ---- */
        this.cmdTypeEl     = $("#cmdType");
        this.fieldZone     = $("#fieldZone");
        this.actionBtn     = $("#actionBtn");
        this.listEl        = $("#cmdList");
        this.detailZone    = $("#detailZone");
        this.outputEl      = $("#output");
        this.suggestListEl = $("#suggestList");
        this.importBtn     = $("#importBtn");

        /* ---- モデル ---- */
        this.model = new ScriptBuilderModel();
        this.editingIndex = null;

        /* ---- イベント ---- */
        this._bindEvents();

        /* ---- 初期描画 ---- */
        this._renderFields();
        this._renderSuggestions();

        /* ---- モデル監視 ---- */
        this.model.onChange(() => {
            this._renderList();
            this._renderSuggestions();
        });
    }

    /* ----------------- ヘルパ ----------------- */
    _resetEditMode() {
        this.editingIndex = null;
        this.actionBtn.textContent = "Add";
        this.detailZone.textContent = "";
    }

    _clearForm() {
        this.fieldZone.querySelectorAll("input,textarea").forEach(el => (el.value = ""));
    }

    /* ----------------- イベント ----------------- */
    _bindEvents() {
        /* 種別変更 */
        this.cmdTypeEl.addEventListener("change", () => {
            this._renderFields();
            this._resetEditMode();
        });

        /* 追加 / 更新 */
        this.actionBtn.addEventListener("click", () => this._handleAddOrUpdate());

        /* Export */
        $("#exportBtn").addEventListener("click", () => {
            this.outputEl.value = JSON.stringify(this.model.exportData(), null, 2);
        });

        /* Import */
        this.importBtn.addEventListener("click", () => {
            try {
                this.model.importJson(this.outputEl.value);
                this._resetEditMode();
                this._renderFields();
                this._renderList();           // ← 即時再描画
                this._renderSuggestions();
            } catch (e) {
                alert(e.message);
            }
        });
    }

    /* ----------------- フィールド描画 ----------------- */
    _renderFields(values = {}) {
        this.fieldZone.innerHTML = "";
        const type = this.cmdTypeEl.value;
        const defs = FIELD_DEFS[type];

        if (type === "jump") this._buildPageIdDatalist();

        defs.forEach(def => {
            const wrap = document.createElement("div");
            wrap.className = "field";

            const label = document.createElement("span");
            label.textContent = def.label;

            let el;
            if (type === "jump" && def.key === "targetPage") {
                el = document.createElement("input");
                el.setAttribute("list", "pageIds");
            } else if (type === "dialog" && def.key === "dialogMode") {
                el = createSelect(["yesno", "ok"], values[def.key]);
            } else {
                el = def.type === "textarea" ? document.createElement("textarea") : document.createElement("input");
                if (def.type && def.type !== "textarea") el.type = def.type;
            }

            if (def.placeholder) el.placeholder = def.placeholder;
            el.id = def.key;
            el.value = values[def.key] ?? "";

            wrap.append(label, el);
            this.fieldZone.append(wrap);
        });
    }

    /* ----------------- 追加 / 更新 ----------------- */
    _handleAddOrUpdate() {
        const type = this.cmdTypeEl.value;
        const defs = FIELD_DEFS[type];
        const cmd  = { operation: type };
        let   valid = true;

        defs.forEach(def => {
            const raw = $("#" + def.key).value.trim();
            const val = def.type === "number" ? Number(raw) : raw;

            if (type === "page" && def.key === "pageId" && val === "") {
                cmd.pageId = this.model.generateNextPageId();
                $("#" + def.key).value = cmd.pageId;
            } else {
                cmd[def.key] = val;
            }
            if (def.required !== false && (val === "" || val === undefined)) valid = false;
        });

        if (!valid) {
            alert("未入力のフィールドがあります");
            return;
        }

        if (this.editingIndex === null) {
            this.editingIndex = this.model.addCommand(cmd);
        } else {
            this.model.updateCommand(this.editingIndex, cmd);
        }

        /* ----- UI 更新 ----- */
        this._clearForm();
        this._resetEditMode();
        this._renderList();           // モデルからの通知が来なくても確実に再描画
        this._renderSuggestions();
    }

    /* ----------------- リスト描画 ----------------- */
    _renderList() {
        this.listEl.innerHTML = "";
        this.model.commands.forEach((cmd, i) => {
            const li = document.createElement("li");
            li.dataset.index = i;
            li.textContent   = `${i}: ${cmd.operation} ${this._describe(cmd)}`;
            if (i === this.editingIndex) li.classList.add("active");

            /* D&D */
            li.draggable = true;
            li.addEventListener("dragstart", e => e.dataTransfer.setData("text/plain", i));
            li.addEventListener("dragover", e => e.preventDefault());
            li.addEventListener("drop", e => {
                this.model.moveCommand(Number(e.dataTransfer.getData("text/plain")), i);
                this._resetEditMode();
                this._renderList();  // ← 直ちに再描画
            });

            /* 編集 */
            li.addEventListener("click", () => this._startEdit(i));
            this.listEl.append(li);
        });
    }

    _describe(cmd) {
        switch (cmd.operation) {
            case "page":   return cmd.pageId ? `(${cmd.pageId})` : "";
            case "answer": return `(${cmd.answerValue})`;
            case "jump":   return `→${cmd.targetPage}`;
            case "changeItemCount": return `${cmd.item} ${cmd.delta}`;
            default: return "";
        }
    }

    _startEdit(i) {
        if (this.editingIndex === i) {
            this._resetEditMode();
            this._clearForm();
            return;
        }
        this.editingIndex = i;
        const cmd = this.model.commands[i];
        this.cmdTypeEl.value = cmd.operation;
        this._renderFields(cmd);
        this.actionBtn.textContent = "Update";
        this.detailZone.textContent = JSON.stringify(cmd, null, 2);
    }

    /* ----------------- サジェスト ----------------- */
    _renderSuggestions() {
        this.suggestListEl.innerHTML = "";
        this.model.getSuggestions().forEach(s => {
            const li = document.createElement("li");
            li.textContent = s.label;
            li.addEventListener("click", () => {
                this.model.addCommand({ ...s.template });
                this._renderList();           // モデル通知待たず即時反映
                this._renderSuggestions();
            });
            this.suggestListEl.append(li);
        });
    }

    /* ----------------- datalist ----------------- */
    _buildPageIdDatalist() {
        let dl = document.getElementById("pageIds");
        if (dl) dl.remove();
        dl = document.createElement("datalist");
        dl.id = "pageIds";
        this.model.buildPageIdList().forEach(id => {
            const opt = document.createElement("option");
            opt.value = id;
            dl.append(opt);
        });
        document.body.append(dl);
    }
}

export default ScriptBuilderView;
