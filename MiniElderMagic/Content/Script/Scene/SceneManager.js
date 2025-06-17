
export let SceneManagerInstance = null;

export class SceneManager {
    constructor(gameArea, uiLayer) {
        this.gameArea = gameArea;
        this.uiLayer  = uiLayer;
        this.current  = null;
        this._last = performance.now();
        requestAnimationFrame(this._loop.bind(this));

        SceneManagerInstance = this;
    }

    async change(newScene) {
        this.current?.onExit();   // ← 先に古いシーンを完全に終わらせる
        this.current = newScene;
        this.current.init?.();    // ⬅ 非同期なら await
        this.current.onEnter();
    }

    async changeLoadData(newScene, {saveData=null, loadingEl=null} = {}) {
        await this.current?.onExit?.();

        this.current = newScene;
        loadingEl?.classList.remove('hidden');   // ローディング表示

        await this.current.init?.();

        if (saveData && this.current.importState) {
            this.current.importState(saveData);
        }

        loadingEl?.classList.add('hidden');      // ローディング非表示
        await this.current.onEnter?.();
    }

    _loop(now) {
        const dt = (now - this._last) / 1000;
        this._last = now;
        if (this.current) this.current.update(dt);
        requestAnimationFrame(this._loop.bind(this));
    }
}
