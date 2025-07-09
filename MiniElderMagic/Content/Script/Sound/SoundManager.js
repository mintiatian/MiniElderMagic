/* ---------------------------------------------------------------------------
 *  SoundManager.js – Mini Elder Magic (Generic Audio Manager)
 * ---------------------------------------------------------------------------
 *  - Handles BGM (background music) and SE (sound effects).
 *  - BGM is lazy‑loaded (on first play) and fades out / in on change.
 *  - SE are pre‑loaded into memory and respect a configurable concurrent‑play limit.
 *  - Complies with browser autoplay policies: AudioContext is resumed after
 *    first user gesture (pointer or key). Calls issued before unlock are queued.
 *
 *  2025‑07‑03 updates:
 *    • masterVolume / bgmVolume / seVolume exposed as direct properties
 *    • Per‑SE volume support (static "vol" in SOUND_DEFS + runtime override via setSEVolumeFor)
 * ------------------------------------------------------------------------ */

/* ------------------------------------------------------------------------
 * Pre‑declared audio definitions
 *   tag   : unique string id
 *   type  : "BGM" | "SE"
 *   path  : relative or absolute URL to the audio asset
 *   vol   : (SE only) per‑sound volume multiplier (0‑1, default 1)
 * --------------------------------------------------------------------- */
export const SOUND_DEFS = {
    // BGM ---------------------------------------------------------
    title: { type: 'BGM', path: 'assets/bgm/xDeviruchi-TitleTheme.wav' },
    field: { type: 'BGM', path: 'assets/bgm/xDeviruchi - Exploring The Unknown.wav' },
    town : { type: 'BGM', path: 'assets/bgm/xDeviruchi - And The Journey Begins .wav' },
    boss : { type: 'BGM', path: 'assets/bgm/xDeviruchi - Decisive Battle.wav' },

    // SE (vol = individual multiplier; 1 = 100 %) ----------------
    cursor     : { type: 'SE', path: 'assets/se/normalized/NFF-accept.wav',            vol: 0.3 },
    ok         : { type: 'SE', path: 'assets/se/normalized/NFF-choice-good.wav',       vol: 1.0 },
    cancel     : { type: 'SE', path: 'assets/se/normalized/NFF-cancel-02.wav',         vol: 1.0 },
    fire       : { type: 'SE', path: 'assets/se/normalized/NFF-fireball-02.wav',            vol: 0.3 },
    getitem    : { type: 'SE', path: 'assets/se/normalized/NFF-steal.wav',                  vol: 1.0 },
    getcoin    : { type: 'SE', path: 'assets/se/normalized/NFF-bonus.wav',                vol: 0.2 },
    damage     : { type: 'SE', path: 'assets/se/normalized/NFF-boxing-punch.wav',           vol: 0.3 },
    heal       : { type: 'SE', path: 'assets/se/normalized/NFF-chromatic-rise.wav',         vol: 1.0 },
    buyItem    : { type: 'SE', path: 'assets/se/normalized/NFF-complete.wav',          vol: 1.0 },
    eventInfo  : { type: 'SE', path: 'assets/se/normalized/NFF-blip.wav',          vol: 0.1 },
};

class SoundManager {
    constructor() {
        /** @type {AudioContext|null} */
        this._ctx = null;

        /** Gain nodes */
        this._masterGain = null;
        this._bgmGain = null;
        this._seGain = null;

        /** Volume variables (0‑1, mutable) */
        this._masterVol = 0.5;
        this._bgmVol = 0.3;
        this._seVol = 0.5;

        /* BGM state */
        this._currentBGM = null;
        this._bgmSource = null;
        this._fadeDur = 1000; // ms

        /* SE state */
        this._seBuffers = new Map(); // tag → AudioBuffer
        this._activeSE = []; // currently playing BufferSources
        this._seMax = 8; // concurrent limit
        this._seOverrides = new Map(); // tag → volume override (0‑1)

        /* Autoplay‑policy unlock */
        this._unlocked = false;
        this._queue = []; // functions pending until unlock

        this._loadingBGM = null;    // ← ★追加
        
        // ここでサウンドの再生処理を行う
        const unlock = async () => {
            await this._ensureContext(true);
            document.removeEventListener('pointerdown', unlock);
            document.removeEventListener('keydown', unlock);
            this._unlocked = true;
            for (const fn of this._queue) fn();
            this._queue.length = 0;
        };
        document.addEventListener('pointerdown', unlock, { passive: true, once: true });
        document.addEventListener('keydown', unlock, { passive: true, once: true });

        /* Dynamic volume properties (getter / setter) */
        const defineVol = (prop, getter, setter) => Object.defineProperty(this, prop, {
            enumerable: true,
            get: getter,
            set: v => setter.call(this, v),
        });
        defineVol('masterVolume', () => this._masterVol, this.setMasterVolume);
        defineVol('bgmVolume', () => this._bgmVol, this.setBGMVolume);
        defineVol('seVolume', () => this._seVol, this.setSEVolume);
    }

    /* ==================================================================== */
    /* public API                                                           */
    /* ==================================================================== */

    /** One‑time preload (must be awaited before first use to avoid lag) */
    async init() {
        await this._ensureContext(false); // create context/gain but don't resume

        // Preload all SE buffers
        const seDefs = Object.entries(SOUND_DEFS).filter(([, d]) => d.type === 'SE');
        await Promise.all(
            seDefs.map(async ([tag, def]) => {
                const buf = await this._loadBuffer(def.path);
                this._seBuffers.set(tag, buf);
            })
        );
    }

    /* --------------------- runtime settings ----------------------------- */
    setSEMaxConcurrent(n) { this._seMax = n; }
    setFadeDuration(ms)   { this._fadeDur = ms; }

    /** Set global volumes (0‑1) */
    setMasterVolume(v) { this._masterVol = Math.max(0, v); if (this._masterGain) this._masterGain.gain.value = this._masterVol; }
    setBGMVolume(v)    { this._bgmVol    = Math.max(0, v); if (this._bgmGain)    this._bgmGain.gain.value    = this._bgmVol;    }
    setSEVolume(v)     { this._seVol     = Math.max(0, v); if (this._seGain)     this._seGain.gain.value     = this._seVol;     }

    /** Override volume for a specific SE tag at runtime (0‑1) */
    setSEVolumeFor(tag, vol) {
        if (!(tag in SOUND_DEFS) || SOUND_DEFS[tag].type !== 'SE') {
            console.warn(`[SoundManager] setSEVolumeFor: invalid SE tag «${tag}»`);
            return;
        }
        this._seOverrides.set(tag, Math.max(0, vol));
    }

    /* --------------------- BGM controls --------------------------------- */
    async playBGM(tag, { loop = true } = {}) {
        const action = () => this._doPlayBGM(tag, loop);
        if (!this._unlocked) { this._queue.push(action); return; }
        return action();
    }

    async stopBGM() {
        if (!this._bgmSource) return;
        await this._ensureContext(true);

        const now = this._ctx.currentTime;
        this._bgmGain.gain.cancelScheduledValues(now);
        this._bgmGain.gain.setValueAtTime(this._bgmGain.gain.value, now);
        this._bgmGain.gain.linearRampToValueAtTime(0, now + this._fadeDur / 1000);
        this._bgmSource.stop(now + this._fadeDur / 1000);

        this._bgmSource = null;
        this._currentBGM = null;
    }

    /* --------------------- SE controls ---------------------------------- */
    async playSE(tag) {
        const action = () => this._doPlaySE(tag);
        if (!this._unlocked) { this._queue.push(action); return; }
        return action();
    }

    /* ==================================================================== */
    /* internal helpers                                                     */
    /* ==================================================================== */

    async _ensureContext(resume) {
        if (!this._ctx) {
            this._ctx = new (window.AudioContext || window.webkitAudioContext)();

            this._masterGain = this._ctx.createGain();
            this._bgmGain    = this._ctx.createGain();
            this._seGain     = this._ctx.createGain();

            // initial volumes
            this._masterGain.gain.value = this._masterVol;
            this._bgmGain.gain.value    = this._bgmVol;
            this._seGain.gain.value     = this._seVol;

            this._bgmGain.connect(this._masterGain);
            this._seGain.connect(this._masterGain);
            this._masterGain.connect(this._ctx.destination);
        }
        if (resume && this._ctx.state === 'suspended') {
            await this._ctx.resume();
        }
    }

    async _loadBuffer(url) {
        await this._ensureContext(false);
        const res = await fetch(url);
        const arr = await res.arrayBuffer();
        return new Promise((res, rej) => this._ctx.decodeAudioData(arr, res, rej));
    }


    /* ================================================================== */
    /* internal helpers                                                   */
    /* ================================================================== */
    async _doPlayBGM(tag, loop) {
        // ────────────────────────────────────────────────────────────
        // すでに同じ曲を再生中 or ロード中なら何もしない
        // ────────────────────────────────────────────────────────────
        if (tag === this._currentBGM || tag === this._loadingBGM) return;

        const def = SOUND_DEFS[tag];
        if (!def || def.type !== 'BGM') {
            console.warn(`[SoundManager] BGM tag not found: ${tag}`);
            return;
        }

        // ここからロード開始を宣言
        this._loadingBGM = tag;

        try {
            await this._ensureContext(true);

            const now = this._ctx.currentTime;
            // フェードアウト
            if (this._bgmSource) {
                this._bgmGain.gain.cancelScheduledValues(now);
                this._bgmGain.gain.setValueAtTime(this._bgmGain.gain.value, now);
                this._bgmGain.gain.linearRampToValueAtTime(0, now + this._fadeDur / 1000);
                this._bgmSource.stop(now + this._fadeDur / 1000);
            }

            // バッファ読み込み（await）
            const buffer = await this._loadBuffer(def.path);

            // 新しいソースをセットアップ
            const src = this._ctx.createBufferSource();
            src.buffer = buffer;
            src.loop   = loop;
            src.connect(this._bgmGain);

            // フェードイン
            this._bgmGain.gain.setValueAtTime(0, now + this._fadeDur / 1000);
            this._bgmGain.gain.linearRampToValueAtTime(this._bgmVol, now + this._fadeDur * 2 / 1000);

            src.start(now + this._fadeDur / 1000);
            this._bgmSource  = src;
            this._currentBGM = tag;
        } finally {
            // 必ずロード中フラグを解除
            this._loadingBGM = null;
        }
    }

    async _doPlaySE(tag) {
        const def = SOUND_DEFS[tag];
        if (!def || def.type !== 'SE') {
            console.warn(`[SoundManager] SE tag not found: ${tag}`);
            return;
        }

        await this._ensureContext(true);

        let buf = this._seBuffers.get(tag);
        if (!buf) {
            buf = await this._loadBuffer(def.path);
            this._seBuffers.set(tag, buf);
        }

        // limit concurrent SE
        while (this._activeSE.length >= this._seMax) {
            const oldSrc = this._activeSE.shift();
            try { oldSrc.stop(); } catch {}
        }

        const src = this._ctx.createBufferSource();
        src.buffer = buf;

        // === Per‑sound gain chain ===
        const gainNode = this._ctx.createGain();
        const perVol = (this._seOverrides.get(tag) ?? def.vol ?? 1);
        gainNode.gain.value = perVol;
        src.connect(gainNode);
        gainNode.connect(this._seGain);

        src.start();

        src.onended = () => {
            const idx = this._activeSE.indexOf(src);
            if (idx !== -1) this._activeSE.splice(idx, 1);
        };
        this._activeSE.push(src);
    }

    /* --------------------- manual resume ------------------------------- */
    async resume() {
        await this._ensureContext(true);
        this._unlocked = true;
    }
}

// ----------------------------------------------------------------------
// Singleton export
// ----------------------------------------------------------------------
export const soundManager = new SoundManager();
