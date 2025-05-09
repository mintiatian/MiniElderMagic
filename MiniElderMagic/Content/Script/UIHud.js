
        export class UIHud {
            /**
             * @param {HTMLElement} parentElement - HUDを配置する親要素
             */
            constructor(parentElement) {
        // HUD用のコンテナ要素
        this.container = document.createElement('div');
        this.container.style.position = 'absolute';
        this.container.style.top = '10px';
        this.container.style.left = '10px';
        this.container.style.zIndex = '1000';
        parentElement.appendChild(this.container);
        
        // ステージ表示用の要素
        this.stageElement = document.createElement('div');
        this.stageElement.style.position = 'relative';
        this.stageElement.style.fontSize = '20px';
        this.stageElement.style.color = '#fff';
        this.stageElement.style.userSelect = 'none';
        this.stageElement.style.webkitUserSelect = 'none';
        this.stageElement.style.mozUserSelect = 'none';
        this.stageElement.style.msUserSelect = 'none';
        this.stageElement.style.textShadow = '2px 2px 3px rgba(0, 0, 0, 0.7)';
        this.stageElement.style.margin = '5px';
        this.container.appendChild(this.stageElement);
        
        // コイン表示用の要素
        this.coinElement = document.createElement('div');
        this.coinElement.style.position = 'relative';
        this.coinElement.style.fontSize = '20px';
        this.coinElement.style.color = '#fff';
        this.coinElement.style.userSelect = 'none';
        this.coinElement.style.webkitUserSelect = 'none';
        this.coinElement.style.mozUserSelect = 'none';
        this.coinElement.style.msUserSelect = 'none';
        this.coinElement.style.textShadow = '2px 2px 3px rgba(0, 0, 0, 0.7)';
        // 文字が重ならないように設定
        this.coinElement.style.whiteSpace = 'nowrap';
        this.coinElement.style.overflow = 'visible';
        this.coinElement.style.margin = '5px';
        this.container.appendChild(this.coinElement);
            }
        
            /**
             * @desc HUDの表示を更新する
             * @param {Object} playerStatus - プレイヤーのステータス (coins, stage)
             */
            update(playerStatus) {
        this.stageElement.textContent = `🗺️ ステージ: ${playerStatus.stage}`;
        this.coinElement.textContent = `💰 コイン: ${playerStatus.coins}`;
    }
}