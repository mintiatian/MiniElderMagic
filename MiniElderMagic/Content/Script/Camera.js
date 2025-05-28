// Script/Camera.js
import { GameConfig } from './Config.js';

export class Camera {
    /**
     * @param {HTMLElement} worldEl #game-area 要素（ワールド全体）
     */
    constructor(worldEl) {
        this.worldEl = worldEl;

        // ── 追加: ビューポート寸法とカメラ座標を保持 ──
        this.vw   = GameConfig.baseWidth;
        this.vh   = GameConfig.baseHeight;
        this.camX = 0;  // 左上ワールド X
        this.camY = 0;  // 左上ワールド Y
    }

    /**
     * プレイヤーなど追従対象を渡して呼ぶ
     * @param {{x:number, y:number}} target
     */
    update(target) {
        const worldW = GameConfig.baseWidth  * GameConfig.renderScale;
        const worldH = GameConfig.baseHeight * GameConfig.renderScale;

        /* プレイヤー中心。ただし端でははみ出さない */
        this.camX = Math.max(0, Math.min(target.x - this.vw / 2, worldW - this.vw));
        this.camY = Math.max(0, Math.min(target.y - this.vh / 2, worldH - this.vh));

        /* ワールド全体を逆方向へ translate してスクロール */
        this.worldEl.style.transform = `translate(${-this.camX}px, ${-this.camY}px)`;
    }

    /** 現在のビューポート矩形（ワールド座標系）を返す */
    getViewRect() {
        return {
            left:   this.camX,
            top:    this.camY,
            width:  this.vw,
            height: this.vh,
            right:  this.camX + this.vw,   // 便利用 (Optional)
            bottom: this.camY + this.vh,   // 便利用 (Optional)
        };
    }
}
