/* SaveManagerUI.js — MiniElderMagic  (rev. “Neo-v25”)
 * 固定 1 スロット (Save1)・名前入力なし
 * バージョン番号を正しく表示 (v0 → v1 → v2 …)
 * ─────────────────────────────────────────────────────────────────────────── */

import { UIBase }               from '../UI/UIBase.js';
import { SceneManagerInstance } from '../Scene/SceneManager.js';
import { TitleScene }           from '../Scene/TitleScene.js';
import {soundManager} from "../Sound/SoundManager.js";

/**
 * @param {HTMLElement|Object=} parentOrOpts 親要素 または オプション一式
 * @param {SaveManager=}        saveManager  SaveManager インスタンス
 * @param {Object=}             opts         {getSaveData:Function, startVisible:Boolean,
 *                                           gameArea:HTMLElement, gameUiLayer:HTMLElement,
 *                                           scale:Number}
 */
export class SaveManagerUI extends UIBase {

    constructor(parentOrOpts, saveManager, opts) {
        /* --- 可変長引数を整理（旧 API 互換） ---------------------------- */
        if (arguments.length === 1 && parentOrOpts && !parentOrOpts.nodeType) {
            /* new SaveManagerUI({parent, saveManager, ...}) */
            opts         = parentOrOpts;
            parentOrOpts = opts.parent || document.body;
            saveManager  = opts.saveManager;
        }
        parentOrOpts = parentOrOpts || document.body;
        opts         = opts || {};

        if (!saveManager) throw new Error('SaveManagerUI: saveManager is required');

        super(parentOrOpts);                 /* UIBase 初期化 → this.element を生成 */

        /* ----- スケール -------------------------------------------------- */
        this.scale = opts.scale ?? 2;        // 1 = 100%
        document.documentElement.style.setProperty('--sm-scale', this.scale);

        this.saveManager  = saveManager;
        this.getSaveData  = opts.getSaveData || (() => ({}));
        this.gameArea     = opts.gameArea    || null;   // タイトル復帰用
        this.gameUiLayer  = opts.gameUiLayer || null;   // タイトル復帰用
        this.element.id   = 'save-manager-ui';
        this._opts        = opts;

        this._injectStyles();
        this._buildDom();
        this._refreshList();

        if (opts.startVisible) this.show();
    }

    /* ======================================================================
     *  CSS
     * ==================================================================== */
    _injectStyles() {
        if (document.getElementById('save-manager-ui-style')) return;  // 一度だけ
        const css = `
            :root {
                --sm-scale  : 1;
                --sm-bg     : rgba(31,31,31,.75);
                --sm-fg     : #fafafa;
                --sm-accent : #5ac8fa;
                --sm-danger : #ff4d4f;
                --sm-radius : 10px;
                --sm-gap    : 6px;
                --sm-font   : .78rem;
            }
            #save-manager-ui{
                position:fixed;
                top:calc(10px * var(--sm-scale));
                left:50%;
                transform:translateX(-50%) scale(var(--sm-scale));
                transform-origin:top center;
                display:none; z-index:9999;
                font-size:var(--sm-font); color:var(--sm-fg);
            }
            #save-manager-ui.show{display:block;}

            .sm-panel{
                width:clamp(360px,35vw,420px); max-height:40vh;
                background:var(--sm-bg);
                border:1px solid rgba(255,255,255,.5);
                border-radius:var(--sm-radius);
                box-shadow:0 3px 10px rgba(0,0,0,.25);
                display:flex; flex-direction:column;
            }
            .sm-header{
                padding:var(--sm-gap);
                display:flex; align-items:center; gap:var(--sm-gap);
            }
            .sm-header h2{margin:0; font-size:.9rem;}

            .sm-body{
                flex:1 1 auto; overflow-y:auto; max-height:120px;
                padding:0 var(--sm-gap) var(--sm-gap);
                display:grid; grid-template-columns:repeat(1,1fr); /* 1 列 */
                gap:var(--sm-gap);
            }
            .sm-slot{
                background:#2a2a2a; border-radius:var(--sm-radius);
                padding:4px; display:flex; align-items:center; gap:4px;
            }
            .sm-slot__title{
                flex:1 1 auto; font-weight:600; font-size:.78rem;
                overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
            }
            .sm-btn{
                cursor:pointer; padding:2px 6px; border:none; border-radius:4px;
                font-weight:600; font-size:.65rem;
            }
            .sm-btn--accent{background:var(--sm-accent); color:#000;}
            .sm-btn--danger{background:var(--sm-danger); color:#fff;}

            /* === Modal ==================================================== */
            .sm-modal-overlay{
                position:fixed; inset:0;
                width:100vw; height:100vh;
                background:rgba(0,0,0,.5);
                display:flex; justify-content:center; align-items:center;
                z-index:10000;
            }
            .sm-modal{
                background:var(--sm-bg);
                border:1px solid rgba(255,255,255,.5);
                border-radius:var(--sm-radius);
                padding:calc(var(--sm-gap)*2) calc(var(--sm-gap)*2.5);
                min-width:220px; max-width:80vw;
                box-shadow:0 4px 12px rgba(0,0,0,.3);
                display:flex; flex-direction:column; gap:var(--sm-gap);
                font-size:.9rem; color:var(--sm-fg);
            }
            .sm-modal__body{white-space:pre-wrap;}
            .sm-modal__btns{align-self:flex-end; display:flex; gap:var(--sm-gap);}
        `;
        const style = document.createElement('style');
        style.id  = 'save-manager-ui-style';
        style.textContent = css;
        document.head.appendChild(style);
    }

    /* ======================================================================
     *  DOM
     * ==================================================================== */
    _buildDom() {
        const panel  = this._ce('div','sm-panel', this.element);
        const header = this._ce('div','sm-header', panel);

        this._ce('h2','',header,'Save Game');

        /* ----- タイトルに戻る ------------------------------------------ */
        const btnBack = this._ce('button','sm-btn sm-btn--accent',header,'Return to Title');
        btnBack.onclick = () => {
            const area    = this.gameArea    || document.getElementById('game-area');
            const uiLayer = this.gameUiLayer || document.getElementById('game-ui-layer') || document.body;
            
            soundManager.stopBGM();
            
            SceneManagerInstance.change(new TitleScene(area, uiLayer));
        };

        /* ----- セーブ一覧コンテナ -------------------------------------- */
        this.bodyEl = this._ce('div','sm-body', panel);
    }

    /* ======================================================================
     *  スロット生成
     * ==================================================================== */
    _refreshList() {
        if (typeof this.saveManager.listSlots !== 'function'){
            this.bodyEl.innerHTML = '<p style="opacity:.6">No saves</p>';
            return;
        }
        this.bodyEl.textContent = '';

        /* 固定 1 スロット (Save1) */
        const name = 'Save1';
        const list = Array.isArray(this.saveManager.listSlots())
            ? this.saveManager.listSlots()
            : Object.values(this.saveManager.listSlots());

        const slot = list.find(s => (s.name || s.id) === name) || null;

        const row  = this._ce('div','sm-slot',this.bodyEl);

        const latestVer = slot
            ? (slot.versions && slot.versions.length
                ? slot.versions[slot.versions.length - 1].version
                : (slot.version || 0))
            : 0;

        this._ce('div','sm-slot__title',row, `${name} (v ${latestVer})`);

        /* --- Save ------------------------------------------------------- */
        const bSave = this._ce('button','sm-btn sm-btn--accent',row,'Save');
        bSave.onclick = () => {
            const res = this.saveManager.save(name, this.getSaveData());
            this._showInfo('Saved v' + res.version);
            this._refreshList();
        };

        /* --- Delete ----------------------------------------------------- */
        const bDel  = this._ce('button','sm-btn sm-btn--danger',row,'Del');
        if (!slot) {                 // 空スロットなら削除不可
            bDel.disabled = true;
            bDel.style.opacity = 0.4;
        } else {
            bDel.onclick = () => {
                this._showConfirm(`Delete "${name}"?`)
                    .then(ok => {
                        if (!ok) return;
                        this.saveManager.deleteSlot(name);
                        this._refreshList();
                    });
            };
        }
    }

    /* ======================================================================
     *  モーダルダイアログ
     * ==================================================================== */

    /** シンプルな情報用 OK モーダル */
    _showInfo(msg){
        return this._showModal({
            message : msg,
            buttons : [{label:'OK', style:'accent', value:true}]
        });
    }

    /** Yes / No 確認モーダル */
    _showConfirm(msg){
        return this._showModal({
            message : msg,
            buttons : [
                {label:'Yes', style:'accent', value:true},
                {label:'No',  style:'danger', value:false}
            ]
        });
    }

    /**
     * @param {{message:string, buttons:{label:string,style:'accent'|'danger'|'',value:any}[]}} opts
     * @returns {Promise<*>}
     */
    _showModal(opts){
        opts = opts || {};
        const overlay = this._ce('div','sm-modal-overlay',document.body);
        const modal   = this._ce('div','sm-modal',overlay);

        this._ce('div','sm-modal__body',modal, opts.message || '');

        const btnRow = this._ce('div','sm-modal__btns',modal);

        return new Promise(resolve => {
            (opts.buttons || [{label:'OK',style:'accent',value:true}]).forEach(b => {
                const btn = this._ce('button',
                    'sm-btn' + (b.style ? ` sm-btn--${b.style}` : ''),
                    btnRow, b.label);
                btn.onclick = () => {
                    overlay.remove();
                    resolve(b.value);
                };
            });

            /* Escape キーで閉じる */
            const onKey = e => {
                if (e.key === 'Escape'){
                    overlay.remove();
                    document.removeEventListener('keydown', onKey);
                    resolve(false);
                }
            };
            document.addEventListener('keydown', onKey);
        });
    }

    /* ======================================================================
     *  DOM ヘルパー
     * ==================================================================== */
    _ce(tag, cls, parent, text){
        const el = document.createElement(tag);
        if (cls)       el.className   = cls;
        if (text !== undefined) el.textContent = text;
        parent.appendChild(el);
        return el;
    }
}
