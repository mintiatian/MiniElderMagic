
import {Item} from '../Actor/Item.js';
import {FireBall} from '../FireBall.js';
import {CharacterBase} from "./CharacterBase.js";


export class EnemyBase extends CharacterBase {
    constructor(x, y, parentElement,charaData) {
        super(x, y, parentElement,charaData);

        this.parentElement = parentElement;
        this.hasDroppedCoins = false;           // コインをドロップしたかのフラグ

        
        this.lastAttackTime = 0;       // 最後に攻撃した時間


        // プレイヤーへの参照
        this.playerTarget = null;
        
        this.SetupMPGage()
        this.SetupHPGage();
    }

    /**
     * @desc プレイヤーの参照を設定する
     * @param {Wizard} player - プレイヤーオブジェクト
     */
    setPlayerTarget(player) {
        this.playerTarget = player;
    }

    /**
     * @desc 毎フレーム呼び出され、敵の移動を行う
     * ランダム移動の実装
     */
    update(delta) {

        super.update(delta);
        
        // HPが残っている場合のみ動く
        if (this.status.hp > 0) {
            // プレイヤーが設定されている場合、プレイヤーに向かって移動
            if (this.playerTarget) {
                // プレイヤーとの距離を計算
                const dx = this.playerTarget.x - this.x;
                const dy = this.playerTarget.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // 検出半径内にプレイヤーがいる場合
                if (distance < this.enemyAIData.detectionRadius) {
                    // 攻撃範囲内ならば火球を発射
                    if (distance <= this.enemyAIData.attackRange) {
                        // 火球発射を試みる
                        this.fire();

                        // 火球を撃った後も少し距離を保つ
                        if (distance < this.enemyAIData.attacknearRange) {
                            // プレイヤーから離れる
                            const normalizedDx = dx / distance;
                            const normalizedDy = dy / distance;
                            this.x -= normalizedDx * this.MaxSpeed * 0.5;
                            this.y -= normalizedDy * this.MaxSpeed * 0.5;
                        } else {
                            // 攻撃範囲内で維持
                            const normalizedDx = dx / distance;
                            const normalizedDy = dy / distance;
                            this.x += normalizedDx * this.MaxSpeed * 0.2;
                            this.y += normalizedDy * this.MaxSpeed * 0.2;
                        }
                    } else {
                        // 攻撃範囲外ならプレイヤーに向かって移動
                        // 移動方向を正規化
                        const normalizedDx = dx / distance;
                        const normalizedDy = dy / distance;

                        // プレイヤーに向かって移動
                        this.x += normalizedDx * this.MaxSpeed;
                        this.y += normalizedDy * this.MaxSpeed;
                    }
                } else {
                    // プレイヤーが検出範囲外の場合はランダム移動
                    this.x += (Math.random() * 2 - 1) * this.MaxSpeed;
                    this.y += (Math.random() * 2 - 1) * this.MaxSpeed;
                }
            } else {
                // プレイヤーが設定されていない場合はランダム移動
                this.x += (Math.random() * 2 - 1) * this.MaxSpeed;
                this.y += (Math.random() * 2 - 1) * this.MaxSpeed;
            }

        }
        // HPが0以下でまだコインをドロップしていない場合
        else if (this.status.hp <= 0 && !this.hasDroppedCoins) {
            // コインをドロップする
            this.dropCoins();
            this.hasDroppedCoins = true;

        }
        else if (this.status.hp <= 0 && !this.isFadingOut) {
            // フェードアウト
            this.ExitStart();
        }
    }


    /**
     * @desc 敵の周りにコインを配置する
     * @param {number} count - 生成するコインの数（デフォルトは設定値）
     */
    // EnemyBase.js
    dropCoins(count = this.enemyAIData.coinDropCount) {

        const centerX = this.x, centerY = this.y;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 20 + Math.random() * 40;
            const x = centerX + Math.cos(angle) * dist;
            const y = centerY + Math.sin(angle) * dist;
            let item = new Item(x, y, this.parentElement);
        }
    }




    /**
     * @desc 火球を発射する
     * @returns {boolean} 発射に成功したかどうか
     */
    fire() {
        // プレイヤーが存在しないか、敵のHPが0以下なら攻撃しない
        if (!this.playerTarget || this.status.hp <= 0) {
            return false;
        }

        // 現在の時間を取得
        const currentTime = Date.now();

        // クールダウン中なら攻撃しない
        if (currentTime - this.lastAttackTime < this.enemyAIData.attackCooldown) {
            return false;
        }

        // プレイヤーとの距離を計算
        const dx = this.playerTarget.x - this.x;
        const dy = this.playerTarget.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 攻撃範囲内にプレイヤーがいるか確認
        if (distance <= this.enemyAIData.attackRange) {
            // 攻撃時間を更新
            this.lastAttackTime = currentTime;

            // プレイヤーの方向を計算（正規化）
            const normalizedDx = dx / distance;
            const normalizedDy = dy / distance;
            
            this.radian = Math.atan2(normalizedDy, normalizedDx);
            this.Fire(this.status.FireCnt1,this.status.FireCnt2,this.getPosition());

            return true;
        }

        return false;
    }


    SetAIData(enemyAIData) {
        this.enemyAIData = enemyAIData;
    }
}
