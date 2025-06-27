import {Wizard} from "../Character/Wizard.js";
import {GameConfig} from "../Config.js";           // ★ 追加

export class MoveBase {

    constructor(Pawn) {
        this.owner = Pawn;
        this.vx = 0;
        this.vy = 0;

        /* ★ 絶対入力用バッファ */
        this._desiredX = 0;
        this._desiredY = 0;

// 加速度と減速率（お好みで調整）
        this.ACCEL = 1200; // px/s^2
        this.FRICTION = 800; // px/s^2
    }


    /*==================================================
     *  Wizard などが呼ぶ：-1～+1 の入力を保持
     *=================================================*/
    setDesiredDir(x, y) {
        this._desiredX = x;
        this._desiredY = y;
    }

    moveUpdate(delta) {

        /* =========================================================
  *  A. 画面固定モード ("absolute")
  * =======================================================*/

        if (GameConfig.moveAxisMode === "absolute" && this.owner instanceof Wizard) {

            /* 1) 入力強度・走り倍率 */
            let inX = this._desiredX;
            let inY = this._desiredY;

            const len = Math.hypot(inX, inY);           // 0～√2
            const inputMag = Math.min(1, len);          // 0～1

            /* 走り（Shift 等）は Wizard 側が倍率込みで渡している想定
― もしここで付けたいなら次行を有効化
// if (this.owner instanceof Wizard && this.owner.pressedKeys?.['run'])
//     { inX *= 1.5; inY *= 1.5; }
*/

            /* 2) 目標速度ベクトル */
            let targetVx = 0, targetVy = 0;
            if (len > 0) {
                const max = this.owner.MaxSpeed;
                targetVx = inX / len * max;
                targetVy = inY / len * max;
            }

            /* 3) 加速度補間 */
            const accelStep = this.ACCEL * inputMag * delta;
            this.vx = this.moveToward(this.vx, targetVx, accelStep);
            this.vy = this.moveToward(this.vy, targetVy, accelStep);

            /* 4) フリクション */
            if (len === 0) {
                this.vx = this.moveToward(this.vx, 0, this.FRICTION * delta);
                this.vy = this.moveToward(this.vy, 0, this.FRICTION * delta);
            }

            /* 5) オーナーへ反映 */
            this.owner.moveX = this.vx * delta;
            this.owner.moveY = this.vy * delta;
            return;                       // ★ relative ルートをスキップ
        }

        /* =========================================================
        *  B. 視線相対モード ("relative") ← 既存ロジックを残す
        * =======================================================*/
        const mag = this.owner.acceleration ?? 0;
        const strafe = this.owner.strafe ?? 0;


        let runMultiplier = 0.5;       // お好みで倍率調整

        if (this.owner instanceof Wizard) {
            if (this.owner.pressedKeys?.['run']) {
            }
        }

        let targetVx = 0;
        let targetVy = 0;

        const rad = this.owner.radian ?? 0;

        // 前後方向（加減速）
        if (mag !== 0) {
            const dir = Math.sign(mag);
            const forwardSpeed = this.owner.MaxSpeed * runMultiplier * Math.abs(mag);
            targetVx += Math.cos(rad) * forwardSpeed * dir;
            targetVy += Math.sin(rad) * forwardSpeed * dir;
        }


        // 左右方向（横移動）
        if (strafe !== 0) {
            const dir = Math.sign(strafe);
            const strafeSpeed = this.owner.MaxSpeed * 0.5 * Math.abs(strafe); // 横移動は少し遅め
            targetVx += Math.cos(rad + Math.PI / 2) * strafeSpeed * dir;
            targetVy += Math.sin(rad + Math.PI / 2) * strafeSpeed * dir;
        }

        // ベクトル合成後の長さ制限（斜め移動の速度調整）

        if (this.owner instanceof Wizard) {
            const length = Math.hypot(targetVx, targetVy);
            if (length > this.owner.MaxSpeed * runMultiplier) {
                const scale = this.owner.MaxSpeed / length;
                targetVx *= scale;
                targetVy *= scale;
            }
        }

        // 加速処理
        const accelMag = Math.max(Math.abs(mag), Math.abs(strafe)); // 一番強い入力で加速率決定
        const accelStep = this.ACCEL * accelMag * delta;
        this.vx = this.moveToward(this.vx, targetVx, accelStep);
        this.vy = this.moveToward(this.vy, targetVy, accelStep);

        // フリクション（入力がないときに止まる）
        if (mag === 0 && strafe === 0) {
            this.vx = this.moveToward(this.vx, 0, this.FRICTION * delta);
            this.vy = this.moveToward(this.vy, 0, this.FRICTION * delta);
        }

        this.owner.moveX = this.vx * delta;
        this.owner.moveY = this.vy * delta;
    }


// ヘルパー: current を target へ step 以内で近づける
    moveToward(current, target, step) {
        if (current < target) return Math.min(current + step, target);
        if (current > target) return Math.max(current - step, target);
        return current;
    }

}