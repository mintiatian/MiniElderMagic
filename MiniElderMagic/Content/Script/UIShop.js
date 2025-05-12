export class UIShop {
    /**
     * @param {HTMLElement} parentElement - ショップUIを表示する親要素
     * @param {Object} player - プレイヤーオブジェクト
     */
    constructor(parentElement, player) {
        this.parentElement = parentElement;
        this.player = player;
        this.isVisible = false;
        this.shopItems = [
            { name: "MHPを30増やす", cost: 50, effect: this.increaseMHP.bind(this) },
            { name: "攻撃力を5増やす", cost: 50, effect: this.increaseAttack.bind(this) },
            { name: "全回復", cost: 10, effect: this.fullRecover.bind(this) }
        ];
        
        // ショップのコンテナ要素
        this.container = document.createElement('div');
        this.container.classList.add('shop-container');
        this.container.style.position = 'absolute';
        this.container.style.top = '50%';
        this.container.style.left = '50%';
        this.container.style.transform = 'translate(-50%, -50%)';
        this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.container.style.padding = '20px';
        this.container.style.borderRadius = '10px';
        this.container.style.boxShadow = '0 0 15px rgba(255, 215, 0, 0.7)';
        this.container.style.zIndex = '1000';
        this.container.style.display = 'none';
        this.container.style.flexDirection = 'column';
        this.container.style.alignItems = 'center';
        this.container.style.minWidth = '300px';
        
        // ショップのタイトル
        const title = document.createElement('h2');
        title.textContent = 'ショップ';
        title.style.color = 'gold';
        title.style.marginBottom = '20px';
        title.style.fontFamily = 'Arial, sans-serif';
        this.container.appendChild(title);
        
        // コイン表示
        this.coinDisplay = document.createElement('div');
        this.coinDisplay.textContent = `所持コイン: ${this.player.playerstatus.coins}`;
        this.coinDisplay.style.color = 'gold';
        this.coinDisplay.style.marginBottom = '15px';
        this.coinDisplay.style.fontFamily = 'Arial, sans-serif';
        this.container.appendChild(this.coinDisplay);
        
        // 商品リスト
        this.itemList = document.createElement('div');
        this.itemList.style.display = 'flex';
        this.itemList.style.flexDirection = 'column';
        this.itemList.style.gap = '10px';
        this.itemList.style.width = '100%';
        this.container.appendChild(this.itemList);
        
        // 各商品ボタンを作成
        this.shopItems.forEach((item, index) => {
            const itemButton = document.createElement('button');
            itemButton.textContent = `${item.name} - ${item.cost}コイン`;
            itemButton.style.padding = '10px';
            itemButton.style.backgroundColor = 'rgba(70, 70, 70, 0.8)';
            itemButton.style.color = 'white';
            itemButton.style.border = '2px solid gold';
            itemButton.style.borderRadius = '5px';
            itemButton.style.cursor = 'pointer';
            itemButton.style.transition = 'all 0.2s';
            itemButton.style.fontFamily = 'Arial, sans-serif';
            
            itemButton.addEventListener('mouseover', () => {
                itemButton.style.backgroundColor = 'rgba(100, 100, 100, 0.8)';
            });
            
            itemButton.addEventListener('mouseout', () => {
                itemButton.style.backgroundColor = 'rgba(70, 70, 70, 0.8)';
            });
            
            itemButton.addEventListener('click', () => {
                this.purchaseItem(index);
            });
            
            this.itemList.appendChild(itemButton);
        });
        
        this.parentElement.appendChild(this.container);
    }
    
    /**
     * @desc ショップを表示する
     */
    show() {
        this.isVisible = true;
        this.container.style.display = 'flex';
        this.updateCoinDisplay();
    }
    
    /**
     * @desc ショップを非表示にする
     */
    hide() {
        this.isVisible = false;
        this.container.style.display = 'none';
    }
    
    /**
     * @desc コイン表示を更新する
     */
    updateCoinDisplay() {
        this.coinDisplay.textContent = `所持コイン: ${this.player.playerstatus.coins}`;
    }
    
    /**
     * @desc 商品を購入する
     * @param {number} index - 購入する商品のインデックス
     * @returns {boolean} - 購入が成功したかどうか
     */
    purchaseItem(index) {
        const item = this.shopItems[index];
        
        // コインが足りるか確認
        if (this.player.playerstatus.coins >= item.cost) {
            // 効果を適用
            item.effect();
            
            // コインを減らす
            this.player.playerstatus.coins -= item.cost;
            this.updateCoinDisplay();
            
            // 購入成功メッセージ
            this.showMessage(`${item.name}を購入しました！`, 'green');
            
            // ショップを閉じてカウントダウン開始
            setTimeout(() => {
                this.hide();
                this.completeTransaction();
            }, 1000);
            
            return true;
        } else {
            // コイン不足メッセージ
            this.showMessage('コインが足りません！', 'red');
            return false;
        }
    }
    
    /**
     * @desc メッセージを表示する
     * @param {string} text - 表示するメッセージ
     * @param {string} color - メッセージの色
     */
    showMessage(text, color) {
        // 既存のメッセージがあれば削除
        const existingMsg = this.container.querySelector('.shop-message');
        if (existingMsg) {
            existingMsg.remove();
        }
        
        const message = document.createElement('div');
        message.textContent = text;
        message.classList.add('shop-message');
        message.style.color = color;
        message.style.marginTop = '15px';
        message.style.fontWeight = 'bold';
        message.style.fontFamily = 'Arial, sans-serif';
        
        this.container.appendChild(message);
    }
    
    /**
     * @desc 購入完了後の処理（カウントダウン後に次のステージへ）
     */
    completeTransaction() {
        // カウントダウン表示用の要素を作成
        const countdownContainer = document.createElement('div');
        countdownContainer.style.position = 'absolute';
        countdownContainer.style.top = '50%';
        countdownContainer.style.left = '50%';
        countdownContainer.style.transform = 'translate(-50%, -50%)';
        countdownContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        countdownContainer.style.color = 'white';
        countdownContainer.style.padding = '20px';
        countdownContainer.style.borderRadius = '10px';
        countdownContainer.style.fontSize = '36px';
        countdownContainer.style.fontWeight = 'bold';
        countdownContainer.style.zIndex = '2000';
        countdownContainer.style.textAlign = 'center';
        countdownContainer.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.3)';
        
        // カウントダウンテキスト
        const countdownText = document.createElement('div');
        countdownText.textContent = '次のステージまで';
        countdownText.style.marginBottom = '10px';
        countdownText.style.fontSize = '24px';
        
        // カウントダウン数字
        const countdownNumber = document.createElement('div');
        countdownNumber.textContent = '5';
        countdownNumber.style.fontSize = '48px';
        countdownNumber.style.color = 'gold';
        
        // 要素を追加
        countdownContainer.appendChild(countdownText);
        countdownContainer.appendChild(countdownNumber);
        this.parentElement.appendChild(countdownContainer);
        
        // カウントダウン開始
        let count = 5;
        
        const countInterval = setInterval(() => {
            count--;
            countdownNumber.textContent = count.toString();
            
            // カウントが0になったら次のステージへ
            if (count <= 0) {
                clearInterval(countInterval);
                
                // カウントダウン表示を削除
                if (countdownContainer.parentNode) {
                    countdownContainer.parentNode.removeChild(countdownContainer);
                }
                
                // 次のステージへ進む処理を呼び出す
                const event = new CustomEvent('shopCompleted');
                document.dispatchEvent(event);
            }
        }, 1000);
    }
    
    // 各アイテムの効果
    
    /**
     * @desc 最大HPを増やす
     */
    increaseMHP() {
        const currentMaxHP = this.player.status.maxHP;
        this.player.status.setMaxHP(currentMaxHP + 30, true);
        // HPゲージを更新
        this.player.playerHPGage.update(this.player.status.hp, this.player.status.maxHP);
    }
    
    /**
     * @desc 攻撃力を増やす
     */
    increaseAttack() {
        const currentAttack = this.player.status.attack;
        this.player.status.setAttack(currentAttack + 5);
    }
    
    /**
     * @desc HPを全回復する
     */
    fullRecover() {
        const oldHp = this.player.status.hp;
        this.player.status.hp = this.player.status.maxHP;
        // HPゲージを更新
        this.player.playerHPGage.update(this.player.status.hp, this.player.status.maxHP);
        
        // 実際に回復した量を計算して表示
        const healAmount = this.player.status.maxHP - oldHp;
        if (healAmount > 0) {
            this.player.showFloatingText(`+${healAmount}`, 'lightgreen', 3000, -60);
        }
    }
}
