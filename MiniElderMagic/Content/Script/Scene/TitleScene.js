import { BaseScene } from './BaseScene.js';
import { GameMainScene } from './GameMainScene.js';
import { SceneManagerInstance } from './SceneManager.js';   // import して current にアクセス

export class TitleScene extends BaseScene {
    onEnter() {
        /* 背景 */
        this.titleDiv = document.createElement('div');
        this.titleDiv.id = 'title-screen';
        this.titleDiv.style.cssText = `
            position:absolute; inset:0; display:flex; flex-direction:column;
            justify-content:center; align-items:center; color:#fff; font-size:64px;
        `;
        this.titleDiv.innerHTML = `
            <div style="margin-bottom:40px;">🧙 Elder Magic Squad</div>
            <button id="btn-start" style="font-size:32px; padding:12px 60px;">Start</button>
        `;
        this.gameUiLayer.appendChild(this.titleDiv);

        this.titleDiv.querySelector('#btn-start').onclick = () => {
            const ig = new GameMainScene(this.gameArea, this.gameUiLayer);
            SceneManagerInstance.change(ig);     // グローバルに持たせるか DI かはお好みで
        };
    }

    onExit() {
        this.titleDiv.remove();
        this.gameArea.innerHTML = '';   // ゲーム用 DOM を全部リセット
        this.gameUiLayer.innerHTML = '';   // ゲーム用 DOM を全部リセット
    }
}
