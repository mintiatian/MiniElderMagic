/* -------------------------------------------------------------------------
 *  UIHubInventory.js
 * -------------------------------------------------------------------------
 *  インベントリバー
 *  - 通常モード : 1 列 10 スロット (数字キー 1–0 / クリック / D&D)
 *  - 拡張モード : 3 行 × 10 列  = 30 スロット
 *    `setExpanded(true)` または `toggleExpanded()` で切替。
 *  - 同じ絵文字は 1 スロットにつき 10 個までスタック。
 *  - スロットクリック／キー使用で useItem() フック呼び出し。
 *  - スロットのドラッグ＆ドロップで入れ替え。
 * ------------------------------------------------------------------------- */

import {UIBase} from './UIBase.js';
import {gameMainScene} from "../Scene/GameMainScene.js";
import {SceneManagerInstance} from "../Scene/SceneManager.js";

export class UIHubInventory extends UIBase {
    /**
     * @param {HTMLElement} parentElement
     */
    constructor(parentElement) {
        super(parentElement);
        /* ===== 追加: グローバル拡大率 ===== */
        this.scale =  1.5;      // デフォルト 1.0
        this._commitScale();               // CSS 変数へ反映

        /** 表示状態 */
        this.expanded = false;            // false = 10 slots, true = 30 slots
        this.visibleCount = 10;           // 通常表示時の表示数
        this.totalSlots = 30;             // 3 行 × 10 列

        /** @type {(null|{emoji:string,count:number})[]} */
        this.items = new Array(this.totalSlots).fill(null);

        /* ───────── ルートスタイル ───────── */
        Object.assign(this.element.style, {
            position: 'absolute',
            left: '50%',
            bottom: '16px',
            transform: 'translateX(-50%) scale(var(--inv-scale))', // ← 拡大率反映
            gap: '8px',
            padding: '8px 12px',
            borderRadius: '10px',
            background: 'rgba(0,0,0,.45)',
            backdropFilter: 'blur(4px)',
            boxShadow: '0 2px 6px rgba(0,0,0,.4)',
            zIndex: 1000,
            userSelect: 'none',
        });

        /** @type {HTMLElement[]} スロット配列 */
        this.slotElems = [];

        /* ───────── スロット生成 ───────── */
        for (let i = 0; i < this.totalSlots; i++) {
            const slot = this._createSlot(i);
            this.element.appendChild(slot);
            this.slotElems.push(slot);
        }

        /* レイアウト反映 */
        this._applyLayout();

        /* ───────── キー入力 ───────── */
        this._onKeyDown = (ev) => {
            if (ev.repeat) return;
            const idx = {'1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6, '8': 7, '9': 8, '0': 9}[ev.key];
            if (idx !== undefined) {
                const item = this.items[idx];
                if (item) {
                    this._animateClick(this.slotElems[idx]);
                    this.useItem(idx, item.emoji);
                }
            }
        };
        window.addEventListener('keydown', this._onKeyDown);
    }

    /* --- 新規: CSS 変数 --inv-scale を設定 ------------------------ */
    _commitScale() {
        if (!document.getElementById('ui-hub-inv-style')) {
            const st = document.createElement('style');
            st.id = 'ui-hub-inv-style';
            st.textContent = `:root{--inv-scale:1}`;
            document.head.appendChild(st);
        }
        document.documentElement.style.setProperty('--inv-scale', this.scale);
    }
            
    handleKeyDown(event) {
        // Tabキーが押されたときの処理
        if (event.key === 'Tab') {
            // デフォルトのTabキーの動作を防止
            event.preventDefault();

            if (this.isVisible) {
                this.toggleExpanded();
            } else {
                this.toggleExpanded();
            }
        }
    }

    /* ────────────────────────────────────────────────────────────────
     *  Public API
     * ---------------------------------------------------------------- */

    /** 通常 (10) / 拡張 (30) 表示を切替 */
    setExpanded(expanded) {
        if (this.expanded === expanded) return;
        this.expanded = expanded;
        this._applyLayout();
    }

    toggleExpanded() {
        this.setExpanded(!this.expanded);
    }

    /** Add item (スタック) */
    addItem(emoji) {


        SceneManagerInstance.audio.playSE('getitem');

        // 既存スタックに追加
        let idx = this.items.findIndex(x => x && x.emoji === emoji && x.count < 10);
        if (idx !== -1) {
            this.items[idx].count += 1;
            this._updateSlotDisplay(idx);
            return idx;
        }
        // 空スロット
        idx = this.items.findIndex(x => x === null);
        if (idx === -1) return -1;
        this.items[idx] = {emoji, count: 1};
        this._updateSlotDisplay(idx);
        return idx;
    }

    AddItem(emoji) {
        return this.addItem(emoji);
    }


    /**
     * emoji で指定したアイテムの所持数を `delta` 分だけ増減させる
     *  - `delta > 0` : 追加（スタック上限 10 を超える場合は空きスロットへ分配）
     *  - `delta < 0` : 消費（足りない場合は出来る限り減らして false を返す）
     * @param {string} emoji  アイテム識別用の絵文字
     * @param {number} delta  正＝増加 / 負＝減少
     * @returns {boolean}     すべての増減に成功したか
     */
    changeItemCount(emoji, delta) {
        if (!delta) return true;                 // 0 なら何もしない

        /* ---------- 追加 ---------- */
        if (delta > 0) {
            for (let i = 0; i < delta; i++) {
                if (this.addItem(emoji) === -1) return false; // 空きなし
            }
            return true;
        }

        /* ---------- 消費 ---------- */
        let need = -delta;                       // 減らしたい残個数
        for (let i = 0; i < this.items.length && need > 0; i++) {
            const slot = this.items[i];
            if (slot && slot.emoji === emoji) {
                const dec = Math.min(slot.count, need);
                slot.count -= dec;
                need -= dec;
                if (slot.count <= 0) this.items[i] = null;
                this._updateSlotDisplay(i);
            }
        }
        return need === 0;                       // 減らし切れたら true
    }

    /** スロット消費 */
    consume(index, dec = 1) {
        const data = this.items[index];
        if (!data) return;
        data.count -= dec;
        if (data.count <= 0) this.items[index] = null;
        this._updateSlotDisplay(index);
    }

    /**
     * 指定した絵文字を何個持っているかカウントして返す
     * @param {string} emoji 例: "🍎"
     * @returns {number}     例: 5（0 の場合は未所持）
     */
    getItemCount(emoji) {
        let total = 0;
        for (const slot of this.items) {
            if (slot && slot.emoji === emoji) total += slot.count;
        }
        return total;
    }

    /**
     * 指定した絵文字を『最低 min 個』持っているか判定する
     * @param {string} emoji      例: "🍎"
     * @param {number} minCount   必要個数（省略時 1）
     * @returns {boolean}
     */
    hasItem(emoji, minCount = 1) {
        return this.getItemCount(emoji) >= minCount;
    }

    /** アイテム使用フック (ゲーム側でオーバーライド) */
    // eslint-disable-next-line no-unused-vars
    useItem(index, emoji) {
        switch (emoji) {
            case "🍄":
                gameMainScene.wizard.status.heal(30);
                gameMainScene.statusUI.updateDisplay();
                this.consume(index);
                break;
            case "🍞":
                gameMainScene.wizard.status.heal(80);
                gameMainScene.statusUI.updateDisplay();
                this.consume(index);
                break;
            case "🍗":
                gameMainScene.wizard.status.heal(150);
                gameMainScene.statusUI.updateDisplay();
                this.consume(index);
                break;
            case "🍎":
                gameMainScene.wizard.status.heal(20);
                gameMainScene.statusUI.updateDisplay();
                this.consume(index);
                break;
            case "🧀":
                gameMainScene.wizard.status.heal(120);
                gameMainScene.statusUI.updateDisplay();
                this.consume(index);
                break;
            case "🥛":
                gameMainScene.wizard.status.heal(80);
                gameMainScene.statusUI.updateDisplay();
                this.consume(index);
                break;
            case "🥘":
                gameMainScene.wizard.status.heal(300);
                gameMainScene.statusUI.updateDisplay();
                this.consume(index);
                break;
            case "🧿":
            case "🔮":
            case "🌟":
            case "🕯️":
            case "💎":
            case "📿":
            case "🏺":
            case "🗝️":
            case "🪣":
            case "🧵":
            case "🪶":
            case "📜":
            case "🖋️":
            case "💍":
            case "⌚":
            case "💀":
            case "💧":
                break;
        }
    }

    /** 後片付け */
    destroy() {
        window.removeEventListener('keydown', this._onKeyDown);
        super.destroy?.();
    }

    /* ────────────────────────────────────────────────────────────────
     *  内部処理
     * ---------------------------------------------------------------- */

    _createSlot(i) {
        const slot = document.createElement('div');
        Object.assign(slot.style, {
            width: '44px',
            height: '44px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #555',
            borderRadius: '6px',
            background: 'rgba(255,255,255,.05)',
            cursor: 'pointer',
            transition: 'transform 0.12s ease-out, background 0.12s',
        });
        slot.draggable = true;

        // Emoji icon
        const icon = document.createElement('span');
        Object.assign(icon.style, {
            fontSize: '26px',
            lineHeight: '1',
            pointerEvents: 'none',
        });
        slot.appendChild(icon);

        // Counter
        const counter = document.createElement('span');
        Object.assign(counter.style, {
            position: 'absolute',
            right: '2px',
            bottom: '0px',
            fontSize: '13px',
            color: '#fff',
            textShadow: '0 0 3px #000',
            pointerEvents: 'none',
        });
        slot.appendChild(counter);

        slot._icon = icon;
        slot._counter = counter;
        slot.dataset.index = i;

        // Click
        slot.addEventListener('click', (ev) => {
            if (ev.detail === 0) return;
            const idx = Number(slot.dataset.index);
            const data = this.items[idx];
            if (data) {
                this._animateClick(slot);
                this.useItem(idx, data.emoji);
            }
        });

        // Drag & Drop
        slot.addEventListener('dragstart', (ev) => {
            const idx = Number(slot.dataset.index);
            if (!this.items[idx]) {
                ev.preventDefault();
                return;
            }
            ev.dataTransfer.effectAllowed = 'move';
            ev.dataTransfer.setData('text/plain', String(idx));
            slot.style.opacity = '0.5';
        });
        slot.addEventListener('dragend', () => {
            slot.style.opacity = '';
        });
        slot.addEventListener('dragover', (ev) => {
            ev.preventDefault();
        });
        slot.addEventListener('dragenter', () => {
            slot.style.background = 'rgba(255,255,255,.12)';
        });
        slot.addEventListener('dragleave', () => {
            slot.style.background = 'rgba(255,255,255,.05)';
        });
        slot.addEventListener('drop', (ev) => {
            ev.preventDefault();
            slot.style.background = 'rgba(255,255,255,.05)';
            const srcIdx = Number(ev.dataTransfer.getData('text/plain'));
            const dstIdx = Number(slot.dataset.index);
            if (srcIdx !== dstIdx) this._swapItems(srcIdx, dstIdx);
        });

        return slot;
    }

    /** レイアウト適用 (通常 = flex | 拡張 = grid 3 行 10 列) */
    _applyLayout() {
        if (this.expanded) {
            // 3 行 × 10 列を明示
            Object.assign(this.element.style, {
                display: 'grid',
                gridTemplateColumns: 'repeat(10, 44px)', // ← ★ 10 列固定
                gridTemplateRows: 'repeat(3, 44px)',  // ← ★ 3 行固定
                justifyContent: 'center',           // 中央寄せ（任意）
                gap: '8px',              // 余白
                /* ← ★ 以前付いていた property を上書き／無効化しておく */
                gridAutoFlow: 'row',   // もしくは '' で削除
                gridAutoColumns: '',      // '' で完全クリア
            });
        } else {
            Object.assign(this.element.style, {
                display: 'flex',
                flexDirection: 'row',
                gap: '8px',
            });
        }

        // スロットの表示 / 非表示
        for (let i = 0; i < this.totalSlots; i++) {
            const slot = this.slotElems[i];
            slot.style.display = (!this.expanded && i >= this.visibleCount) ? 'none' : 'flex';
        }
    }

    _updateSlotDisplay(index) {
        const slot = this.slotElems[index];
        const data = this.items[index];
        if (data) {
            slot._icon.textContent = data.emoji;
            slot._counter.textContent = data.count > 1 ? String(data.count) : '';
        } else {
            slot._icon.textContent = '';
            slot._counter.textContent = '';
        }
    }

    _animateClick(slot) {
        if (slot._animTimeout) clearTimeout(slot._animTimeout);
        slot.style.transform = 'scale(0.85)';
        slot._animTimeout = setTimeout(() => {
            slot.style.transform = '';
        }, 120);
    }

    _swapItems(srcIdx, dstIdx) {
        const tmp = this.items[srcIdx];
        this.items[srcIdx] = this.items[dstIdx];
        this
            .items[dstIdx] = tmp;
        this._updateSlotDisplay(srcIdx);
        this._updateSlotDisplay(dstIdx);
    }
}