import {Item} from '../Actor/Item.js';
import {FireBall} from '../FireBall.js';
import {CharacterBase} from "./CharacterBase.js";
import {EventEmitterMixin} from "../Base/EventEmitterMixin.js";


export class EnemyBase extends EventEmitterMixin(CharacterBase) {
    constructor(x, y, parentElement, charaData) {
        super(x, y, parentElement, charaData);

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

    /*  ── コンストラクタ側に追加しておくプロパティ ─────────────
    constructor(...) {
        ...
        this._hasBarrier   = false;  // いまバリアを張っているか
        this._barrierTimer = 0;      // 残り存続秒 (0 で未発動)
    }
    */

    update(delta) {
        super.update(delta);

        /* バリアの生存時間を監視 ★──────────────── */
        if (this._hasBarrier) {
            this._barrierTimer -= delta;
            if (this._barrierTimer <= 0) {
                this.RemoveBarrier();
                this._hasBarrier = false;
            }
        }

        /* ──── 行動決定用の変数初期化 ────── */
        let accel  = 0;
        let strafe = 0;
        let rad    = this.radian;

        /* HP が残っている & ターゲットがいる場合 ───── */
        if (this.status.hp > 0 && this.playerTarget) {

            const dx   = this.playerTarget.x - this.x;
            const dy   = this.playerTarget.y - this.y;
            const dist = Math.hypot(dx, dy);

            /* ★ バリア発動判定 ──────────────────── */
            if (dist < this.enemyAIData.detectionRadius) {
                // まだ張っていない & 乱数 10 % で AddBarrier
                if (!this._hasBarrier && Math.random() < 0.01 && this.status.hp/this.status.maxHP<0.1) {
                    this.AddBarrier();
                    this._hasBarrier   = true;
                    this._barrierTimer = 2000;   // 2 秒で自動解除
                }
            }

            /* ------- 以下、移動 & 攻撃 AI は前と同じ -------- */
            if (dist < this.enemyAIData.detectionRadius) {
                rad = Math.atan2(dy, dx);

                if (dist > this.enemyAIData.attackRange) {
                    accel = +0.1;
                } else if (dist < this.enemyAIData.attacknearRange) {
                    accel = -0.1;
                } else {
                    this.fire();
                    if (this._wanderTimer <= 0) {
                        const r = Math.random();
                        this._wanderAccel = r < 0.33 ? -0.1 : r < 0.66 ? 0 : +0.1;
                        this._wanderTimer = 0.2 + Math.random() * 0.4;
                    }
                    accel = this._wanderAccel;
                    this._wanderTimer -= delta;
                }
            } else {
                /* 感知外：徘徊 */
                if (!this._wanderTimer || this._wanderTimer <= 0) {
                    this._wanderTimer = 3;
                    rad = Math.random() * Math.PI * 2;
                }
                this._wanderTimer--;
                accel = +0.6;
            }

        } else if (this.status.hp <= 0) {
            /* 死亡時は即バリア解除 ★ */
            if (this._hasBarrier) {
                this.RemoveBarrier();
                this._hasBarrier = false;
            }
            if (!this.hasDroppedCoins) {
                this.dropCoins();
                this.hasDroppedCoins = true;
            } else if (!this.isFadingOut) {
                this.ExitStart();
            }
        }

        /* MoveBase 用パラメータ反映 */
        this.radian       = rad;
        this.acceleration = accel;
        this.strafe       = strafe;

        /* ターゲットとの距離が 3000 以上で退場処理 */
        if (this.playerTarget) {
            const { x, y } = this.playerTarget.getPlayerPosition();
            const dx = x - this.x;
            const dy = y - this.y;
            const limit = 3000;

            if (dx * dx + dy * dy >= limit * limit) {
                // 退場時もバリア解除 ★
                if (this._hasBarrier) {
                    this.RemoveBarrier();
                    this._hasBarrier = false;
                }
                this.ExitStart();
            }
        } else {
            if (this._hasBarrier) {
                this.RemoveBarrier();
                this._hasBarrier = false;
            }
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
            this.Fire(this.status.FireCnt1, this.status.FireCnt2, this.getPosition());

            return true;
        }

        return false;
    }


    SetAIData(enemyAIData) {
        this.enemyAIData = enemyAIData;
    }

    destroy() {
        this.emit('destroyed', this);
        super.destroy();
        // --- 破棄イベント発火 -------------------------------
        // payload に self を入れておくと購読側で enemy 情報を使える
    }

    hitsWall(px, py,forEnemy=false) {
        return super.hitsWall(px,py,true);
    }
}
