/* -------------------------------------------------
 *  パレット UI
 * ------------------------------------------------- */
import {randomEmoji} from "./utils.js";
import {paletteEmojis, paletteEnemyEmojis, paletteColors} from "./constants.js";

import {eventDataTable, EventDataTable} from "../../Script/Utils/DataTable.js";
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

    setCategory(cat = "tiles") {
        if (!["tiles", "enemies", "colors","mapEvent"].includes(cat) || this.category === cat) return;
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
        }
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
            case "colors":
                paletteColors.forEach(c => this.el.appendChild(this._makeButton(c, true)));
                break;
            case "mapEvent":
                //paletteColors.forEach(c => this.el.appendChild(this._makeButton(c, true)));
                eventDataTable.table.keys().forEach(key => {
                    console.log(key);
                    this.el.appendChild(this._makeButton(key, false));
                });

                //paletteEmojis.forEach(e => this.el.appendChild(this._makeButton(e, false)));
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

    select(value){
        this.selected = [value];
        // ハイライトをリセット
        this.el.querySelectorAll(".sel").forEach(b=>b.classList.remove("sel"));
        // いま表示中のボタンから該当を探す
        const btn = [...this.el.querySelectorAll("button")].find(b=>{
            return (this.category==="colors")
                ? b.title === value               // 色チップは title に値
                : (value ? b.textContent===value : b.textContent==="␣");
        });
        if(btn) btn.classList.add("sel");
    }
}
