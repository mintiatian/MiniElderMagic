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
            { name: "火球射程を50増やす", cost: 40, effect: this.increaseFireRange.bind(this) },
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
        this.itemList.style.gap = '15px'; // 間隔を広げる
        this.itemList.style.width = '100%';
        this.itemList.style.maxWidth = '400px'; // 最大幅を設定
        this.container.appendChild(this.itemList);
        
        // 各商品ボタンを作成
        this.shopItems.forEach((item, index) => {
            // 商品ボタンのコンテナ
            const itemContainer = document.createElement('div');
            itemContainer.style.position = 'relative';
            itemContainer.style.width = '100%';
            itemContainer.dataset.index = index.toString();
            
            // 商品ボタン
            const itemButton = document.createElement('button');
            itemButton.textContent = `${item.name} - ${item.cost}コイン`;
            itemButton.style.padding = '12px';
            itemButton.style.width = '100%';
            itemButton.style.backgroundColor = 'rgba(70, 70, 70, 0.8)';
            itemButton.style.color = 'white';
            itemButton.style.border = '2px solid gold';
            itemButton.style.borderRadius = '5px';
            itemButton.style.cursor = 'pointer';
            itemButton.style.transition = 'all 0.3s';
            itemButton.style.fontFamily = 'Arial, sans-serif';
            itemButton.style.fontSize = '16px';
            itemButton.style.textAlign = 'center';
            itemButton.style.position = 'relative';
            itemButton.style.zIndex = '1';
            
            // マウスオーバー効果の追加
            itemButton.addEventListener('mouseover', () => {
                itemButton.style.backgroundColor = 'rgba(100, 100, 100, 0.8)';
                itemButton.style.transform = 'translateY(-2px)';
                itemButton.style.boxShadow = '0 5px 10px rgba(0, 0, 0, 0.3)';
            });
            
            itemButton.addEventListener('mouseout', () => {
                itemButton.style.backgroundColor = 'rgba(70, 70, 70, 0.8)';
                itemButton.style.transform = 'translateY(0)';
                itemButton.style.boxShadow = 'none';
            });
            
            itemButton.addEventListener('click', () => {
                this.purchaseItem(index);
            });
            
            itemContainer.appendChild(itemButton);
            this.itemList.appendChild(itemContainer);
        });
        
        this.parentElement.appendChild(this.container);



        // 「何も買わない」ボタン
        const cancelButton = document.createElement('button');
        cancelButton.textContent = '何も買わない';
        cancelButton.style.marginTop = '25px';
        cancelButton.style.padding = '10px 20px';
        cancelButton.style.backgroundColor = 'rgba(100, 100, 100, 0.8)';
        cancelButton.style.color = 'white';
        cancelButton.style.border = '2px solid gray';
        cancelButton.style.borderRadius = '5px';
        cancelButton.style.cursor = 'pointer';
        cancelButton.style.fontFamily = 'Arial, sans-serif';
        cancelButton.style.fontSize = '16px';
        cancelButton.style.transition = 'all 0.3s';

        cancelButton.addEventListener('mouseover', () => {
            cancelButton.style.backgroundColor = 'rgba(130, 130, 130, 0.9)';
            cancelButton.style.transform = 'scale(1.05)';
        });

        cancelButton.addEventListener('mouseout', () => {
            cancelButton.style.backgroundColor = 'rgba(100, 100, 100, 0.8)';
            cancelButton.style.transform = 'scale(1)';
        });

        cancelButton.addEventListener('click', () => {
            this.hide();
            this.showMessage('ショップを閉じました。', 'white');

            // 購入しなかったけど次のステージへ進むための処理（カウントダウン付き）
            this.completeTransaction();
        });

        this.container.appendChild(cancelButton);
    }
    
    /**
     * @desc ショップを表示する
     */
    show() {
        this.isVisible = true;
        this.container.style.display = 'flex';
        this.updateCoinDisplay();

        // ★★★ ここで既存のメッセージを削除しておく ★★★
        const existingMsg = this.container.querySelector('.shop-message');
        if (existingMsg) {
            existingMsg.remove();
        }
        
        // 開くときにアニメーションを追加
        this.container.style.opacity = '0';
        this.container.style.transform = 'translate(-50%, -50%) scale(0.9)';
        this.container.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        
        // リフロー後にアニメーション
        setTimeout(() => {
            this.container.style.opacity = '1';
            this.container.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 50);
        
        // ショップが開いたときに全ての商品ボタンをリセット
        const itemButtons = this.itemList.querySelectorAll('button');
        itemButtons.forEach(button => {
            button.style.opacity = '1';
            button.style.transform = 'scale(1)';
            button.style.backgroundColor = 'rgba(70, 70, 70, 0.8)';
            button.style.border = '2px solid gold';
            button.style.boxShadow = 'none';
            button.style.pointerEvents = 'auto'; // クリック可能に
        });
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
            
            // すべての商品ボタンを取得
            const itemButtons = this.itemList.querySelectorAll('button');
            
            // 選択されなかった商品を非表示にする
            itemButtons.forEach((button, buttonIndex) => {
                if (buttonIndex !== index) {
                    // 選択されなかった商品をフェードアウト
                    button.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                    button.style.opacity = '0';
                    button.style.transform = 'scale(0.8)';
                    button.style.pointerEvents = 'none'; // クリック不可に
                } else {
                    // 選択された商品を強調表示
                    button.style.transition = 'all 0.3s ease';
                    button.style.backgroundColor = 'rgba(50, 120, 50, 0.9)';
                    button.style.border = '2px solid lime';
                    button.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.5)';
                    button.style.transform = 'scale(1.05)';
                    button.style.pointerEvents = 'none'; // クリック不可に
                }
            });
            
            // ショップを閉じてカウントダウン開始
            setTimeout(() => {
                this.hide();
                this.completeTransaction();
                
                // 次回のために全ての商品ボタンをリセット
                setTimeout(() => {
                    itemButtons.forEach(button => {
                        button.style.opacity = '1';
                        button.style.transform = 'scale(1)';
                        button.style.backgroundColor = 'rgba(70, 70, 70, 0.8)';
                        button.style.border = '2px solid gold';
                        button.style.boxShadow = 'none';
                        button.style.pointerEvents = 'auto'; // クリック可能に戻す
                    });
                }, 1000); // ショップが閉じた後に実行
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
     * @desc 火球の射程距離を増やす
     */
    increaseFireRange() {
        const currentRange = this.player.status.fireRange;
            const increaseAmount = 50;
            const newRange = currentRange + increaseAmount;
            
            // ステータスの射程距離を更新
            this.player.status.setFireRange(newRange);
            
            // 詳細なログを出力
            console.log(`[Shop] 火球射程距離を増加: ${currentRange} → ${newRange} (+${increaseAmount})`);
            
            // 確認のため、ユーザーにフィードバックを表示
            this.player.showFloatingText(`火球射程 +${increaseAmount}`, 'orange', 2000, -70);
            
            // 射程距離増加エフェクト（プレイヤーの周りに小さな火球を表示）
            this.createRangeUpgradeEffect(increaseAmount);
        }
        
        /**
         * @desc 射程距離アップグレード時のエフェクトを生成
         * @param {number} amount - 増加した射程距離
         */
        createRangeUpgradeEffect(amount) {
            // プレイヤーの周りに複数の小さな火球エフェクトを表示
            const count = 8; // エフェクトの数
            const radius = 50; // プレイヤーからの距離
            
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 / count) * i;
                const x = this.player.x + Math.cos(angle) * radius;
                const y = this.player.y + Math.sin(angle) * radius;
                
                // エフェクト要素を作成
                const effect = document.createElement('div');
                effect.textContent = '🔥';
                effect.style.position = 'absolute';
                effect.style.left = `${x}px`;
                effect.style.top = `${y}px`;
                effect.style.fontSize = '20px';
                effect.style.transform = 'translate(-50%, -50%) scale(0.5)';
                effect.style.opacity = '0.7';
                effect.style.zIndex = '5';
                
                // 親要素に追加
                this.container.parentElement.appendChild(effect);
                
                // 外側に拡散するアニメーション
                setTimeout(() => {
                    effect.style.transition = `transform 1s ease, opacity 1s ease, left 1s ease, top 1s ease`;
                    const newRadius = radius + 100 + Math.random() * 50;
                    const newX = this.player.x + Math.cos(angle) * newRadius;
                    const newY = this.player.y + Math.sin(angle) * newRadius;
                    
                    effect.style.left = `${newX}px`;
                    effect.style.top = `${newY}px`;
                    effect.style.transform = 'translate(-50%, -50%) scale(0.1)';
                    effect.style.opacity = '0';
                }, i * 50); // 少し遅延させて順番に拡散
                
                // 一定時間後に削除
                setTimeout(() => {
                    if (effect.parentNode) {
                        effect.parentNode.removeChild(effect);
                    }
                }, 1000 + i * 50);
            }
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
