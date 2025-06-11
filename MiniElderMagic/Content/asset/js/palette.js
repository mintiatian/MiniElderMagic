/* -------------------------------------------------
 *  パレット UI
 * ------------------------------------------------- */
import {randomEmoji} from "./utils.js";
import {paletteEmojis, paletteEnemyEmojis, paletteColors, paletteExDropEmojis} from "./constants.js";

import {eventDataTable, EventDataTable} from "../../Script/Utils/DataTable.js";
import {UIEventDialog}                  from "../../Script/UI/UIEventDialog.js";
export class Palette {
    /** @param {HTMLElement} container */
    constructor(container) {
        this.el = container;
        this.category = "tiles";      // tiles / enemies / colors
        this.selected = [""];
        this._render();
    }

    get current() {
        return this.selected;
    }

    _previewEvent(id) {
        const data = eventDataTable.get(id);
        if (!data) {                        // ID 不整合は軽く警告して終了
            console.warn(`Event '${id}' not found`);
            return;
        }
        /* 既存プレビューを全て閉じる（複数溜まらないように） */
        document.querySelectorAll(".ui-event-dialog").forEach(e => e.remove());

        const dlg = new UIEventDialog(
            document.body,
            {
                titleEmoji: data.titleEmoji,
                getItemCount: () => 99,   // ←在庫取得ロジックに合わせて後で調整
                changeItemCount: () => {
                },  // ←加減ロジックも適宜
                onExit: () => console.log("dialog closed")
            },
            /* thisHideStart=false で即表示 */
            false
        );
        dlg.run(data.text);
    }

    setCategory(cat = "tiles") {
        if (!["tiles", "enemies", "colors", "mapEvent", "exDrop"].includes(cat) || this.category === cat) return;
        this.category = cat;
        this.selected = [""];
        this._render();
    }

    _makeButton(label, isColorChip) {
        const btn = document.createElement("button");
        if (isColorChip) {
            btn.style.background = label;
            btn.title = label;
        } else {
            btn.textContent = label || "␣";
            btn.title = label || "blank";
        }
        btn.onclick = ev => this._onClick(btn, label, ev.shiftKey);
        return btn;
    }

    _onClick(btn, label, multi) {
        if (multi) {
            // 複数選択トグル
            if (this.selected.includes(label)) {
                this.selected = this.selected.filter(x => x !== label);
                btn.classList.remove("sel");
            } else {
                this.selected.push(label);
                btn.classList.add("sel");
            }
        } else {
            // 単一選択
            this.selected = [label];
            this.el.querySelectorAll(".sel").forEach(b => b.classList.remove("sel"));
            btn.classList.add("sel");

            /* ---- Event パレットなら即プレビュー ---- */
            if (this.category === "mapEvent" && label && this._isEventPenActive()) {
                this._previewEvent(label);
            }
        }
    }
    _isEventPenActive() {
        return document.getElementById("modeEvent")?.checked;
    }
    _render() {
        this.el.innerHTML = "";
        // ここでパレットを変える
        switch (this.category) {
            case "tiles":
                paletteEmojis.forEach(e => this.el.appendChild(this._makeButton(e, false)));
                break;
            case "enemies":
                paletteEnemyEmojis.forEach(e => this.el.appendChild(this._makeButton(e, false)));
                break;
            case "exDrop":
                paletteExDropEmojis.forEach(e => this.el.appendChild(this._makeButton(e, false)));
                break;
            case "colors":
                paletteColors.forEach(c => this.el.appendChild(this._makeButton(c, true)));
                break;
            case "mapEvent":
                //paletteColors.forEach(c => this.el.appendChild(this._makeButton(c, true)));
                eventDataTable.table.keys().forEach(key => {
                    console.log(key);
                    this.el.appendChild(this._makeButton(key, false));
                });
                break;
        }
        // デフォルト選択
        const firstBtn = this.el.querySelector("button");
        if (firstBtn) firstBtn.classList.add("sel");
    }

    /** 編集用ランダム値 */
    random() {
        return randomEmoji(this.selected);
    }

    select(value) {
        this.selected = [value];
        // ハイライトをリセット
        this.el.querySelectorAll(".sel").forEach(b => b.classList.remove("sel"));
        // いま表示中のボタンから該当を探す
        const btn = [...this.el.querySelectorAll("button")].find(b => {
            return (this.category === "colors")
                ? b.title === value               // 色チップは title に値
                : (value ? b.textContent === value : b.textContent === "␣");
        });
        if (btn) btn.classList.add("sel");
    }
}
