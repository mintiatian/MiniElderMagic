import {Item} from '../Actor/Item.js';
import {FireBall} from '../FireBall.js';
import {CharacterBase} from "./CharacterBase.js";
import {EventEmitterMixin} from "../Base/EventEmitterMixin.js";
import {DebugMovementLogger} from '../Utils/DebugMovementLogger.js';
import {enemyAIDataTable, enemyDataTable} from "../Utils/DataTable.js";

export class EnemyBase extends EventEmitterMixin(CharacterBase) {
    constructor(x, y, parentElement, charaData, extraDropID, ratio) {
        super(x, y, parentElement, charaData, ratio);

        this.parentElement = parentElement;
        this.hasDroppedCoins = false;           // コインをドロップしたかのフラグ

        this.extraDropID = extraDropID;

        this.lastAttackTime = 0;       // 最後に攻撃した時間

        // ここでサイズを変える
        //

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
        this.teamId = 'enemy';          // ★追加

        /* ==== 追加 ==== */
        this._log = new DebugMovementLogger();
        this._time = 0;          // 経過秒

        const enemyId = enemyDataTable.getIdByEmoji(charaData.emoji);
        const enemyAIData = enemyAIDataTable.get(enemyId);
        this.SetAIData(enemyAIData);
    }

    setRatioSize(ratio) {
        super.setSize(this.CHAR_SIZE * ratio);


        this.status.AddLifeTime *= ratio;
        this.enemyAIData.detectionRadius *= ratio;
        this.enemyAIData.attackRange *= ratio;
        this.enemyAIData.attacknearRange *= ratio;
    }

    SetAIData(enemyAIData) {
        // スプレッド構文を使って新しいオブジェクトを作成し、プロパティをコピーする
        this.enemyAIData = {...enemyAIData};


        console.log(this.enemyAIData.attackRange, this.enemyAIData.attacknearRange);
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
        /* ===== データテーブル → 定数化 ============================== */
        // ── EnemyAIData 由来 ───────────────────────────
        const DETECTION_RADIUS = this.enemyAIData.detectionRadius;
        const ATTACK_RANGE = this.enemyAIData.attackRange;
        const ATTACK_NEAR_RANGE = this.enemyAIData.attacknearRange;

        const ATTACK_COOLDOWN_MS = this.enemyAIData.attackCooldown;
        const DROP_COIN_COUNT = this.enemyAIData.coinDropCount;

        // ── CharaData 由来（現ロジックでは未使用だが宣言だけしておく） ──
        const CHAR_MAX_SPEED = this.charaData.MaxSpeed;
        const CHAR_HP_MAX = this.charaData.hp;
        const CHAR_MP_MAX = this.charaData.mp;
        const CHAR_DEFENCE = this.charaData.deffence;
        /* ============================================================ */

        /* ===== 既存の AI 固有定数（確率・閾値など） ================== */
        const BARRIER_HP_THRESHOLD = this.enemyAIData.BARRIER_HP_THRESHOLD;    // HP が 10% 未満で発動候補
        const BARRIER_PROBABILITY = this.enemyAIData.BARRIER_PROBABILITY;    // 1% でバリア貼り
        const BARRIER_DURATION_MS = this.enemyAIData.BARRIER_DURATION_MS;    // バリア持続 2 秒

        const MODE_ORBIT_PROB = this.enemyAIData.MODE_ORBIT_PROB;    // 周回モード選択確率
        const MODE_TIMER_MIN_MS = this.enemyAIData.MODE_TIMER_MIN_MS;     // 再抽選 0.5–1.2 秒
        const MODE_TIMER_MAX_MS = this.enemyAIData.MODE_TIMER_MAX_MS;

        const APPROACH_ANGLE_JITTER = this.enemyAIData.APPROACH_ANGLE_JITTER;     // 接近時のブレ（±0.1 rad）
        const APPROACH_ACCEL = this.enemyAIData.APPROACH_ACCEL;    // 接近加速
        const RETREAT_ACCEL = this.enemyAIData.RETREAT_ACCEL;    // 退却加速

        const ORBIT_RADIUS = this.enemyAIData.ORBIT_RADIUS;
        const ORBIT_DIFF_THRESHOLD = this.enemyAIData.ORBIT_DIFF_THRESHOLD;       // 半径補正開始距離
        const ORBIT_CORRECT_ACCEL = this.enemyAIData.ORBIT_CORRECT_ACCEL;     // 内外補正用加速
        const EXIT_DISTANCE_LIMIT = this.enemyAIData.EXIT_DISTANCE_LIMIT;    // 退場判定距離
        /* ============================================================ */

        super.update(delta);                    // アニメ / クールダウン等

        // ── 毎フレーム共通パラメータ ──────────────────
        this._time += delta;
        let accel = 0;                         // 前後入力 –1…+1
        let strafe = 0;                         // 左右入力 –1…+1
        let rad = this.radian;               // 向き（ラジアン）

        // ── バリア寿命チェック ────────────────────────
        if (this._hasBarrier && (this._barrierTimer -= delta) <= 0) {
            this.RemoveBarrier();
            this._hasBarrier = false;
        }

        // ────────────────────────────────────────────
        // ① 生存中 & ターゲットあり
        // ────────────────────────────────────────────
        if (this.status.hp > 0 && this.playerTarget) {
            /* --------- 基本計算 --------- */
            const dx = this.playerTarget.x - this.x;
            const dy = this.playerTarget.y - this.y;
            const dist = Math.hypot(dx, dy);
            const toPlayerRad = Math.atan2(dy, dx);

            /* ★ バリア発動判定 --------------------------------- */
            if (
                dist < DETECTION_RADIUS &&
                !this._hasBarrier &&
                this.status.hp / this.status.maxHP < BARRIER_HP_THRESHOLD &&
                Math.random() < BARRIER_PROBABILITY
            ) {
                this.AddBarrier();
                this._hasBarrier = true;
                this._barrierTimer = BARRIER_DURATION_MS;
            }

            /* --------- モード抽選タイマー --------- */
            if ((this._modeTimer -= delta) <= 0) {
                this._moveMode = Math.random() < MODE_ORBIT_PROB ? "orbit" : "approach";
                this._orbitDir = Math.random() < 0.5 ? +1 : -1;      // CW / CCW
                const random = Math.random();
                this._modeTimer = MODE_TIMER_MIN_MS +
                    random * (MODE_TIMER_MAX_MS - MODE_TIMER_MIN_MS);

                //if (this._modeTimer < 0);
//                console.log("modeChange :  --------------------- ",this._modeTimer);
            }
            //           console.log("modeTimer : ",this._modeTimer);

            /* ──────────────── A. approach ──────────────── */
            if (this._moveMode === "approach") {
                rad = toPlayerRad + (Math.random() - 0.5) * APPROACH_ANGLE_JITTER;
                strafe = 0;

                // 距離に応じた前後アクセル
                if (dist > ATTACK_RANGE) {
                    accel = APPROACH_ACCEL;               // 接近
                } else if (dist < ATTACK_NEAR_RANGE) {
                    accel = RETREAT_ACCEL;                // 後退
                } else {
                    accel = 0;
                    this.fire();                          // 攻撃
                }
            }

            /* ──────────────── B. orbit ──────────────── */
            else if (this._moveMode === "orbit") {
                rad = toPlayerRad;                     // 常に正面
                strafe = this._orbitDir;                  // ±1 で周回

                // 半径補正（膨らみ過ぎ・詰まり過ぎを前後入力で微修正）
                const diff = dist - this.ORBIT_RADIUS;
                if (Math.abs(diff) > ORBIT_DIFF_THRESHOLD) {
                    accel = diff > 0 ? +ORBIT_CORRECT_ACCEL : -ORBIT_CORRECT_ACCEL;
                } else {
                    accel = 0;
                }

                // 攻撃判定
                if (dist < ATTACK_RANGE) {
                    this.fire();
                }
            }
        }

            // ────────────────────────────────────────────
            // ② 死亡処理・ドロップなど
        // ────────────────────────────────────────────
        else if (this.status.hp <= 0) {
            if (this._hasBarrier) {
                this.RemoveBarrier();
                this._hasBarrier = false;
            }
            if (!this.hasDroppedCoins) {
                this.dropCoins();                 // ドロップ数は内部で coinDropCount を参照
                this.hasDroppedCoins = true;
            } else if (!this.isFadingOut) {
                this.ExitStart();
            }
        }

        // ────────────────────────────────────────────
        // ③ 退場距離チェック
        // ────────────────────────────────────────────
        if (this.playerTarget) {
            const {x: px, y: py} = this.playerTarget.getPlayerPosition();
            const dd = (px - this.x) ** 2 + (py - this.y) ** 2;
            if (dd >= EXIT_DISTANCE_LIMIT ** 2) {
                if (this._hasBarrier) {
                    this.RemoveBarrier();
                    this._hasBarrier = false;
                }
                this.ExitStart();
            }
        } else if (!this.isFadingOut) {
            if (this._hasBarrier) {
                this.RemoveBarrier();
                this._hasBarrier = false;
            }
            this.ExitStart();
        }

        // ────────────────────────────────────────────
        // ④ MoveBase へパラメータ反映 → 実際の移動
        // ────────────────────────────────────────────
        this.radian = rad;
        this.acceleration = accel;
        this.strafe = strafe;
        // this.mover.moveUpdate(delta);  // ★ MoveBase 使用時は有効化
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
        if (distance > this.enemyAIData.attackRange) {
            return false;
        }

        
        
        let attackRatios = [0.025,0.05,0.075,0.1, 0.125, 0.15, 0.175,0.2];       // 候補となる値を配列にまとめる

        if(this.status.FireCnt1>=5){
            attackRatios = [0.05,0.1,0.15,0.2, 0.25, 0.3, 0.35,0.4];
        }
        else if(this.status.FireCnt1>=10){
            attackRatios = [0.3,0.4,0.5,0.6, 0.7, 0.8, 0.9,1.0];
        }
        
        const randomIndex = Math.floor(Math.random() * attackRatios.length);     // 配列のインデックスをランダムに生成する (0, 1, 2, 3のいずれか)
        this.status.AttackdirRatio = attackRatios[randomIndex];         // ランダムに選ばれた値を設定する


        // 攻撃時間を更新
        this.lastAttackTime = currentTime;

        // プレイヤーの方向を計算（正規化）
        const normalizedDx = dx / distance;
        const normalizedDy = dy / distance;

        this.radian = Math.atan2(normalizedDy, normalizedDx);
        this.Fire(this.status.FireCnt1, this.getPosition());

        //this.status.AttackdirRatio = 0.05;
        //this.Fire(5, this.getPosition());

        return true;


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
