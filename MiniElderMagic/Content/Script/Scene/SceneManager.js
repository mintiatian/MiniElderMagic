import { soundManager } from '../Sound/SoundManager.js';

export let SceneManagerInstance = null;

/**
 * SceneManager – シーンのライフサイクルと共通オーディオを管理する
 * --------------------------------------------------------------
 *  - soundManager は ESModule のシングルトンをそのまま共有
 *  - init() は一度だけ実行されるガード付き
 *  - onExit / init / onEnter は全て async を許容
 *  - update(dt) の dt は 50ms 上限でクランプ
 */
export class SceneManager {
    /**
     * @param {HTMLElement} gameArea  キャンバスや WebGL コンテナなど
     * @param {HTMLElement} uiLayer   UI を重ねる DOM
     */
    constructor(gameArea, uiLayer) {
        this.gameArea = gameArea;
        this.uiLayer  = uiLayer;

        this.current  = null;
        this._last    = performance.now();
        requestAnimationFrame(this._loop.bind(this));

        /** シーン間で共有するオーディオマネージャ */
        this.audio = soundManager;
        this._inited = false;

        // グローバル参照（デバッグや外部からの操作用）
        SceneManagerInstance = this;
    }

    /**
     * One‑time bootstrap.
     *
     * @param {Object}  [opts]                     - 追加オプション
     * @param {Object}  [opts.firstScene=null]     - 起動直後に入るシーンインスタンス
     * @param {Object}  [opts.saveData=null]       - そのシーンへ渡すセーブデータ
     * @param {HTMLElement} [opts.loadingEl=null]  - ローディング表示要素
     */
    async init({ firstScene = null, saveData = null, loadingEl = null } = {}) {
        if (this._inited) return;           // 二重初期化ガード

        await this.audio.init();            // SE をプリロード
        this._inited = true;

        // 初期シーンへ即遷移したい場合はここで呼ぶ
        if (firstScene) {
            if (saveData) {
                await this.changeLoadData(firstScene, { saveData, loadingEl });
            } else {
                await this.change(firstScene);
            }
        }
    }

    /**
     * 通常シーン遷移
     * @param {Object} newScene  次のシーンインスタンス
     */
    async change(newScene) {
        if (this.current?.onExit) await this.current.onExit();

        this.current = newScene;

        if (this.current?.init)  await this.current.init();
        if (this.current?.onEnter) await this.current.onEnter();
    }

    /**
     * セーブデータを伴うシーン遷移
     */
    async changeLoadData(newScene, { saveData = null, loadingEl = null } = {}) {
        if (this.current?.onExit) await this.current.onExit();

        this.current = newScene;
        loadingEl?.classList.remove('hidden');

        if (this.current?.init) await this.current.init();

        if (saveData && this.current?.importState) {
            await this.current.importState(saveData);
        }

        loadingEl?.classList.add('hidden');
        if (this.current?.onEnter) await this.current.onEnter();
    }

    /**
     * メインループ – requestAnimationFrame にぶら下げる
     */
    _loop(now) {
        const dt = Math.min((now - this._last) / 1000, 0.05); // 50ms 以上は切り捨て（低 fps 安定）
        this._last = now;

        if (this.current?.update) this.current.update(dt);

        requestAnimationFrame(this._loop.bind(this));
    }
}
