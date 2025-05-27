// Script/Camera.js
import { GameConfig } from './Config.js';

export class Camera{
    /**
     * @param {HTMLElement} worldEl  #game-area 要素（ワールド全体）
     */
    constructor(worldEl){
        this.worldEl = worldEl;
    }

    /**
     * プレイヤーなど追従対象を渡して呼ぶ
     * @param {{x:number, y:number}} target
     */
    update(target){
        const vw = GameConfig.baseWidth;
        const vh = GameConfig.baseHeight;
        const worldW = GameConfig.baseWidth  * GameConfig.renderScale;
        const worldH = GameConfig.baseHeight * GameConfig.renderScale;

        /* プレイヤー中心。ただし端でははみ出さない */
        const camX = Math.max(0, Math.min(target.x - vw/2, worldW - vw));
        const camY = Math.max(0, Math.min(target.y - vh/2, worldH - vh));

        /* ワールド全体を逆方向へ translate してスクロール */
        this.worldEl.style.transform = `translate(${-camX}px, ${-camY}px)`;
    }
}
