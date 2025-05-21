export class UIShop {
    /**
     * @param {HTMLElement} parentElement - ショップUIを表示する親要素
     * @param {Object} player - プレイヤーオブジェクト
     */
    constructor(parentElement, player) {
        this.isCountingDown = false;      // ← 追加
        this.parentElement = parentElement;
        this.player = player;
        this.isVisible = false;
        this.shopItems = [
            // HP 系
            { name: "最大HPを30増やす", cost: 50, value: 30, effect: () => this.increaseMHP(30) },
            { name: "最大HPを20増やす", cost: 40, value: 20, effect: () => this.increaseMHP(20) },
            { name: "HPを50回復", cost: 30, value: 50, effect: () => this.player.heal(50) },
            { name: "HP全回復", cost: 10, value: null, effect: () => this.fullRecover() },

            // MP 系
            { name: "最大MPを20増やす", cost: 40, value: 20, effect: () => this.player.status.setMaxMP(this.player.status.maxMP + 20) },
            { name: "MPを30回復", cost: 25, value: 30, effect: () => this.player.status.recoverMP(30) },
            { name: "MPを全回復", cost: 15, value: null, effect: () => { this.player.status.mp = this.player.status.maxMP } },

            // 攻撃・火球系
            { name: "攻撃力を5増やす", cost: 50, value: 5, effect: () => this.increaseAttack(5) },
            { name: "攻撃力を3増やす", cost: 30, value: 3, effect: () => this.increaseAttack(3) },
            { name: "火球射程を50増やす", cost: 40, value: 50, effect: () => this.increaseFireRange(50) },
            { name: "火球射程を30増やす", cost: 25, value: 30, effect: () => this.increaseFireRange(30) },

            // 移動系
            { name: "移動速度を0.5上げる", cost: 30, value: 0.5, effect: () => this.player.status.setSpeed(this.player.status.speed + 0.5) },

            // コイン・報酬系
            { name: "コインを20枚手に入れる", cost: 0, value: 20, effect: () => this.player.playerstatus.addCoins(20) },

            // ステージ進行
            { name: "ステージを1スキップ", cost: 70, value: 1, effect: () => this.player.playerstatus.nextStage() },

            // おまけ演出系（遊び要素）
            { name: "✨後光がさす（5秒）", cost: 5, value: null, effect: () => this.player.showFloatingText("✨後光！", 'gold', 5000, -80) }
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


    getRandomShopItems(count = 3) {
        const shuffled = this.shopItems.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    
    /**
     * @desc ショップを表示する
     */
    show() {
        this.isVisible = true;
        this.container.style.display = 'flex';
        this.updateCoinDisplay();

        // メッセージを消去
        const existingMsg = this.container.querySelector('.shop-message');
        if (existingMsg) existingMsg.remove();

        // 商品一覧を一旦クリア
        this.itemList.innerHTML = '';

        // ランダムな3商品を選出
        const selectedItems = this.getRandomShopItems(3);

        selectedItems.forEach((item, index) => {
            const itemContainer = document.createElement('div');
            itemContainer.style.position = 'relative';
            itemContainer.style.width = '100%';
            itemContainer.dataset.index = index.toString();

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
            itemButton.style.fontSize = '16px';
            itemButton.style.fontFamily = 'Arial, sans-serif';
            itemButton.style.textAlign = 'center';

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
                this.purchaseItemDirect(item, itemButton);
            });

            itemContainer.appendChild(itemButton);
            this.itemList.appendChild(itemContainer);
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
    purchaseItemDirect(item, button) {
        if (this.player.playerstatus.coins >= item.cost) {
            item.effect();
            this.player.playerstatus.coins -= item.cost;
            this.updateCoinDisplay();
            this.showMessage(`${item.name}を購入しました！`, 'green');

            // 選ばれなかったボタンをフェード
            const allButtons = this.itemList.querySelectorAll('button');
            allButtons.forEach(b => {
                if (b !== button) {
                    b.style.opacity = '0';
                    b.style.transform = 'scale(0.8)';
                    b.style.pointerEvents = 'none';
                }
            });

            // 購入ボタンは強調
            button.style.backgroundColor = 'rgba(50, 120, 50, 0.9)';
            button.style.border = '2px solid lime';
            button.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.5)';
            button.style.transform = 'scale(1.05)';
            button.style.pointerEvents = 'none';

            // トランザクション完了へ
            setTimeout(() => {
                this.hide();
                this.completeTransaction();
            }, 1000);
        } else {
            this.showMessage('コインが足りません！', 'red');
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
        this.isCountingDown = true;      // ← カウント開始前に立てる
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
                this.isCountingDown = false;   // ← カウント終了で倒す
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
    increaseMHP(amount) {
        const currentMaxHP = this.player.status.maxHP;
        this.player.status.setMaxHP(currentMaxHP + amount, true);
        this.player.playerHPGage.update(this.player.status.hp, this.player.status.maxHP);
    }

    
    /**
     * @desc 攻撃力を増やす
     */
    increaseAttack(amount) {
        const currentAttack = this.player.status.attack;
        this.player.status.setAttack(currentAttack + amount);
    }

    
    /**
     * @desc 火球の射程距離を増やす
     */
    increaseFireRange(amount) {
        const currentRange = this.player.status.fireRange;
        const newRange = currentRange + amount;
        this.player.status.setFireRange(newRange);
        console.log(`[Shop] 火球射程距離を増加: ${currentRange} → ${newRange} (+${amount})`);
        this.player.showFloatingText(`火球射程 +${amount}`, 'orange', 2000, -70);
        this.createRangeUpgradeEffect(amount);
    }
        
    /**
     * @desc 射程距離アップグレード時のエフェクトを生成
     * @param {number} amount - 増加した射程距離
     */s
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
