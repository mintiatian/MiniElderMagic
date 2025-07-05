/* LoadManagerUI.js — MiniElderMagic (Neo-v5)
 * 画面中央 / Close ボタン / 3 列グリッド / 内部スクロール
 * スロット行に「名前 (vX) 2025-06-17 15:42」のように保存日時を表示
 * + Added global scale variable (opts.scale, CSS var --lm-scale) to resize the
 *   whole UI uniformly. Example: `new LoadManagerUI(parent, sm, {scale:1.3})`
 * -------------------------------------------------------------------- */
import { UIBase }      from '../UI/UIBase.js';
import { SaveManager } from './SaveManager.js';

export class LoadManagerUI extends UIBase {

    /**
     * @param {HTMLElement=} parent               親要素
     * @param {SaveManager}   saveManager         SaveManager instance
     * @param {Object=}       opts                {applyLoadData:Function, startVisible:Boolean, scale:Number}
     */
    constructor(parent = document.body, saveManager, opts = {}) {
        if (!saveManager) throw new Error('LoadManagerUI: saveManager is required');
        super(parent);

        /* ----- スケール ------------------------------------------------ */
        this.scale = opts.scale ?? 3;           // 1 = 100%
        document.documentElement.style.setProperty('--lm-scale', this.scale);

        this.saveManager   = saveManager;
        this.applyLoadData = opts.applyLoadData || function(){};
        this.element.id    = 'load-manager-ui';

        this._injectStyles();
        this._buildDom();
        this._refreshList();

        if (opts.startVisible) this.show();
    }

    /* ---------- Style -------------------------------------------------- */
    _injectStyles(){
        if (document.getElementById('load-manager-ui-style')) return;
        const style = document.createElement('style');
        style.id    = 'load-manager-ui-style';
        style.textContent = `
            :root {
                --lm-scale  : 1;               /* Overwritten by JS per instance */
                --lm-bg     : rgba(31,31,31,.75);
                --lm-fg     : #fafafa;
                --lm-accent : #5ac8fa;
                --lm-danger : #ff4d4f;
                --lm-radius : 10px;
                --lm-gap    : 6px;
                --lm-font   : .78rem;
            }
            #load-manager-ui{
                position:fixed;
                top:50%; left:50%;
                transform:translate(-50%,-50%) scale(var(--lm-scale));
                transform-origin:center center;
                display:none; z-index:9999;
                font-size:var(--lm-font); color:var(--lm-fg);
            }
            #load-manager-ui.show{display:block;}

            .lm-panel{
                width:clamp(360px,50vw,600px); max-height:60vh;
                background:var(--lm-bg);
                border:1px solid rgba(255,255,255,.5);
                border-radius:var(--lm-radius);
                box-shadow:0 3px 12px rgba(0,0,0,.35);
                display:flex; flex-direction:column;
            }
            .lm-header{
                padding:var(--lm-gap); display:flex; align-items:center;
            }
            .lm-header h2{
                margin:0; font-size:.95rem; flex:1 1 auto;
            }
            .lm-body{
                flex:1 1 auto; overflow-y:auto; max-height:180px;
                padding:0 var(--lm-gap) var(--lm-gap);
                display:grid; grid-template-columns:repeat(3,1fr);
                gap:var(--lm-gap);
            }
            .lm-slot{
                background:#2a2a2a; border-radius:var(--lm-radius);
                padding:4px; display:flex; align-items:center; gap:4px;
            }
            .lm-slot__title{
                flex:1 1 auto; font-weight:600; font-size:.78rem;
                overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
            }
            .lm-btn{
                cursor:pointer; padding:2px 6px; border:none; border-radius:4px;
                font-weight:600; font-size:.65rem;
            }
            .lm-btn--accent{background:var(--lm-accent); color:#000;}
            .lm-btn--danger{background:var(--lm-danger); color:#fff;}
            .lm-btn--ghost{
                background:transparent; color:var(--lm-fg);
                border:1px solid var(--lm-fg);
            }`;
        document.head.appendChild(style);
    }

    /* ---------- DOM ---------------------------------------------------- */
    _buildDom(){
        const panel  = this._ce('div','lm-panel', this.element);

        /* Header + Close ------------------------------------------------- */
        const header = this._ce('div','lm-header', panel);
        this._ce('h2','',header,'Load Game');

        const btnClose = this._ce('button','lm-btn lm-btn--ghost',header,'×');
        btnClose.style.width = '32px';
        btnClose.onclick = () => this.hide();

        /* Body ----------------------------------------------------------- */
        this.bodyEl = this._ce('div','lm-body', panel);

        /* Esc で閉じる */
        window.addEventListener('keydown', e=>{
            if (e.key === 'Escape' && this.isVisible) this.hide();
        });
    }

    /* ---------- API (UIBase) ------------------------------------------ */
    show(){ super.show(); this._refreshList(); }
    hide(){ super.hide(); }
    toggle(){ super.toggle(); }

    /* ---------- List --------------------------------------------------- */
    _refreshList(){
        const raw   = this.saveManager.listSlots();
        const slots = Array.isArray(raw) ? raw.slice().reverse()
            : Object.values(raw).reverse();

        this.bodyEl.textContent = '';
        if (!slots.length){
            this._ce('div','',this.bodyEl,'(no saves)');
            return;
        }
        const self = this;
        for (let i=0;i<slots.length;i++){
            const slot = slots[i];
            const row  = this._ce('div','lm-slot',this.bodyEl);

            /* --- バージョン & 日時 ------------------------------------ */
            const latest = (slot.versions && slot.versions.length)
                ? slot.versions[slot.versions.length-1]
                : slot;
            const ver    = latest.version || 0;
            const dateMs = latest.date    || latest.timestamp || 0;
            const dtStr  = dateMs ? this._formatDate(dateMs) : '-';

            this._ce('div','lm-slot__title',row,
                (slot.name||slot.id)+' (v'+ver+') '+dtStr);

            /* --- Load ボタン ------------------------------------------ */
            const bLoad = this._ce('button','lm-btn lm-btn--accent',row,'Load');
            bLoad.onclick = (function(s){
                return function(){
                    const data = self.saveManager.load(s.id||s.name);
                    if (data){ self.applyLoadData(data); self.hide(); }
                    else alert('Load failed');
                };
            })(slot);

            /* --- Delete ボタン ---------------------------------------- */
            const bDel  = this._ce('button','lm-btn lm-btn--danger',row,'Del');
            bDel.onclick = (function(s){
                return function(){
                    if (confirm('Delete?')){
                        self.saveManager.deleteSlot(s.id||s.name);
                        self._refreshList();
                    }
                };
            })(slot);
        }
    }

    /* ---------- helper ------------------------------------------------- */
    _ce(tag,cls,parent,txt){
        const el = document.createElement(tag);
        if (cls) el.className = cls;
        if (txt !== undefined) el.textContent = txt;
        parent.appendChild(el);
        return el;
    }

    _formatDate(ms){
        const d = new Date(ms);
        const z = n => ('0'+n).slice(-2);
        return d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate())+
            ' '+z(d.getHours())+':'+z(d.getMinutes());
    }
}
