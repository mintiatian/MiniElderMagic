/* ---------------------------------------------------------------------------
 *  GamePad.js – On-Screen Virtual Buttons for Mini Elder Magic
 *
 *  v1.9  (2025-07-05) – «Always-Visible TAB / ATTACK»
 *  ----------------------------------------------------
 *  • hideOnMouse が true でも TAB / ⚔ は常時表示
 *  • hideOnMouse が true かつマウス環境の場合、D-Pad のみ非表示
 *  • それ以外は v1.8 と同等（8-way・スライド切替・オーバーラップ）
 * ------------------------------------------------------------------------ */

export class GamePad {
    constructor(opts = {}) {
        const {
            debug = false,
            hideOnMouse = true,   // ← D-Pad のみ対象
            scale = 1.0,
            emitPointer = true,
            target = document.getElementById('game-area') || document,

            /* ---- D-Pad カスタム ---- */
            dpadScale = 0.75,
            dpadOverlapRatio = 0.4,
            dpadMargin = 12 * scale,
        } = opts;

        this.debug = debug;
        this.scale = scale;
        this.emitPointer = emitPointer;
        this.target = target;

        /* --- D-Pad サイズ計算 --- */
        this.d = 64 * scale * dpadScale;                 // ボタン径
        this.step = this.d * (1 - dpadOverlapRatio);     // ボタン中心間隔
        this.m = dpadMargin;                             // 左下余白

        /* --- マウス環境判定（pointer:coarse ではない = マウス） --- */
        const coarse = window.matchMedia('(pointer: coarse)').matches;
        this.showDpad = !hideOnMouse || coarse;   // true = D-Pad を描画

        this._pressedKeys = new Set();
        this._pressedMouse = false;
        this._ptrMap = new Map();

        this._injectCSS();
        this._buildUI();
    }

    /* ------------------------------------------------------------------ */
    destroy() {
        this.root?.remove();
        this._ov?.remove();
    }

    /* ==========================  CSS  ================================ */
    _injectCSS() {
        if (GamePad._css) return;
        const s = document.createElement('style');
        s.textContent = `
            .gp-btn{position:fixed;display:flex;justify-content:center;align-items:center;
                    font-family:system-ui,sans-serif;font-weight:bold;
                    user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;
                    border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,.4);
                    background:rgba(255,255,255,.25);backdrop-filter:blur(4px);
                    color:#fff;text-shadow:0 0 2px rgba(0,0,0,.8);touch-action:none;}
            .gp-btn:active{background:rgba(255,255,255,.45);}
        `;
        document.head.appendChild(s);
        GamePad._css = s;
    }

    /* =======================  UI 構築 =============================== */
    _buildUI() {
        this.root = document.createElement('div');
        document.body.appendChild(this.root);

        /* ---------- D-Pad (条件付き表示) ----------------------------- */
        if (this.showDpad) {
            const mk = (keys, x, y, label) => {
                const b = this._btn(label, keys, true);   // hideOnMouse=true → マウスなら消える
                b.style.left = `${this.m + x * this.step - this.d / 2}px`;
                b.style.bottom = `${this.m + y * this.step - this.d / 2}px`;
                this.root.appendChild(b);
            };
            mk(['w', 'a'], 0, 2, '⬉');
            mk(['w'], 1, 2, '▲');
            mk(['w', 'd'], 2, 2, '⬈');
            mk(['a'], 0, 1, '◀');
            mk(['d'], 2, 1, '▶');
            mk(['s', 'a'], 0, 0, '⬋');
            mk(['s'], 1, 0, '▼');
            mk(['s', 'd'], 2, 0, '⬊');
        }

        /* ---------- TAB & 攻撃ボタン (常に表示) ---------------------- */
        const base = 64 * this.scale;

        const tab = this._btn('TAB', ['Tab'], false);      // hideOnMouse=false
        Object.assign(tab.style, {
            right: `${16 * this.scale}px`, top: `${16 * this.scale}px`,
            width: `${base * 1.2}px`, height: `${base * 1.2}px`,
            fontSize: `${base * 1.2 * 0.4}px`
        });

        const atk = this._btn('⚔', null, false, 'left');    // hideOnMouse=false
        Object.assign(atk.style, {
            right: `${16 * this.scale}px`, bottom: `${16 * this.scale}px`,
            width: `${base * 1.5}px`, height: `${base * 1.5}px`,
            fontSize: `${base * 1.5 * 0.4}px`
        });
        this.root.appendChild(tab);
        this.root.appendChild(atk);
    }

    _btn(label, keys, hideMouse, mouse) {
        const b = document.createElement('div');
        b.textContent = label;
        let cls = 'gp-btn';
        if (hideMouse) cls += ' gp-hideOnMouse';
        b.className = cls;
        b.style.width = b.style.height = `${this.d}px`;
        b.style.fontSize = `${this.d * 0.38}px`;
        if (keys) b.dataset.keys = keys.join(',');
        if (mouse) b.dataset.mouse = mouse;
        /* pointer イベントをまとめて root へ委譲 */
        this._delegatePointer(b);
        return b;
    }

    /* ========= pointer イベント委譲（スライド切替対応） ========== */
    _delegatePointer(el) {
        const opts = {passive: false, capture: true};
        el.addEventListener('pointerdown', e => {
            const act = this._act(e.target);
            if (!act) return;
            e.preventDefault();
            if (this._ptrMap.has(e.pointerId)) return;
            this._ptrMap.set(e.pointerId, act);
            this._press(act);
            e.target.setPointerCapture?.(e.pointerId);
        }, opts);
        el.addEventListener('pointermove', e => {
            const cur = this._ptrMap.get(e.pointerId);
            if (!cur || cur === 'left' || cur === 'Tab') return;
            const nxt = this._act(document.elementFromPoint(e.clientX, e.clientY));
            if (!nxt || nxt === 'left' || nxt === 'Tab' || this._same(cur, nxt)) return;
            this._release(cur);
            this._ptrMap.set(e.pointerId, nxt);
            this._press(nxt);
        }, opts);
        const up = e => {
            const act = this._ptrMap.get(e.pointerId);
            if (!act) return;
            e.preventDefault();
            this._ptrMap.delete(e.pointerId);
            this._release(act);
        };
        el.addEventListener('pointerup', up, opts);
        el.addEventListener('pointercancel', up, opts);
    }

    /* ------------------- Press / Release --------------------------- */
    _press(act) {
        if (act === 'left') {
            if (this._pressedMouse) return;
            this._mouse('down');
            this._pressedMouse = true;
        } else {
            (Array.isArray(act) ? act : [act]).forEach(k => {
                if (this._pressedKeys.has(k)) return;
                this._key(k, 'down');
                this._pressedKeys.add(k);
            });
        }
        this._dbg(`${Array.isArray(act) ? act.join('+') : act} ↓`);
    }

    _release(act) {
        if (act === 'left') {
            if (!this._pressedMouse) return;
            this._mouse('up');
            this._pressedMouse = false;
        } else {
            (Array.isArray(act) ? act : [act]).forEach(k => {
                if (!this._pressedKeys.has(k)) return;
                this._key(k, 'up');
                this._pressedKeys.delete(k);
            });
        }
        this._dbg(`${Array.isArray(act) ? act.join('+') : act} ↑`);
    }

    /* ---------------- Synthetic Event helpers --------------------- */
    _key(k, dir) {
        const code = {w: 'KeyW', a: 'KeyA', s: 'KeyS', d: 'KeyD', Tab: 'Tab'};
        const kc = {w: 87, a: 65, s: 83, d: 68, Tab: 9};
        const ev = new KeyboardEvent(dir === 'down' ? 'keydown' : 'keyup', {
            bubbles: true, cancelable: true, composed: true, key: k === 'Tab' ? 'Tab' : k, code: code[k]
        });
        Object.defineProperty(ev, 'keyCode', {get: () => kc[k]});
        Object.defineProperty(ev, 'which', {get: () => kc[k]});
        this.target.dispatchEvent(ev);
    }

    _mouse(dir) {
        const type = dir === 'down' ? 'mousedown' : 'mouseup';
        this.target.dispatchEvent(new MouseEvent(type, {
            bubbles: true, cancelable: true, button: 0, buttons: dir === 'down' ? 1 : 0
        }));
        if (this.emitPointer) {
            const ptype = dir === 'down' ? 'pointerdown' : 'pointerup';
            this.target.dispatchEvent(new PointerEvent(ptype, {
                bubbles: true, cancelable: true, pointerType: 'touch', isPrimary: true,
                button: 0, buttons: dir === 'down' ? 1 : 0, pointerId: 9999, width: 1, height: 1
            }));
            if (dir === 'up') {
                this.target.dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true, button: 0}));
            }
        }
    }

    /* ------------- Utilities -------------- */
    _act(el) {
        if (el?.dataset?.mouse) return el.dataset.mouse;
        if (el?.dataset?.keys) return el.dataset.keys.split(',');
        if (el?.dataset?.key) return el.dataset.key;
        return null;
    }

    _same(a, b) {
        const s = v => Array.isArray(v) ? v.join('|') : v;
        return s(a) === s(b);
    }

    /* ------------- Debug overlay ----------- */
    _dbg(msg) {
        if (!this.debug) return;
        if (!this._ov) {
            this._ov = document.createElement('pre');
            Object.assign(this._ov.style, {
                position: 'fixed', left: '4px', top: '4px', zIndex: 99999,
                margin: 0, padding: '4px 6px', background: 'rgba(0,0,0,.5)', color: '#0f0',
                fontSize: '12px', fontFamily: 'monospace', pointerEvents: 'none'
            });
            document.body.appendChild(this._ov);
            this._lines = [];
        }
        const t = new Date().toLocaleTimeString('en-US', {hour12: false});
        this._lines.push(`[${t}] ${msg}`);
        if (this._lines.length > 6) this._lines.shift();
        this._ov.textContent = this._lines.join('\n');
    }
}
