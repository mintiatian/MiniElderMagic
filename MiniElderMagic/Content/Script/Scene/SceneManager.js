
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
        if (this.current) {
            await this.current.onExit();
        }
        this.current = newScene;
        await this.current.init();   // 必要ならロード
        await this.current.onEnter();
    }

    _loop(now) {
        const dt = (now - this._last) / 1000;
        this._last = now;
        if (this.current) this.current.update(dt);
        requestAnimationFrame(this._loop.bind(this));
    }
}
