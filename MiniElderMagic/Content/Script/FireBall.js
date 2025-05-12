import { attackBase } from './attackBase.js';

export class FireBall extends attackBase {
    constructor(x, y, step, parentElement, attackPower, range, emoji) {
        super(x, y, step, parentElement);
        this.attackPower = attackPower;
        this.range = range;
        this.emoji = emoji;

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

        // ここで当たり判定を行い、当たったら HP を減らして弾を消す
        for (const target of targets) {
            if (this.checkCollision(target)) {
                // キャラクターの HP を減らす
                target.status.takeDamage(this.attackPower);
                // 弾を消す
                this.deactivate();
                break; // 1つ当たれば処理終了
            }
        }

        // 範囲を超えたら非アクティブ化
        if (this.traveled >= this.range) {
            this.deactivate();
        }
    }

    // 弾(element)同士・キャラ(element)同士の単純な衝突判定例
    checkCollision(target) {
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

    deactivate() {
        this.active = false;
        this.element.style.display = 'none';
    }

    updateElementPosition() {
        this.element.style.left = this.x + 'px';
        this.element.style.top = this.y + 'px';
    }
}