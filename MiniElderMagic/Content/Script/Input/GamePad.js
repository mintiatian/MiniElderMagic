/* ---------------------------------------------------------------------------
 *  GamePad.js – On-Screen Virtual Buttons for Mini Elder Magic
 *  v2.6-c (2025-07-05) – «Pop-Up D-Pad + Close button»
 * ------------------------------------------------------------------------ */

export class GamePad {
    constructor(opts = {}) {
        const {
            debug = false,
            scale = 1.0,
            emitPointer = true,
            target = document.getElementById('game-area') || document,
            dpadScale = 0.75,
            dpadOverlapRatio = 0.25,
            idleSeconds = 3,
        } = opts;

        this.debug = debug;
        this.scale = scale;
        this.emitPointer = emitPointer;
        this.target = target;

        this.d = 64 * scale * dpadScale;             // 1 ボタン径
        this.step = this.d * (1 - dpadOverlapRatio); // ボタン中心間隔
        this.idleMs = idleSeconds * 1000;

        this._pressedKeys = new Set();
        this._ptrMap      = new Map();   // pointerId → action
        this._dpadRoot    = null;        // D-Pad コンテナ
        this._activePid   = null;        // 操作 pointerId
        this._idleTimer   = null;

        this._injectCSS();
        this._buildStaticUI();           // TAB / ⚔ / ❌
        this._bindGlobalPointer();       // 左半分タッチ検知
    }

    /* ==============  CSS  ============== */
    _injectCSS() {
        if (GamePad._css) return;
        const s = document.createElement('style');
        s.textContent = `
            .gp-btn{position:fixed;display:flex;justify-content:center;align-items:center;
                    font:700 ${14*this.scale}px/1 system-ui,sans-serif;
                    user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;
                    border-radius:50%;background:rgba(255,255,255,.25);
                    backdrop-filter:blur(4px);color:#fff;
                    text-shadow:0 0 2px rgba(0,0,0,.8);touch-action:none;}
            .gp-btn:active{background:rgba(255,255,255,.45);}
        `;
        document.head.appendChild(s);
        GamePad._css = s;
    }

    /* ===== TAB / ⚔ / ❌ 常設 UI ===== */
    _buildStaticUI() {
        this.root = document.createElement('div');
        document.body.appendChild(this.root);

        const base = 64 * this.scale;

        /* TAB */
        const tab = this._btn('TAB', ['Tab']);
        Object.assign(tab.style,{
            right:`${16*this.scale}px`, top:`${16*this.scale}px`,
            width:`${base*1.2}px`, height:`${base*1.2}px`,
            fontSize:`${base*1.2*0.4}px`
        });

        /* ─ TAB pointer（keydown/up 合成） ─*/
            tab.addEventListener('pointerdown', e=>{
                    if (this._tabDown) return;
                    e.preventDefault();
                    e.stopPropagation();              // window へバブリングさせない
                    tab.setPointerCapture(e.pointerId);
                    this._emitKey('Tab','keydown');   // ★ 合成
                    this._tabDown = true;
                },{passive:false});
        const tabEnd = e=>{
                if (!this._tabDown) return;
                e.preventDefault();
                this._emitKey('Tab','keyup');     // ★ 合成
                this._tabDown = false;
                tab.releasePointerCapture(e.pointerId);
            };
        tab.addEventListener('pointerup',     tabEnd,{passive:false});
        tab.addEventListener('pointercancel', tabEnd,{passive:false});
        
        
        /* ATTACK (mouse left) */
        const atk = this._btn('⚔', null, 'left');
        Object.assign(atk.style,{
            right:`${16*this.scale}px`, bottom:`${16*this.scale}px`,
            width:`${base*1.5}px`, height:`${base*1.5}px`,
            fontSize:`${base*1.5*0.4}px`
        });

        /* ❌ CLOSE button (left-bottom) */
        const cls = this._btn('❌');
        cls.dataset.close = 'true';
        Object.assign(cls.style,{
            left:`${16*this.scale}px`, bottom:`${16*this.scale}px`,
            width:`${base}px`, height:`${base}px`,
            fontSize:`${base*0.5}px`
        });
        /* D-Pad を消す */
        cls.addEventListener('pointerdown', e=>{
            e.preventDefault();
            this._removeDpad();
        });

        this.root.appendChild(tab);
        this.root.appendChild(atk);
        this.root.appendChild(cls);
    }

    /* ======= グローバル pointer ======= */
    _bindGlobalPointer() {
        /*
        const resetIdle = () => {
            clearTimeout(this._idleTimer);
            this._idleTimer = setTimeout(() => this._removeDpad(), this.idleMs);
        };
        */

        window.addEventListener('pointerdown', e=>{
            if(e.pointerType!=='touch' || e.clientX>innerWidth/2) return;
            if(e.target.dataset.close) return;        // ❌ は除外

            if(!this._dpadRoot) this._spawnDpad(e.clientX,e.clientY);
            this._activePid = e.pointerId;

            /* 1 フレーム待って初回キー確定 */
            requestAnimationFrame(()=>{
                if(this._activePid===e.pointerId){
                    this._updateActive(e.clientX,e.clientY);
                }
            });
            //resetIdle();
        },{ passive:false });

        window.addEventListener('pointermove', e=>{
            if(e.pointerType!=='touch' || e.clientX>innerWidth/2) return;
            if(e.pointerId!==this._activePid) return;
            this._updateActive(e.clientX,e.clientY);
        },{ passive:true });

        window.addEventListener('pointerup', e=>{
            if(e.pointerType!=='touch' || e.clientX>innerWidth/2) return;
            if(e.pointerId!==this._activePid) return;
            const act=this._ptrMap.get(e.pointerId);
            if(act){ this._release(act); this._ptrMap.delete(e.pointerId); }
            this._activePid=null;
        },{ passive:true });

        /* idle タイマー更新 */
        /*
        ['pointerdown','pointermove','pointerup'].forEach(ev=>{
            window.addEventListener(ev, evv=>{
                if(evv.pointerType!=='touch'||evv.clientX>innerWidth/2) return;
                if(this._dpadRoot) resetIdle();
            },{ passive:true });
        });
        */
    }

    /* =========== D-Pad 生成 / 解除 =========== */
    _spawnDpad(cx,cy){
        this._removeDpad();
        this._dpadRoot=document.createElement('div');
        this.root.appendChild(this._dpadRoot);

        const add=(keys,label,dx,dy)=>{
            const b=this._btn(label,keys);
            b.style.left=`${cx+dx-this.d/2}px`;
            b.style.top =`${cy+dy-this.d/2}px`;
            this._dpadRoot.appendChild(b);
        };
        add(['w','a'],'⬉',-this.step,-this.step);
        add(['w'],    '▲', 0,        -this.step);
        add(['w','d'],'⬈', this.step,-this.step);
        add(['a'],    '◀',-this.step, 0);
        add(['d'],    '▶', this.step, 0);
        add(['s','a'],'⬋',-this.step, this.step);
        add(['s'],    '▼', 0,         this.step);
        add(['s','d'],'⬊', this.step,  this.step);
    }
    _removeDpad(){
        if(!this._dpadRoot) return;
        this._pressedKeys.forEach(k=>this._emitKey(k,'keyup'));
        this._pressedKeys.clear();
        this._ptrMap.clear();
        this._activePid=null;
        this._dpadRoot.remove(); this._dpadRoot=null;
    }

    /* ==== 指の位置 → アクション更新 ==== */
    _updateActive(x,y){
        if(!this._dpadRoot) return;
        const el=document.elementFromPoint(x,y);
        const act=this._act(el);
        const pid=this._activePid;
        const cur=this._ptrMap.get(pid);
        if(this._same(cur,act)) return;

        if(cur){ this._release(cur); this._ptrMap.delete(pid); }
        if(act){ this._press(act);   this._ptrMap.set(pid,act);}
    }

    /* ============ ボタン生成 ============ */
    _btn(label,keys=null,mouse=null){
        const b=document.createElement('div');
        b.textContent=label; b.className='gp-btn';
        b.style.width=b.style.height=`${this.d}px`;
        b.style.fontSize=`${this.d*0.38}px`;
        if(keys)  b.dataset.keys=keys.join(',');
        if(mouse) b.dataset.mouse=mouse;
        return b;
    }

    /* ======= PRESS / RELEASE ======= */
    _press(act){
        (Array.isArray(act)?act:[act]).forEach(k=>{
            if(this._pressedKeys.has(k)) return;
            this._emitKey(k,'keydown'); this._pressedKeys.add(k);
        });
    }
    _release(act){
        (Array.isArray(act)?act:[act]).forEach(k=>{
            if(!this._pressedKeys.has(k)) return;
            this._emitKey(k,'keyup'); this._pressedKeys.delete(k);
        });
    }

    /* ==== Synthetic Key Event ==== */
    _emitKey(k,type){
        const code={w:'KeyW',a:'KeyA',s:'KeyS',d:'KeyD',Tab:'Tab'};
        const kc  ={w:87,a:65,s:83,d:68,Tab:9};
        const ev=new KeyboardEvent(type,{bubbles:true,cancelable:true,composed:true,
            key:k==='Tab'?'Tab':k,code:code[k]});
        Object.defineProperty(ev,'keyCode',{get:()=>kc[k]});
        Object.defineProperty(ev,'which'  ,{get:()=>kc[k]});
        this.target.dispatchEvent(ev);
    }

    /* ========= Utilities ========= */
    _act(el){
        if(el?.dataset?.mouse) return el.dataset.mouse;
        if(el?.dataset?.keys)  return el.dataset.keys.split(',');
        return null;
    }
    _same(a,b){
        const s=v=>Array.isArray(v)?v.join('|'):v;
        return s(a)===s(b);
    }
    _log(m){ if(this.debug) console.log('[GamePad]',m); }
}
