/* SaveManagerUI.js — MiniElderMagic  (rev. “Neo-v19”) ==============================
 * 3 列グリッド / 新規スロットは最上段 / 新しい順表示 / 内部スクロール / 右上固定
 * UIBase の isVisible, show, hide, toggle をそのまま利用（フラグの二重管理なし）
 * ------------------------------------------------------------------------------ */

import { UIBase }                from '../UI/UIBase.js';
import { SceneManagerInstance }   from '../Scene/SceneManager.js';
import { TitleScene }             from '../Scene/TitleScene.js';

/**
 * @param {HTMLElement|Object=} parentOrOpts   親要素 または オプション一式
 * @param {SaveManager=}        saveManager    SaveManager インスタンス
 * @param {Object=}             opts           {getSaveData:Function, startVisible:Boolean,
 *                                             gameArea:HTMLElement, gameUiLayer:HTMLElement}
 */
export class SaveManagerUI extends UIBase {

    constructor(parentOrOpts, saveManager, opts) {
        /* --- 可変長引数を整理（旧 API 互換） -------------------------------- */
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

        this.saveManager  = saveManager;
        this.getSaveData  = opts.getSaveData || function(){ return {}; };
        this.gameArea     = opts.gameArea     || null;   // タイトル復帰用
        this.gameUiLayer  = opts.gameUiLayer  || null;   // タイトル復帰用
        this.element.id   = 'save-manager-ui';           /* 識別用 ID 付与 */
        this._opts        = opts;                        /* _buildDom で利用 */

        this._injectStyles();
        this._buildDom();
        this._refreshList();

        if (opts.startVisible) this.show();
    }

    /* =======================================================================
     *  CSS
     * ===================================================================== */
    _injectStyles() {
        if (document.getElementById('save-manager-ui-style')) return;  // 一度だけ
        var css = `
            :root {
                --sm-bg     : rgba(31,31,31,.75);
                --sm-fg     : #fafafa;
                --sm-accent : #5ac8fa;
                --sm-danger : #ff4d4f;
                --sm-radius : 10px;
                --sm-gap    : 6px;
                --sm-font   : .78rem;
            }
            #save-manager-ui{
    position:fixed; top:10px; left:50%;
    transform:translateX(-50%);
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
                display:flex; justify-content:space-between; align-items:center;
            }
            .sm-header h2{margin:0; font-size:.9rem;}

            .sm-body{
                flex:1 1 auto; overflow-y:auto; max-height:120px;
                padding:0 var(--sm-gap) var(--sm-gap);
                display:grid; grid-template-columns:repeat(3,1fr);
                gap:var(--sm-gap);
            }
            .sm-slot,.sm-new-slot{
                background:#2a2a2a; border-radius:var(--sm-radius);
                padding:4px; display:flex; align-items:center; gap:4px;
            }
            .sm-new-slot{
                border:1px dashed var(--sm-fg); grid-column:1/-1;
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
        `;
        var style = document.createElement('style');
        style.id  = 'save-manager-ui-style';
        style.textContent = css;
        document.head.appendChild(style);
    }

    /* =======================================================================
     *  DOM
     * ===================================================================== */
    _buildDom() {
        var panel  = this._ce('div','sm-panel', this.element);
        var header = this._ce('div','sm-header', panel);

        this._ce('h2','',header,'Save Game');

        /* ----- タイトルに戻る ボタン ------------------------------------ */
        var btnBack = this._ce('button','sm-btn sm-btn--accent',header,'タイトルに戻る');
        btnBack.onclick = () => {
            // gameArea / gameUiLayer が未指定なら DOM から推測
            const area    = this.gameArea    || document.getElementById('game-area');
            const uiLayer = this.gameUiLayer || document.getElementById('game-ui-layer') || document.body;
            SceneManagerInstance.change(new TitleScene(area, uiLayer));
        };

        /* ----- セーブ一覧コンテナ -------------------------------------- */
        this.bodyEl = this._ce('div','sm-body', panel);
    }

    /* =======================================================================
     *  公開 API (UIBase の show/hide/toggle をそのまま使う)
     * ===================================================================== */
    // 追加のコードは不要。UIBase が element.style.display を切り替え、
    // this.isVisible を管理しているため。

    /* =======================================================================
     *  スロット生成
     * ===================================================================== */
    _refreshList(){
        if (typeof this.saveManager.listSlots !== 'function'){
            this.bodyEl.innerHTML = '<p style="opacity:.6">No saves</p>';
            return;
        }
        this.bodyEl.textContent = '';             // クリア

        /* --- Create 行 (最上段) ---------------------------------------- */
        var newRow = this._ce('div','sm-new-slot',this.bodyEl);
        var input  = this._ce('input','sm-input',newRow);
        input.placeholder = 'name';
        var btnCreate = this._ce('button','sm-btn sm-btn--accent',newRow,'Save');
        var self = this;
        btnCreate.onclick = function(){
            var name = input.value.trim();
            if (!name){ alert('Name!'); return; }
            var res  = self.saveManager.save(name, self.getSaveData());
            alert('Saved v'+res.version);
            self._refreshList();
        };

        /* --- 既存スロット (新→旧) ------------------------------------- */
        var raw   = this.saveManager.listSlots();
        var list  = Array.isArray(raw) ? raw.slice() : Object.values(raw);
        list.reverse();
        for (var i=0;i<list.length;i++){
            var s   = list[i];
            var row = this._ce('div','sm-slot',this.bodyEl);

            var title = this._ce('div','sm-slot__title',row,
                (s.name||s.id)+'(v'+( (s.versions && s.versions.length) ? s.versions[s.versions.length-1].version : (s.version||0) )+')'
            );

            var bSave = this._ce('button','sm-btn sm-btn--accent',row,'Save');
            bSave.onclick = (function(slot){
                return function(){
                    var r = self.saveManager.save(slot.id||slot.name, self.getSaveData());
                    alert('Saved v'+r.version);
                    self._refreshList();
                };
            })(s);

            var bDel  = this._ce('button','sm-btn sm-btn--danger',row,'Del');
            bDel.onclick = (function(slot){
                return function(){
                    if (confirm('Delete?')){
                        self.saveManager.deleteSlot(slot.id||slot.name);
                        self._refreshList();
                    }
                };
            })(s);
        }
    }

    /* =======================================================================
     *  ヘルパー
     * ===================================================================== */
    _ce(tag, cls, parent, text){
        var el = document.createElement(tag);
        if (cls)  el.className  = cls;
        if (text!==undefined) el.textContent = text;
        parent.appendChild(el);
        return el;
    }
}
