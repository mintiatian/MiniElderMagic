import { attackBase } from './attackBase.js';

export class FireBall extends attackBase {
    constructor(x, y, step, parentElement, attackPower, range, emoji) {
        super(x, y, step, parentElement);
        this.attackPower = attackPower;
        this.range = range;
        this.emoji = emoji;

        // デバッグ情報
        console.log(`[FireBall] 生成: attack=${attackPower}, range=${range}, emoji=${emoji}`);

        // 表示用DOM要素の作成
        this.element = document.createElement('div');
        this.element.style.position = 'absolute';
        //this.element.style.fontSize = '30px';
        this.element.classList.add('character'); // 共通クラスを利用
        this.element.style.transform = 'translate(-50%, -50%)'; // 中心を基準に配置
        this.element.style.textAlign = 'center';

        this.element.textContent = this.emoji;
        this.parentElement.appendChild(this.element);

        this.traveled = 0;
        this.active = false;
    }

    fire(dx, dy) {
        this.active = true;
        this.dx = dx;
        this.dy = dy;
        this.traveled = 0;
        this.updateElementPosition();
        this.element.style.display = 'block'; // 再表示(再発射時用)
        console.log(`[FireBall] 発射: 方向(${dx.toFixed(2)}, ${dy.toFixed(2)}), 位置(${this.x.toFixed(0)}, ${this.y.toFixed(0)})`);
    }

    // ここで「targets(キャラクター配列)」を受け取って衝突チェックする
    update(targets = []) {
        if (!this.active) return;

        // 移動
        const speed = 5;
        this.x += this.dx * speed;
        this.y += this.dy * speed;
        this.traveled += speed;
        this.updateElementPosition();

        // デバッグ：ターゲット数の表示（頻度を下げるため100pxごと）
        if (this.traveled % 100 < 5) {
            console.log(`[FireBall] 更新: 移動距離=${this.traveled.toFixed(0)}, ターゲット数=${targets.length}`);
        }

        // ここで当たり判定を行い、当たったら HP を減らして弾を消す
        for (const target of targets) {
            if (this.checkCollision(target)) {
                console.log(`[FireBall] 衝突検知: ターゲット=${target.emoji}, 攻撃力=${this.attackPower}`);
                
                // 重要: ここでtarget.status.takeDamageではなく、target.takeDamageを呼び出す
                if (typeof target.takeDamage === 'function') {
                    console.log(`[FireBall] takeDamageメソッドを直接呼び出します`);
                    target.takeDamage(this.attackPower);
                } else {
                    console.warn(`[FireBall] ターゲットにtakeDamageメソッドがありません。statusから呼び出します`);
                    target.status.takeDamage(this.attackPower);
                }
                
                // ターゲットのHP確認
                console.log(`[FireBall] 攻撃後のターゲットHP: ${target.status.hp}/${target.status.maxHP}`);
                
                // 弾を消す
                this.deactivate();
                console.log(`[FireBall] 衝突により非アクティブ化`);
                break; // 1つ当たれば処理終了
            }
        }

        // 範囲を超えたら非アクティブ化
        if (this.traveled >= this.range) {
            console.log(`[FireBall] 射程(${this.range})を超えたため非アクティブ化`);
            this.deactivate();
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

        if (isOverlap) {
            console.log(`[FireBall] 衝突判定: 成功 - 弾(${bulletRect.left},${bulletRect.top}) ターゲット(${targetRect.left},${targetRect.top})`);
        }
        
        return isOverlap;
    }

    deactivate() {
        this.active = false;
        this.element.style.display = 'none';
    }

    updateElementPosition() {
        this.element.style.left = this.x + 'px';
        this.element.style.top = this.y + 'px';
    }
    
    // 衝突エフェクトを生成するメソッドを追加
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
        
        console.log(`[FireBall] 衝突エフェクト生成: 位置(${this.x.toFixed(0)}, ${this.y.toFixed(0)})`);
    }
}