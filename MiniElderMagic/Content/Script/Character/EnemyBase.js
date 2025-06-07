import {Item} from '../Actor/Item.js';
import {FireBall} from '../FireBall.js';
import {CharacterBase} from "./CharacterBase.js";
import {EventEmitterMixin} from "../Base/EventEmitterMixin.js";
import { DebugMovementLogger } from '../Utils/DebugMovementLogger.js';

export class EnemyBase extends EventEmitterMixin(CharacterBase) {
    constructor(x, y, parentElement, charaData, extraDropID) {
        super(x, y, parentElement, charaData);

        this.parentElement = parentElement;
        this.hasDroppedCoins = false;           // コインをドロップしたかのフラグ

        this.extraDropID = extraDropID;

        this.lastAttackTime = 0;       // 最後に攻撃した時間


        // プレイヤーへの参照
        this.playerTarget = null;

        this._moveMode = 'approach'; // 'approach' or 'orbit'
        this._modeTimer = 0;          // モード残り秒数
        this._orbitDir = 1;          // +1 時計回り / -1 反時計

        /* ========= コンストラクタ付近（定数） ========= */
        this.ORBIT_OFFSET_RAD = Math.PI * 0.5;   // ← 90° なら π/2
        this.ORBIT_ACCEL = 0.15;
        this.ORBIT_CORRECT_W = 0.35;


        this.SetupMPGage()
        this.SetupHPGage();


        /* ==== 追加 ==== */
        this._log = new DebugMovementLogger();
        this._time = 0;          // 経過秒
    }

    SetAIData(enemyAIData) {
        this.enemyAIData = enemyAIData;
        this.ORBIT_RADIUS = (this.enemyAIData.attackRange +
            this.enemyAIData.attacknearRange) * 0.5;
    }

    R

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
        this._time += delta;     // 経過時間を累積

        /* バリアの生存時間を監視 ★──────────────── */
        if (this._hasBarrier) {
            this._barrierTimer -= delta;
            if (this._barrierTimer <= 0) {
                this.RemoveBarrier();
                this._hasBarrier = false;
            }
        }

        /* ──── 行動決定用の変数初期化 ────── */
        let accel = 0;
        let strafe = 0;
        let rad = this.radian;

        /* HP が残っている & ターゲットがいる場合 ───── */
        if (this.status.hp > 0 && this.playerTarget) {

            /* -------------- update / tick ----------------- */
            const dx = this.playerTarget.x - this.x;
            const dy = this.playerTarget.y - this.y;
            const dist = Math.hypot(dx, dy);

            /* ★ バリア発動判定 ──────────────────── */
            if (dist < this.enemyAIData.detectionRadius) {
                // まだ張っていない & 乱数 10 % で AddBarrier
                if (!this._hasBarrier && Math.random() < 0.01 && this.status.hp / this.status.maxHP < 0.1) {
                    this.AddBarrier();
                    this._hasBarrier = true;
                    this._barrierTimer = 2000;   // 2 秒で自動解除
                }
            }

            /* ------- 以下、移動 & 攻撃 AI は前と同じ -------- */
            /* ----------------- 移動 & 攻撃 AI --------------- */
            if (dist < this.enemyAIData.detectionRadius) {

                /* === モード抽選 === */
                this._modeTimer -= delta;
                if (this._modeTimer <= 0) {
                    // 40 % で周回、60 % で接近
                    if (Math.random() < 0.4) {
                        this._moveMode = 'orbit';
                        this._orbitDir = Math.random() < 0.5 ? 1 : -1;   // 回転向き
                    } else {
                        this._moveMode = 'approach';
                    }
                    this._modeTimer = 1.0 + Math.random() * 1.0;          // 次の再抽選まで 1–2 秒
                }

                /* === 方向決定 === */
                if (this._moveMode === 'approach') {
                    // 少しブレを持たせつつ接近
                    rad = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.2;
                } else if (this._moveMode === 'orbit') {
                    const base = Math.atan2(dy, dx);

                    /* --- 周回方向（接線方向に 90° シフト） --- */
                    rad = base + this._orbitDir * this.ORBIT_OFFSET_RAD;
                    accel = this.ORBIT_ACCEL;                 // 常に前進させる

                    /* --- 半径補正（ズレが大きいときだけ） --- */
                    const diff = dist - this.ORBIT_RADIUS;
                    if (Math.abs(diff) > 6) {
                        const corrDir = diff > 0 ? base : base + Math.PI;     // 内外補正
                        const sin = Math.sin(rad) * (1 - this.ORBIT_CORRECT_W) +
                            Math.sin(corrDir) * this.ORBIT_CORRECT_W;
                        const cos = Math.cos(rad) * (1 - this.ORBIT_CORRECT_W) +
                            Math.cos(corrDir) * this.ORBIT_CORRECT_W;
                        rad = Math.atan2(sin, cos);
                    }

                    /* --- 攻撃判定は従来どおり --- */
                    if (dist < this.enemyAIData.attackRange) {
                        this.fire();
                    }
                }

                /* === 加速度決定（従来ロジック流用） === */
                if (dist > this.enemyAIData.attackRange) {
                    accel = +0.1;
                } else if (dist < this.enemyAIData.attacknearRange) {
                    accel = -0.1;
                } else {
                    this.fire();                             // 攻撃実行
                    /* --- wander (従来どおり) --- */
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
                    if (Math.random() < 0.1) {
                        rad = Math.atan2(dy, dx);   // ← 実際の方向
                    } else {
                        rad = Math.random() * Math.PI * 2;
                    }
                }

                this._wanderTimer--;
                accel = +0.6;
            }

            this._log.push({
                t:  Math.round(this._time * 1000), // ms
                m:  this._moveMode,                // 'orbit' or 'approach'
                x:  this.x,
                y:  this.y,
                d:  dist,
                r:  rad,
                a:  accel
            });

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
        this.radian = rad;
        this.acceleration = accel;
        this.strafe = strafe;

        /* ターゲットとの距離が 3000 以上で退場処理 */
        if (this.playerTarget) {
            const {x, y} = this.playerTarget.getPlayerPosition();
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
    
    dumpMovementLog() {
        console.log(this._log.toCSV());
        // ↓必要なら Blob でファイル保存も
        // const blob = new Blob([this._log.toCSV()], {type:'text/csv'});
        // saveAs(blob, 'enemy_movement.csv');   // FileSaver.js などを利用
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

        if (this.extraDropID !== null) {
            const randomValue = Math.random();
            if (1 >= randomValue) {
                const angle = Math.random() * Math.PI * 2;
                const dist = 20 + Math.random() * 40;
                const x = centerX + Math.cos(angle) * dist;
                const y = centerY + Math.sin(angle) * dist;
                let item = new Item(x, y, this.parentElement, this.extraDropID);
            }
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


    destroy() {
        this.dumpMovementLog();
        this.emit('destroyed', this);
        super.destroy();
        
        // --- 破棄イベント発火 -------------------------------
        // payload に self を入れておくと購読側で enemy 情報を使える
    }

    hitsWall(px, py, forEnemy = false) {
        return super.hitsWall(px, py, true);
    }
}
