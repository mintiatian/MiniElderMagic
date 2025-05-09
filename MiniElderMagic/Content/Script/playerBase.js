import { Character } from './character.js';
import { FireBall } from './FireBall.js';
import {　PlayerStatus　} from "./playerStatus.js";

export class PlayerBase extends Character {
    constructor(x, y, step, emoji, parentElement) {
        super(x, y, step, emoji, parentElement);

        // 攻撃用の配列を追加
        this.attacks = [];

        // 最後に押された移動方向を保持（デフォルトは右方向）
        this.lastDirection = { dx: 1, dy: 0 };

        this.playerstatus = new PlayerStatus(0, 0);

        // 左クリック時、新しい弾を生成して発射する
        document.addEventListener('click', (evt) => {
            // キャラクターの現在位置を初期位置として FireBall を生成
            const newFire = new FireBall(
                this.x,
                this.y,
                this.step,
                parentElement,
                10,      // 攻撃力
                350,     // 飛距離
                '🔥'     // 絵文字
            );
            // 最後に押されたWASDキーの方向に発射
            newFire.fire(this.lastDirection.dx, this.lastDirection.dy);
            this.attacks.push(newFire);
        });
    }

    update() {
        // 移動前の位置を記録
        const prevX = this.x;
        const prevY = this.y;

        // 移動処理 (基本クラスの動き)
        if (this.keys['w']) {
            this.y -= this.step;
            this.updateLastDirection(0, -1);
        }
        if (this.keys['s']) {
            this.y += this.step;
            this.updateLastDirection(0, 1);
        }
        if (this.keys['a']) {
            this.x -= this.step;
            this.updateLastDirection(-1, 0);
        }
        if (this.keys['d']) {
            this.x += this.step;
            this.updateLastDirection(1, 0);
        }
        
        super.update();

        // 配列内の全ての弾を更新 & 使い終わった弾は取り除く例
        this.attacks = this.attacks.filter((fireBall) => {
            fireBall.update();
            // FireBall の active が false になっていれば取り除く
            return fireBall.active;
        });
    }

    // 最後に押された方向を更新するメソッド
    updateLastDirection(dx, dy) {
        this.lastDirection = { dx, dy };
    }
}