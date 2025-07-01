/* ---------------------------------------------------------------------------
 *  SoundManager.js – Mini Elder Magic (Generic Audio Manager)
 *
 *  - Handles BGM (background music) and SE (sound effects).
 *  - BGM is lazy‑loaded (on first play) and fades out / in on change.
 *  - SE are pre‑loaded into memory and respect a configurable concurrent‑play limit.
 *
 *  Usage:
 *      import { soundManager, SOUND_DEFS } from "./SoundManager.js";
 *      await soundManager.init();
 *      soundManager.playBGM("field");
 *      soundManager.playSE("cursor");
 *
 *  Edit SOUND_DEFS below to add / change your own audio files.
 * ------------------------------------------------------------------------ */

/*
 * Pre‑declared audio definitions
 *   tag  : unique string id
 *   type : "BGM" | "SE"
 *   path : relative or absolute URL to the audio asset
 */
export const SOUND_DEFS = {
    // BGM ---------------------------------------------------------
    title:       { type: "BGM", path: "assets/bgm/xDeviruchi-TitleTheme.wav" },
    field:       { type: "BGM", path: "assets/bgm/xDeviruchi-TitleTheme.wav" },
    town:        { type: "BGM", path: "assets/bgm/xDeviruchi - And The Journey Begins .wav" },
    boss:        { type: "BGM", path: "assets/bgm/xDeviruchi-TitleTheme.wav" },

    // SE ----------------------------------------------------------
    cursor:      { type: "SE",  path: "assets/se/interfaces-and-media/NFF-accept.wav" },
    ok:          { type: "SE",  path: "assets/se/interfaces-and-media/NFF-accept.wav" },
    cancel:      { type: "SE",  path: "assets/se/interfaces-and-media/NFF-accept.wav" },
    explosion:   { type: "SE",  path: "assets/se/interfaces-and-media/NFF-accept.wav" }
};

class SoundManager {
    constructor() {
        /** @type {AudioContext|null} */
        this._ctx         = null;
        this._masterGain  = null;
        this._bgmGain     = null;
        this._seGain      = null;

        // BGM 状態
        this._currentBGM  = null;
        this._bgmSource   = null;
        this._fadeDur     = 1000;      // ms

        // SE 状態
        this._seBuffers   = new Map(); // tag → AudioBuffer
        this._activeSE    = [];        // 再生中の BufferSource
        this._seMax       = 8;

        // Chrome などの自動再生制限を突破するためのフラグ
        this._unlocked = false;
        this._queue    = [];   // アンロック前に呼ばれた再生要求を保持

        // ユーザー操作を捕まえて context を resume
        const unlock = async () => {
            await this._ensureContext(true);   // create + resume if suspended
            document.removeEventListener('pointerdown', unlock);
            document.removeEventListener('keydown',     unlock);
            this._unlocked = true;
            // キューされていた再生処理を実行
            for (const fn of this._queue) fn();
            this._queue.length = 0;
        };
        document.addEventListener('pointerdown', unlock, { passive: true, once: true });
        document.addEventListener('keydown',     unlock, { passive: true, once: true });
    }

    /* ====================================================================== */
    /* public API                                                             */
    /* ====================================================================== */

    async init() {
        await this._ensureContext(false);          // context & gain 作成（resume はしない）

        // 事前に SE をロードして待ち時間をゼロに（BGM は都度 fetch で OK）
        const seDefs = Object.entries(SOUND_DEFS).filter(([, def]) => def.type === 'SE');
        await Promise.all(seDefs.map(async ([tag, def]) => {
            const buf = await this._loadBuffer(def.path);
            this._seBuffers.set(tag, buf);
        }));
    }

    /* --------------------- 再生設定 -------------------------------------- */
    setSEMaxConcurrent(n) { this._seMax = n; }
    setFadeDuration(ms)   { this._fadeDur = ms; }

    setMasterVolume(v) { if (this._masterGain) this._masterGain.gain.value = v; }
    setBGMVolume(v)   { if (this._bgmGain)    this._bgmGain.gain.value   = v; }
    setSEVolume(v)    { if (this._seGain)     this._seGain.gain.value    = v; }

    /* --------------------- BGM ------------------------------------------- */
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

    /* --------------------- SE -------------------------------------------- */
    async playSE(tag) {
        const action = () => this._doPlaySE(tag);
        if (!this._unlocked) { this._queue.push(action); return; }
        return action();
    }

    /* ====================================================================== */
    /* internal helpers                                                      */
    /* ====================================================================== */

    async _ensureContext(resume) {
        if (!this._ctx) {
            this._ctx = new (window.AudioContext || window.webkitAudioContext)();
            // Master → BGM / SE → destination
            this._masterGain = this._ctx.createGain();
            this._bgmGain    = this._ctx.createGain();
            this._seGain     = this._ctx.createGain();

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

    async _doPlayBGM(tag, loop) {
        if (tag === this._currentBGM) return;          // 同一曲は無視
        const def = SOUND_DEFS[tag];
        if (!def || def.type !== 'BGM') {
            console.warn(`[SoundManager] BGM tag not found: ${tag}`);
            return;
        }

        await this._ensureContext(true);

        // フェードアウト現 BGM
        const now = this._ctx.currentTime;
        if (this._bgmSource) {
            this._bgmGain.gain.cancelScheduledValues(now);
            this._bgmGain.gain.setValueAtTime(this._bgmGain.gain.value, now);
            this._bgmGain.gain.linearRampToValueAtTime(0, now + this._fadeDur / 1000);
            this._bgmSource.stop(now + this._fadeDur / 1000);
        }

        const buffer = await this._loadBuffer(def.path);
        const src    = this._ctx.createBufferSource();
        src.buffer = buffer;
        src.loop   = loop;
        src.connect(this._bgmGain);

        // フェードイン
        this._bgmGain.gain.setValueAtTime(0, now + this._fadeDur / 1000);
        this._bgmGain.gain.linearRampToValueAtTime(1, now + this._fadeDur * 2 / 1000);

        src.start(now + this._fadeDur / 1000);
        this._bgmSource  = src;
        this._currentBGM = tag;
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

        // 同時再生数制限
        while (this._activeSE.length >= this._seMax) {
            const src = this._activeSE.shift();
            try { src.stop(); } catch {}
        }

        const src = this._ctx.createBufferSource();
        src.buffer = buf;
        src.connect(this._seGain);
        src.start();

        src.onended = () => {
            const idx = this._activeSE.indexOf(src);
            if (idx !== -1) this._activeSE.splice(idx, 1);
        };
        this._activeSE.push(src);
    }

    /* --------------------- external unlock hook --------------------------- */
    /**
     * 任意のクリックハンドラ内で呼べば即 resume + キュー解放
     */
    async resume() {
        await this._ensureContext(true);
        this._unlocked = true;
    }
}

// -------------------------------------------------------
// シングルトンエクスポート
// -------------------------------------------------------
export const soundManager = new SoundManager();
