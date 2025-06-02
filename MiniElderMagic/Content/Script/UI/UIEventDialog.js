/* -------------------------------------------------------------------------
 *  UIEventDialog.js
 * -------------------------------------------------------------------------
 *  画面中央に表示されるイベントダイアログ
 *   - タイトル絵文字（4×サイズ）
 *   - ファミコン風テキスト（1 文字ずつ表示／クリックで全文表示）
 *   - ボタンモード
 *       • "ok"   … OK ボタン１つ
 *       • "yesno"… はい / いいえ ボタン
 * ------------------------------------------------------------------------- */

import { UIBase } from './UIBase.js';
import {gameMain} from "../GameMain.js";
import {eventDataTable, eventTileDataTable} from "../Utils/DataTable.js";

export class UIEventDialog extends UIBase {
    /**
     * @param {HTMLElement} parentElement
     * @param {Object=}     opts
     *        opts.titleEmoji {string}  = '💬'   表示する絵文字
     *        opts.text       {string}          本文 (改行 \n 可)
     *        opts.mode       {'ok'|'yesno'} = 'ok'
     *        opts.speed      {number}  = 30     1 文字あたり ms
     *        opts.onResult   {function(result:'ok'|'yes'|'no')|null}
     */
    constructor(parentElement, opts = {}) {
        super(parentElement);
        const {
            titleEmoji = '💬',
            text       = '',
            mode       = 'ok',
            speed      = 80,
            onResult   = null,
        } = opts;

        /* ────── コンテナ ────── */
        Object.assign(this.element.style, {
            position: 'absolute',
            left:     '50%',
            top:      '50%',
            transform: 'translate(-50%, -50%)',
            width:    '60%',
            maxWidth: '420px',
            minWidth: '280px',
            padding:  '16px 24px',
            background: 'rgba(0,0,0,.8)',
            color:      '#fff',
            fontFamily: 'monospace',
            border:     '2px solid #fff',
            borderRadius:'8px',
            boxShadow:  '0 4px 12px rgba(0,0,0,.5)',
            zIndex:    9999,
        });

        /* ────── タイトル (絵文字) ────── */
        this.titleEl = document.createElement('div');
        this.titleEl.textContent = titleEmoji;
        Object.assign(this.titleEl.style, {
            fontSize:  '4rem',          // 約 4 倍
            textAlign: 'center',
            lineHeight:'1',
            marginBottom: '12px',
            userSelect: 'none',
        });
        this.element.appendChild(this.titleEl);

        /* ────── テキストエリア ────── */
        this.textEl = document.createElement('pre');
        Object.assign(this.textEl.style, {
            margin:        '0 auto 16px',
            whiteSpace:    'pre-wrap',
            minHeight:     '5em',       // 高さ確保
            letterSpacing: '1px',
        });
        this.element.appendChild(this.textEl);

        /* ────── ボタン ────── */
        this.btnArea = document.createElement('div');
        Object.assign(this.btnArea.style, {
            display:       'flex',
            justifyContent: mode === 'yesno' ? 'space-evenly' : 'center',
            gap:           '24px',
        });
        this.element.appendChild(this.btnArea);

        const makeButton = (label) => {
            const btn = document.createElement('button');
            btn.textContent = label;
            Object.assign(btn.style, {
                fontFamily: 'inherit',
                fontSize:   '1rem',
                padding:    '4px 18px',
                cursor:     'pointer',
            });
            btn.onmouseenter = () => btn.style.filter = 'brightness(1.3)';
            btn.onmouseleave = () => btn.style.filter = '';
            return btn;
        };

        if (mode === 'yesno') {
            const yesBtn = makeButton('はい');
            const noBtn  = makeButton('いいえ');
            yesBtn.onclick = () => this._finish('yes', onResult);
            noBtn.onclick  = () => this._finish('no',  onResult);
            this.btnArea.append(yesBtn, noBtn);
        } else { // ok
            const okBtn = makeButton('OK');
            okBtn.onclick = () => this._finish('ok', onResult);
            this.btnArea.appendChild(okBtn);
        }

        /* ────── タイプライター演出 ────── */
        this._fullText = text.replace(/\r\n/g, '\n');
        this._speed    = speed;
        this._idx      = 0;
        this._revealing = true;

        /** @type {number|null} */
        this._timer = setInterval(() => this._stepTypewriter(), this._speed);

        // クリックで全文表示
        this.element.addEventListener('click', () => {
            if (this._revealing) {
                this._showAll();
            }
        });
        this.hide();
        this.userClose = false;
    }
    
    show(){

        // プレイヤーがいま踏んでいるタイル絵文字
        const tileEmoji = gameMain.wizard?.eventTile ?? "";
        if (!tileEmoji) return;                  // 空文字 → 何もなし

        if (!eventTileDataTable.table.has(tileEmoji)) return;

        const evtTile = eventTileDataTable.get(tileEmoji);
        if (evtTile?.type !== "event") return;    // shop 以外は無視

        evtTile.event

        this.eventData = eventDataTable.get(evtTile.event);
        
        this.update({
            titleEmoji : this.eventData.titleEmoji,
            text       : this.eventData.text,
            mode       : this.eventData.mode,
            onResult   : res => {
                if(res === "yes"){
                    this.nextText({
                        text       : "ありがとう！",
                        mode       : "ok",});
                }
            },
        });
        
        
        super.show();
    }

    /* ------------------ 内部メソッド ------------------ */

    _stepTypewriter() {
        if (this._idx >= this._fullText.length) {
            clearInterval(this._timer);
            this._revealing = false;
            return;
        }
        this.textEl.textContent += this._fullText[this._idx++];
    }

    _showAll() {
        clearInterval(this._timer);
        this._revealing = false;
        this.textEl.textContent = this._fullText;
    }

    /**
     * @param {'ok'|'yes'|'no'} result
     * @param {function|null} cb
     */
    _finish(result, cb) {
        this.hide();              // UIBase が持つ破棄メソッド
        if (cb) cb(result);
    }

    /* ------------------ Static helper ------------------ */

    /**
     * ダイアログ内容を上書きして再利用する
     * @param {Object=} opts  ─ constructor と同じ項目（省略可）
     */
    update(opts = {}) {
        const {
            titleEmoji, text, mode,
            speed,      onResult,
        } = opts;

        /* ─ タイトル絵文字 ─ */
        if (titleEmoji !== undefined) {
            this.titleEl.textContent = titleEmoji;
        }

        /* ─ 本文（タイプライターをリセット） ─ */
        if (text !== undefined) {
            clearInterval(this._timer);
            this._fullText  = text.replace(/\r\n/g, '\n');
            this._idx       = 0;
            this._revealing = true;
            this.textEl.textContent = '';
            this._speed = speed ?? this._speed;
            this._timer = setInterval(() => this._stepTypewriter(), this._speed);
        }

        /* ─ ボタン＆コールバック ─ */
        if (mode !== undefined || onResult !== undefined) {
            // いったん全部外して作り直し
            this.btnArea.replaceChildren();
            const makeButton = (label) => {
                const b = document.createElement('button');
                b.textContent = label;
                Object.assign(b.style, {
                    fontFamily: 'inherit', fontSize: '1rem',
                    padding: '4px 18px', cursor: 'pointer',
                });
                b.onmouseenter = () => b.style.filter = 'brightness(1.3)';
                b.onmouseleave = () => b.style.filter = '';
                return b;
            };

            const cb = onResult ?? (()=>{});   // 未指定なら no-op
            const m  = mode ?? (this._mode ?? 'ok');
            this._mode = m;                    // 保存

            Object.assign(this.btnArea.style, {
                justifyContent: m === 'yesno' ? 'space-evenly' : 'center',
            });
            if (m === 'yesno') {
                const yesBtn = makeButton('はい');
                const noBtn  = makeButton('いいえ');
                yesBtn.onclick = () => this._finish('yes', cb);
                noBtn.onclick  = () => this._finish('no',  cb);
                this.btnArea.append(yesBtn, noBtn);
            } else {
                const okBtn = makeButton('OK');
                okBtn.onclick = () => this._finish('ok', cb);
                this.btnArea.append(okBtn);
            }
        }
    }
    
    hide(){
        super.hide();
        this.userClose = true;
    }

    handleKeyDown(event) {
        // Tabキーが押されたときの処理
        if (event.key === 'Tab') {
            // デフォルトのTabキーの動作を防止
            event.preventDefault();

            if (this.isVisible) {
                this.hide();
            } else {
                if(this.userClose){
                    this.userClose = false;
                    return;
                }

                this.show();
            }
        }
    }

    /* ----------------- Static helper ----------------- */

    /** 現在の画面で１つだけ使い回す簡易ユーティリティ */
    static show(parent, opts = {}) {
        // 既に開いていれば再利用
        if (UIEventDialog._instance && !UIEventDialog._instance.disposed) {
            UIEventDialog._instance.update(opts);
            return UIEventDialog._instance;
        }
        // 新規生成
        UIEventDialog._instance = new UIEventDialog(parent, opts);
        return UIEventDialog._instance;
    }
}
