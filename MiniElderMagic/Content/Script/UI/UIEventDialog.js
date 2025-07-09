import {UIBase} from './UIBase.js';
import {gameMainScene} from "../Scene/GameMainScene.js";
import {eventDataTable, eventTileDataTable, textDataTable} from '../Utils/DataTable.js';

export class UIEventDialog extends UIBase {
    constructor(parentElement, opts = {}, thisHideStart = true, useExit = false) {
        super(parentElement);

        /* ===== 追加: グローバル拡大率 ===== */
        this.scale = opts.scale ?? 1.5;      // デフォルト 1.0
        this._commitScale();               // CSS 変数へ反映

        this._applyOpts(opts);
        this._writerTimer = null;        // ← 追加：typewriter 用
        this._script = null;
        this._pc = 0;
        this._waiting = null;
        this._lastAnswer = null;
        this._buildDom();

        this.thisHideStart = thisHideStart;
        this.useExit = useExit;
        if (this.thisHideStart) {
            this.hide();
        }
    }

    /* --- 新規: CSS 変数 --ed-scale を設定 ------------------------ */
    _commitScale() {
        if (!document.getElementById('ui-event-dialog-style')) {
            const st = document.createElement('style');
            st.id = 'ui-event-dialog-style';
            st.textContent = `:root{--ed-scale:1}`;
            document.head.appendChild(st);
        }
        document.documentElement.style.setProperty('--ed-scale', this.scale);
    }

    _applyOpts(opts) {
        this.titleEmoji = opts.titleEmoji ?? '💬';
        this.speed = opts.speed ?? 30;
        this.getItemCount = opts.getItemCount ?? (() => 0);
        this.changeItemCount = opts.changeItemCount ?? (() => {
        });
        this.onResult = opts.onResult ?? (() => {
            //console.log('UIEventDialog: onResult', this._lastAnswer);
        });
        this.onExit = opts.onExit ?? (() => {
        });
    }

    /* ========= 追加：実行中スクリプトを安全に中断 ========= */
    _cancelCurrentRun() {
        console.log('UIEventDialog: _cancelCurrentRun');
        // typewriter が動いていたら止める
        if (this._writerTimer !== null) {
            console.log('UIEventDialog: cancel typewriter');
            clearInterval(this._writerTimer);
            this._writerTimer = null;
            // --- ここで Promise を完了させる ------------------
            if (this._writerResolver) {
                this._writerResolver();   // resolve して await を解除
                this._writerResolver = null;
            }
        }
        // _wait() で止まっていれば解除
        this._resolveWait();
        // ループを強制終了 (次 run 時の衝突防止) 
        if (this._script) this._pc = this._script.commands.length;
    }

    run(script, opts = {}) {

        this._cancelCurrentRun();

        if (opts && Object.keys(opts).length) this._applyOpts({...opts});
        const s = typeof script === 'string' ? JSON.parse(script) : script;
        if (!s.labelTable) {
            s.labelTable = {};
            s.commands.forEach((c, i) => {
                if (c.operation === 'page' && c.pageId) s.labelTable[c.pageId] = i;
            });
        }
        if (!s.entryPage) {
            const p = s.commands.find(c => c.operation === 'page');
            s.entryPage = p?.pageId ?? Object.keys(s.labelTable)[0];
        }
        this._script = s;
        this._pc = s.labelTable[s.entryPage];
        super.show();
        return this._execute(s);
    }

    async runFromUrl(src, opts = {}) {
        // src が生 JSON テキストの場合
        if (src.trim().startsWith('{')) return this.run(src, opts);

        const res = await fetch(src);
        if (!res.ok) throw new Error(`UIEventDialog: fetch failed ${src}`);
        const txt = await res.text();
        return this.run(txt, opts);
    }

    showDialog(text = '', mode = 'ok', opts = {}) {
        const cmds = [
            {operation: 'page', pageId: 'body', text},
            {operation: 'dialog', dialogMode: mode},
            {operation: 'answer', answerValue: mode === 'yesno' ? 'yes' : 'ok'},
            {operation: 'jump', targetPage: 'end'}
        ];
        if (mode === 'yesno') cmds.push({operation: 'answer', answerValue: 'no'}, {
            operation: 'jump',
            targetPage: 'end'
        });
        cmds.push({operation: 'page', pageId: 'end'}, {operation: 'exit'});
        const script = {commands: cmds, labelTable: {body: 0, end: cmds.length - 2}, entryPage: 'body'};

        return this.run(script, opts);
    }

    jumpExecute(targetPage) {
        this._pc = this._script.labelTable[targetPage] - 1;
    }

    async _execute(script) {
        while (this._pc < script.commands.length) {
            const cmd = script.commands[this._pc];

            //console.log('UIEventDialog: pc next ', this._pc, 'cmd', script.commands[this._pc].operation);

            switch (cmd.operation) {
                case 'page':
                    await this._opPage(cmd);
                    break;
                case 'dialog':
                    await this._opDialog(cmd);
                    break;
                case 'answer':
                    // 選択された答えと一致しなければ次の answer へスキップ
                    if (this._lastAnswer !== cmd.answerValue) {
                        while (++this._pc < script.commands.length) {
                            const next = script.commands[this._pc];
                            // 次の dialog で分岐ブロック終了
                            if (next.operation === 'dialog') break;
                            // 自分が選んだ answer に到達したら処理を続ける
                            if (next.operation === 'answer' &&
                                next.answerValue === this._lastAnswer) break;
                        }
                        // break した位置から再評価
                        continue;
                    }
                    // 一致した answer ブロックを処理するときだけ
                    // 必要ならここで _lastAnswer をクリアしてもよい
                    break;
                case 'condition':
                    this._opCondition(cmd);
                    break;
                case 'changeItemCount':
                    this._opChangeItem(cmd);
                    break;
                case 'jump': {
                    const tgt = cmd.targetPage;
                    if (!(tgt in this._script.labelTable)) {
                        console.warn(`jump: "${tgt}" は labelTable に存在しません`);
                        // 存在しない場合は強制終了でも良いし、次に進めても良い
                        return this._onExit();    // ← 任意の安全策
                    }
                    this._pc = this._script.labelTable[tgt];
                    continue;                  // または return this._step();
                }
                case 'exit':
                    //if(!this.thisHideStart){
                    if (this.useExit) {
                        this._onExit();
                    }
                    //}
                    //
                    return;
                default:
                    console.warn('UIEventDialog: unknown op', cmd.operation);
            }
            this._pc++;
            //console.log('UIEventDialog: pc next ', this._pc, 'cmd',script.commands[this._pc].operation);
        }
    }

    _buildDom() {
        this.element.className = 'ui-event-dialog';
        Object.assign(this.element.style, {
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 1000
        });
        const win = document.createElement('div');
        this._winEl = win;
        Object.assign(win.style, {
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%) scale(var(--ed-scale))', // 拡大率反映
            /* 横幅は 600 px を上限に、画面幅が狭ければ 90 % に縮む */
            width: 'min(600px, 90%)',
            /* 高さは内容で自動拡張。画面の 80 % を超えたら中だけスクロール */
            maxHeight: '80vh',
            overflowY: 'auto',
            transition: 'left .25s ease, top .25s ease, transform .25s ease',
            padding: '20px',
            borderRadius: '12px',
            background: 'rgba(0,0,0,.70)',
            backdropFilter: 'blur(4px)',
            color: '#fff',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,.4)'
        });
        this.element.appendChild(win);
        this._titleEl = document.createElement('div');
        this._titleEl.style.fontSize = '2.5rem';
        win.appendChild(this._titleEl);
        this._textEl = document.createElement('p');
        Object.assign(this._textEl.style, {

            margin: '12px 0 24px',
            minHeight: '2em',
            /* 改行文字は尊重しつつ、自動折り返し */
            whiteSpace: 'pre-wrap',
            /* VeryLongWordWithoutSpaces がはみ出さないように */
            wordBreak: 'break-word'
        });
        win.appendChild(this._textEl);
        this._btnArea = document.createElement('div');
        Object.assign(this._btnArea.style, {display: 'flex', justifyContent: 'center', gap: '24px'});
        win.appendChild(this._btnArea);
    }

    async _opPage(cmd) {
        this._titleEl.textContent = this.titleEmoji;
        await this._typeWriter(cmd.text ?? '');
//        await this._repositionIfOverlap();   // ← ここを追加
        this.element.style.pointerEvents = 'auto';
        await new Promise(resolve => {
            const clickHandler = () => {
                this.element.removeEventListener('click', clickHandler);
                this.element.style.pointerEvents = 'none';
                resolve();
            };
            this.element.addEventListener('click', clickHandler);
        });
    }

    async _opDialog(cmd) {
        const mode = cmd.dialogMode ?? 'ok';
        this._btnArea.innerHTML = '';
        await this._repositionIfOverlap();
        this.element.style.pointerEvents = 'auto';
        const makeBtn = (label, value) => {
            const b = document.createElement('button');
            b.textContent = label;
            Object.assign(b.style, {
                padding: '4px 16px',
                fontSize: '1rem',
                cursor: 'pointer',
                border: 'none',
                borderRadius: '6px',
                background: '#444',
                color: '#fff'
            });
            b.onmouseenter = () => b.style.background = '#666';
            b.onmouseleave = () => b.style.background = '#444';
            b.onclick = () => {
                this._lastAnswer = value;   // ★ ここを追加
                this.element.style.pointerEvents = 'none';
                this.onResult(value);
                this._resolveWait();
            };
            this._btnArea.appendChild(b);
        };
        if (mode === 'yesno') {
            makeBtn(textDataTable.get("YES").text, 'yes');
            makeBtn(textDataTable.get("NO").text, 'no');
        } else {
            makeBtn(textDataTable.get("OK").text, 'ok');
        }
        await this._wait();
        this._btnArea.innerHTML = '';
    }

    _opCondition(cmd) {
        let pass;

        /* --- 新フォーマット: items[] ------------- */
        if (Array.isArray(cmd.items)) {
            pass = cmd.items.every(cond => {
                const need = Number(cond.count ?? 0);
                return this.getItemCount(cond.item) >= need;
            });

            /* --- 旧フォーマット ----------------------- */
        } else {
            const have = this.getItemCount(cmd.checkItem);
            pass = have >= (cmd.requiredCount ?? 0);
        }

        this.jumpExecute(pass ? cmd.successPage : cmd.failurePage);
    }

    _opChangeItem(cmd) {
        this.changeItemCount(cmd.item, cmd.delta);
    }

    _onExit() {
        console.log('UIEventDialog: _onExit');
        this.onExit();
        this._dispEnd();
    }

    _dispEnd() {
        console.log('UIEventDialog: _dispEnd');
        this.element.style.opacity = '0';
    }

    _typeWriter(text) {
        return new Promise(res => {
            this._writerResolver = res;
            this._textEl.textContent = '';
            let idx = 0;
            if (this._writerTimer !== null) {
                clearInterval(this._writerTimer);
            }

            this._writerTimer = setInterval(() => {
                console.log('UIEventDialog: typewriter', idx);
                this._textEl.textContent += text[idx++];
                if (idx >= text.length) {
                    clearInterval(this._writerTimer);
                    this._writerTimer = null;
                    this._textEl.onclick = null;
                    res();
                }
            }, this.speed);
            this._textEl.onclick = () => {
                clearInterval(this._writerTimer);
                this._writerTimer = null;
                this._textEl.textContent = text;
                this._textEl.onclick = null;
                res();
            };
        });
    }

    _wait() {
        return new Promise(r => {
            this._waiting = r;
        });
    }

    _resolveWait() {
        if (this._waiting) {
            this._waiting();
            this._waiting = null;
        }
    }

    show() {


        const event = gameMainScene.background.getMapValue("event", gameMainScene.wizard.x, gameMainScene.wizard.y);

        if (event !== null) {
            if (eventDataTable.table.has(event)) {
                const eventData = eventDataTable.get(event);

                if (eventData.type === "event") {

                    this.runFromUrl(eventData.text, {
                        titleEmoji: eventData.titleEmoji,
                        getItemCount: (id) => gameMainScene.wizard.getItemCount(id),
                        changeItemCount: (id, delta) => gameMainScene.wizard.changeItemCount(id, delta)
                    });
                    super.show();
                }
            }
        }

    }


    /** UIStatus と被ったときだけ win を右へずらす */
    _repositionIfOverlap() {
        return new Promise(res => {
            //requestAnimationFrame(() => {
            requestAnimationFrame(() => {   // 2フレーム待機でレイアウト確定
                const statusEl = document.querySelector('.status-element');
                if (!statusEl) {
                    res();
                    return;
                }

                const STATUS_GAP = 16;
                void this._winEl.offsetWidth;    // ★ reflow 強制
                const rStatus = statusEl.getBoundingClientRect();
                const rWin = this._winEl.getBoundingClientRect();

                /* x, y 方向どちらも 1px でも接触していれば overlap と判定 */
                const isOverlap =
                    !(rWin.right < rStatus.left ||
                        rWin.left > rStatus.right ||
                        rWin.bottom < rStatus.top ||
                        rWin.top > rStatus.bottom);

                if (isOverlap) {
                    /* UIStatus の右端＋余白に合わせて再配置 */
                    this._winEl.style.left = `${rStatus.right + STATUS_GAP + window.scrollX}px`;
                    this._winEl.style.top = '50%';
                    this._winEl.style.transform = 'translate(0, -50%) scale(var(--ed-scale))';
                } else {
                    /* 重なっていなければ中央へ戻す */
                    //this._winEl.style.left      = '50%';
                    //this._winEl.style.top       = '50%';
                    //this._winEl.style.transform = 'translate(-50%, -50%)';
                }
                res();
            });
            //});
        });
    }

    /* ======== UIBase.hide() を上書きしてキャンセルも行う ======== */
    hide() {
        console.log('UIEventDialog: hide');
        this._cancelCurrentRun();
        super.hide();
    }
}
