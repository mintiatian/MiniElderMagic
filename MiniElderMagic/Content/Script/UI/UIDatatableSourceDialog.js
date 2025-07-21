// UIDatatableSourceDialog.js — MiniElderMagic (v2.1 – profiles + remote‑sample)
// -----------------------------------------------------------------------
//   • Switch between remote / local / custom modes
//   • Edit custom‑remote URL map (JSON)
//   • Save multiple named profiles & load / delete them later
//   • When selecting "custom", preload textarea with *remote* map
// -----------------------------------------------------------------------

import {UIBase} from './UIBase.js';
import {DataTableURLConfig} from '../Utils/DataTableURLConfig.js';

/** localStorage keys */
const LS_PROFILES_KEY = 'MEM_DataTableSrcProfiles';
const LS_SINGLE_KEY   = 'MEM_DataTableSource';      // backward‑compat

/* ------------------------------------------------------------ */
/* ——  Helpers                                                — */
/* ------------------------------------------------------------ */
function loadStore() {
    try { return JSON.parse(localStorage.getItem(LS_PROFILES_KEY)) || {profiles:{}}; }
    catch { return {profiles:{}}; }
}
function saveStore(store) {
    localStorage.setItem(LS_PROFILES_KEY, JSON.stringify(store));
}

/** Deep‑copy helper (JSON stringify) */
function clone(obj){ return JSON.parse(JSON.stringify(obj)); }

/** Fetch pure *remote* map even if current MODE is not remote. */
function getRemoteSample(){
    const prev = DataTableURLConfig.MODE;
    if (prev !== 'remote') DataTableURLConfig.MODE = 'remote';
    const map = clone(DataTableURLConfig.get());
    if (prev !== 'remote') DataTableURLConfig.MODE = prev;
    return map;
}

export class UIDatatableSourceDialog extends UIBase {
    constructor(parentEl){
        super(parentEl);
        this._buildDom();
        this.hide();
    }

    /* -------------------------------------------------------- */
    /* ——  Public API                                         — */
    /* -------------------------------------------------------- */
    show(){
        this.element.style.display = 'flex';
        this._populateFromConfig();
        super.show?.();
    }
    hide(){ this.element.style.display = 'none'; super.hide?.(); }

    /* -------------------------------------------------------- */
    _buildDom(){
        /* ===== Wrapper ===== */
        this.element = document.createElement('div');
        Object.assign(this.element.style,{
            position:'absolute', inset:0, display:'flex', justifyContent:'center',
            alignItems:'center', background:'rgba(0,0,0,.55)', zIndex:10000,
        });

        /* ===== Dialog ===== */
        this.dialog = document.createElement('div');
        this.dialog.className = 'dsdlg-box';
        this.dialog.innerHTML = `
            <h2 style="margin-top:0">Data Source Profiles</h2>
            <div style="margin-bottom:8px;">
                <label>Mode:
                    <select id="dsmode">
                        <option value="remote">remote</option>
                        <option value="local">local</option>
                        <option value="custom">custom</option>
                    </select>
                </label>
            </div>
            <textarea id="dscustom" rows="7" style="width:100%; box-sizing:border-box; font-family:monospace; resize:vertical;"></textarea>
            <hr>
            <div style="display:flex; gap:8px; align-items:center; margin-bottom:8px;">
                <select id="dsprofiles" style="flex:1 1 auto"></select>
                <button id="btn-load">Load</button>
                <button id="btn-del">Delete</button>
            </div>
            <div style="display:flex; gap:8px; align-items:center; margin-bottom:12px;">
                <input id="dsname" placeholder="profile name" style="flex:1 1 auto;">
                <button id="btn-save">Save</button>
            </div>
            <div style="text-align:right;">
                <button id="btn-ok" style="margin-right:8px;">Apply</button>
                <button id="btn-cancel">Cancel</button>
            </div>
        `;
        Object.assign(this.dialog.style,{
            width:'520px', maxWidth:'calc(100% - 24px)', background:'#222', color:'#fafafa',
            padding:'16px 20px', borderRadius:'12px', boxShadow:'0 4px 24px rgba(0,0,0,.6)'
        });
        this.element.appendChild(this.dialog);
        this.parentElement.appendChild(this.element);

        /* UI refs */
        const $ = sel => this.dialog.querySelector(sel);
        this.selMode    = $('#dsmode');
        this.taCustom   = $('#dscustom');
        this.selProfile = $('#dsprofiles');
        this.inName     = $('#dsname');

        /* Events */
        $('#btn-cancel').onclick = () => this.hide();
        $('#btn-ok').onclick     = () => { this._applyCurrent(); this.hide(); };
        $('#btn-load').onclick   = () => this._loadSelectedProfile();
        $('#btn-save').onclick   = () => this._saveProfile();
        $('#btn-del').onclick    = () => this._deleteProfile();
        this.selMode.onchange    = () => this._toggleCustomArea(true);

        /* Init */
        this._refreshProfileList();
        this._toggleCustomArea(false);
        this._injectCSS();
    }

    /* ---------------------- Apply --------------------------- */
    _applyCurrent(){
        const mode = this.selMode.value;
        let custom = {};
        if(mode==='custom'){
            try{ custom = JSON.parse(this.taCustom.value||'{}'); }
            catch(e){ alert('JSON parse error in custom map'); return; }
            DataTableURLConfig.setCustomRemote(custom,false);
        }
        DataTableURLConfig.MODE = mode;
        localStorage.setItem(LS_SINGLE_KEY, JSON.stringify({mode, custom}));
    }

    /* ------------------ Profile ops ------------------------- */
    _saveProfile(){
        const name = (this.inName.value||'').trim();
        if(!name){ alert('Enter profile name'); return; }
        const mode = this.selMode.value;
        let custom = {};
        if(mode==='custom'){
            try{ custom = JSON.parse(this.taCustom.value||'{}'); }
            catch(e){ alert('JSON parse error'); return; }
        }
        const store = loadStore();
        store.profiles[name] = {mode, custom};
        store.last = name;
        saveStore(store);
        this._refreshProfileList(name);
        this.inName.value='';
    }

    _loadSelectedProfile(){
        const name = this.selProfile.value; if(!name) return;
        const p = loadStore().profiles[name]; if(!p) return;
        this.selMode.value = p.mode;
        this.taCustom.value = p.mode==='custom' ? JSON.stringify(p.custom||{},null,2) : '';
        loadStore().last = name;  // update last pointer
        saveStore(loadStore());
        this._toggleCustomArea(false);
    }

    _deleteProfile(){
        const name = this.selProfile.value; if(!name) return;
        if(!confirm(`Delete profile "${name}"?`)) return;
        const store = loadStore();
        delete store.profiles[name];
        if(store.last===name) store.last = undefined;
        saveStore(store);
        this._refreshProfileList();
    }

    /* ------------------ Helpers ----------------------------- */
    _populateFromConfig(){
        this.selMode.value = DataTableURLConfig.MODE;
        if(DataTableURLConfig.MODE==='custom'){
            const cur = DataTableURLConfig.get();
            this.taCustom.value = Object.keys(cur).length ? JSON.stringify(cur,null,2)
                : JSON.stringify(getRemoteSample(),null,2);
        }else{
            this.taCustom.value = '';
        }
        this._toggleCustomArea(false);
    }

    /**
     * @param {boolean} userChanged  true if called from onchange handler
     */
    _toggleCustomArea(userChanged){
        const show = this.selMode.value==='custom';
        this.taCustom.style.display = show ? 'block' : 'none';
        if(show){
            if(!this.taCustom.value.trim() || userChanged){
                // Preload with remote map sample when empty or just switched
                this.taCustom.value = JSON.stringify(getRemoteSample(), null, 2);
            }
        }
    }

    _refreshProfileList(selectName){
        const store = loadStore();
        this.selProfile.innerHTML = '<option value="">(profiles)</option>'+
            Object.keys(store.profiles).map(n=>`<option value="${n}">${n}</option>`).join('');
        if(selectName) this.selProfile.value = selectName;
        else if(store.last) this.selProfile.value = store.last;
    }

    _injectCSS(){
        if(document.getElementById('dsdlg-css')) return;
        const st=document.createElement('style'); st.id='dsdlg-css'; st.textContent=`
            .dsdlg-box button{ background:#5ac8fa; border:none; padding:6px 16px; cursor:pointer; border-radius:6px; color:#000; font-size:14px; }
            .dsdlg-box button:hover{opacity:.85;}
            .dsdlg-box input, .dsdlg-box select{ padding:4px; border-radius:4px; border:1px solid #666; background:#111; color:#fafafa; }
            .dsdlg-box textarea{ background:#111; color:#fafafa; border:1px solid #666; }
        `; document.head.appendChild(st);
    }
}
