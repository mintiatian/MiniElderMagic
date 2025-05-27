import { attackBase } from './attackBase.js';

export class FireBall extends attackBase {
    constructor(x, y, step, parentElement, attackPower, range, emoji) {
        super(x, y, step, parentElement);
        this.attackPower = attackPower || 10; // デフォルト値を設定
        this.range = range || 350;
        this.emoji = emoji || '';
        this.owner = 'player'; // デフォルトはプレイヤー所有
        
        // デバッグ情報 - コンストラクタでの攻撃力を記録
        
        // 表示用DOM要素の作成
        this.element = document.createElement('div');
        this.element.style.position = 'absolute';
        this.element.classList.add('character'); // 共通クラスを利用
        this.element.style.transform = 'translate(-50%, -50%)'; // 中心を基準に配置
        this.element.style.textAlign = 'center';

        this.element.textContent = this.emoji;
        this.parentElement.appendChild(this.element);

        this.traveled = 0;
        this.active = false;
    }

    // 所有者を設定（プレイヤーか敵か）
    setOwner(owner) {
        this.owner = owner;
    }


    // 攻撃力を設定するメソッドを追加
    setAttackPower(power) {
        const oldPower = this.attackPower;
        this.attackPower = power;
    }

    fire(dx, dy) {

        //if (player.status.mp < fireCost) return;
        //player.status.useMP(fireCost);
        
        this.active = true;
        this.dx = dx;
        this.dy = dy;
        this.traveled = 0;
        
        // 要素の表示と位置を更新
        this.element.style.display = 'block'; // 再表示(再発射時用)
        this.updateElementPosition();
        
        // 射撃方向を火球の見た目に反映（親クラスのメソッドを使用）
        if (typeof this.applyDirectionStyle === 'function') {
            this.applyDirectionStyle(this.element, dx, dy);
        }
        
        // 火球のスタイルを追加
        this.element.style.filter = 'drop-shadow(0 0 5px rgba(255, 100, 0, 0.7))';
        
        // 発射エフェクトを生成
        this.createLaunchEffect();
    }

    // ここで「targets(キャラクター配列)」を受け取って衝突チェックする
    update(targets = []) {
        if (!this.active) return;

        // 移動
        const speed = 5;
        
        // 移動前の位置を保存
        const prevX = this.x;
        const prevY = this.y;
        
        // 次の移動位置を計算
        const nextX = this.x + this.dx * speed;
        const nextY = this.y + this.dy * speed;
        
        // 実際に移動した距離を計算（ピタゴラスの定理で計算）
        const distanceMoved = Math.sqrt(
            Math.pow(nextX - prevX, 2) + 
            Math.pow(nextY - prevY, 2)
        );
        
        // 今回の移動で射程を超えるか確認
        const wouldExceedRange = this.traveled + distanceMoved > this.range;
        
        if (wouldExceedRange) {
            // 射程ちょうどの位置を計算
            const remainingDistance = this.range - this.traveled;
            const ratio = remainingDistance / distanceMoved;
            
            // 射程までの正確な位置を計算
            this.x = prevX + (nextX - prevX) * ratio;
            this.y = prevY + (nextY - prevY) * ratio;
            this.traveled = this.range;
        } else {
            // 通常通り移動
            this.x = nextX;
            this.y = nextY;
            this.traveled += distanceMoved;
        }
        
        // 位置を画面に反映
        this.updateElementPosition();
    
        
        

        // ここで当たり判定を行い、当たったら HP を減らして弾を消す
        for (const target of targets) {
            if (this.checkCollision(target)) {
                // 衝突情報の詳細表示
                
                // 重要: ここでtarget.status.takeDamageではなく、target.takeDamageを呼び出す
                if (typeof target.takeDamage === 'function') {
                    target.takeDamage(this.attackPower);
                } else {
                    console.warn(`[FireBall] ターゲットにtakeDamageメソッドがありません。statusから呼び出します`);
                    target.status.takeDamage(this.attackPower);
                }
                
                // 衝突エフェクトを表示
                this.createHitEffect();
                
                // 弾を消す
                this.deactivate();
                break; // 1つ当たれば処理終了
            }
        }

        // 範囲に達したら非アクティブ化（ただし精密な判定のため、わずかな誤差を許容）
        if (this.traveled >= this.range - 0.1 && this.active) {
            // 瞬時に非アクティブフラグをセットして重複処理を防止
            // ただし表示はまだ残す
            this.active = false;
            
            // 実際の座標で射程距離エフェクトを表示して、その後に非表示化
            
            // エフェクト表示 - 完全な非アクティブ化する前に表示
            this.createRangeEndEffect();
            
            // 少し遅延させて完全に非アクティブ化（エフェクトが表示される時間を確保）
            setTimeout(() => {
                this.element.style.display = 'none';
            }, 150); // 50ミリ秒の遅延
        }
    }

    // 弾(element)同士・キャラ(element)同士の単純な衝突判定例
    checkCollision(target) {
        if (!target || !target.element) {
            console.warn(`[FireBall] 無効なターゲット: ${target}`);
            return false;
        }
        
        const bulletRect = this.element.getBoundingClientRect();
        const targetRect = target.element.getBoundingClientRect();

        // 矩形が重なっているかどうかの簡易判定
        const isOverlap =
            bulletRect.left < targetRect.right &&
            bulletRect.right > targetRect.left &&
            bulletRect.top < targetRect.bottom &&
            bulletRect.bottom > targetRect.top;
        
        return isOverlap;
    }

    applyDirectionStyle(element, dx, dy) {
        // 何もしない（回転禁止）
    }

    deactivate() {
        if (!this.active) return;
        this.active = false;
        if (!this.element) return;
        this.element.style.transition = 'opacity .1s ease';
        this.element.style.opacity = '0';
        setTimeout(() => this.element?.remove(), 120);
        this.element = null;
    }
    updateElementPosition() {
        this.element.style.left = this.x + 'px';
        this.element.style.top = this.y + 'px';
    }
    
    // 発射エフェクトを生成
    createLaunchEffect() {
        const effect = document.createElement('div');
        effect.textContent = '✨';
        effect.style.position = 'absolute';
        effect.style.left = `${this.x}px`;
        effect.style.top = `${this.y}px`;
        effect.style.fontSize = '30px';
        effect.style.transform = 'translate(-50%, -50%)';
        effect.style.zIndex = '5';
        
        this.parentElement.appendChild(effect);
        
        effect.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
        
        setTimeout(() => {
            effect.style.transform = 'translate(-50%, -50%) scale(1.5)';
            effect.style.opacity = '0';
        }, 10);
        
        setTimeout(() => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        }, 200);
    }
    
    // 衝突エフェクトを生成するメソッド
    createHitEffect() {
        // 衝突エフェクト用の要素
        const effect = document.createElement('div');
        effect.textContent = '💥';
        effect.style.position = 'absolute';
        effect.style.left = `${this.x}px`;
        effect.style.top = `${this.y}px`;
        effect.style.fontSize = '40px';
        effect.style.transform = 'translate(-50%, -50%)';
        effect.style.zIndex = '6';
        effect.classList.add('cast-effect');   // ★追加
        
        
        // 親要素に追加
        this.parentElement.appendChild(effect);
        
        // エフェクトアニメーション
        effect.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
        
        setTimeout(() => {
            effect.style.transform = 'translate(-50%, -50%) scale(1.5)';
            effect.style.opacity = '0';
        }, 10);
        
        // 一定時間後にエフェクトを削除
        setTimeout(() => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        }, 300);
        
    }
    
    // エフェクト生成中フラグ
    #isCreatingEffect = false;
    
    // 射程終了時のエフェクトを生成するメソッド
    createRangeEndEffect() {
        // 重複防止 - 既にエフェクト生成中なら新たに生成しない
        if (this.#isCreatingEffect) {
            return;
        }
        
        // エフェクト生成中フラグをセット
        this.#isCreatingEffect = true;
        
        // 安全チェック - 親要素があるか確認
        if (!this.parentElement) {
            console.warn('[FireBall] createRangeEndEffect: 親要素が見つかりません');
            this.#isCreatingEffect = false;
            return;
        }
        
        try {
            // メインエフェクト
            const effect = document.createElement('div');
            effect.textContent = '💨';
            effect.style.position = 'absolute';
            effect.style.left = `${this.x}px`;
            effect.style.top = `${this.y}px`;
            effect.style.fontSize = '30px';
            effect.style.transform = 'translate(-50%, -50%)';
            effect.style.zIndex = '5';
            effect.style.opacity = '0'; // 初期状態は透明

            effect.classList.add('cast-effect');
            // 親要素に追加
            this.parentElement.appendChild(effect);
            
            // 追加のパーティクル効果（小さな煙を複数）
            const particles = [];
            for (let i = 0; i < 3; i++) {
                const particle = document.createElement('div');
                particle.textContent = '💨';
                particle.style.position = 'absolute';
                particle.style.left = `${this.x + (Math.random() * 20 - 10)}px`;
                particle.style.top = `${this.y + (Math.random() * 20 - 10)}px`;
                particle.style.fontSize = '20px';
                particle.style.opacity = '0';
                particle.style.transform = 'translate(-50%, -50%) scale(0.6)';
                particle.style.zIndex = '4';
                particle.classList.add('cast-effect');
                this.parentElement.appendChild(particle);
                particles.push(particle);
                
                // パーティクルのアニメーション
                setTimeout(() => {
                    particle.style.transition = 'transform 0.5s ease-out, opacity 0.5s ease-in-out';
                    particle.style.opacity = '0.8';
                    particle.style.transform = `translate(-50%, -50%) scale(0.8) translate(${Math.random() * 20 - 10}px, ${Math.random() * 20 - 10}px)`;
                    
                    setTimeout(() => {
                        particle.style.opacity = '0';
                        particle.style.transform = 'translate(-50%, -50%) scale(0.4)';
                        
                        setTimeout(() => {
                            if (particle.parentNode) {
                                particle.parentNode.removeChild(particle);
                            }
                        }, 500);
                    }, 300);
                }, i * 100);
            }
            
            // メインエフェクトのアニメーション
            setTimeout(() => {
                effect.style.transition = 'transform 0.5s ease-out, opacity 0.5s ease-in-out';
                effect.style.opacity = '1';
                effect.style.transform = 'translate(-50%, -50%) scale(1.2)';
                
                setTimeout(() => {
                    effect.style.opacity = '0';
                    effect.style.transform = 'translate(-50%, -50%) scale(0.5)';
                    
                    // 一定時間後にエフェクトを削除
                    setTimeout(() => {
                        if (effect.parentNode) {
                            effect.parentNode.removeChild(effect);
                        }
                        // すべての処理が完了したらフラグをリセット
                        this.#isCreatingEffect = false;
                    }, 500);
                }, 300);
            }, 10);
            
        } catch (error) {
            console.error('[FireBall] エフェクト生成中にエラーが発生しました:', error);
            this.#isCreatingEffect = false;
        }
    }
}