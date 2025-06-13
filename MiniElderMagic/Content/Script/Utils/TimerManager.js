/* -------------------------------------------------
 *  TimerManager.js
 *  任意キーに対して同時に複数のタイマーを管理
 * ------------------------------------------------- */
export class TimerManager {

    /** Map<string, {remain:number, onComplete?:Function}> */
    #timers = new Map();

    /**
     * タイマーを開始する
     * @param {string} key          - 一意識別子
     * @param {number} durationMs   - 継続時間 [ms]
     * @param {Function=} onComplete- 終了時コールバック（省略可）
     * @returns {boolean}           - 開始成功: true / 既に存在: false
     */
    start(key, durationMs, onComplete = null) {
        if (this.#timers.has(key)) return false;      // すでに存在
        this.#timers.set(key, { remain: durationMs, onComplete });
        return true;
    }

    /**
     * 毎フレーム呼び出し
     * @param {number} delta - 経過時間 [ms]
     */
    update(delta) {
        for (const [key, t] of this.#timers) {
            t.remain -= delta;
            if (t.remain <= 0) {
                t.onComplete?.();                    // コールバック実行
                this.#timers.delete(key);            // タイマー破棄
            }
        }
    }

    /** 指定キーの残り時間 [ms]（存在しなければ null） */
    getRemaining(key) {
        return this.#timers.get(key)?.remain ?? null;
    }

    /** タイマーを手動キャンセル（存在しない場合は何もしない） */
    cancel(key) {
        this.#timers.delete(key);
    }

    /** 今動いているタイマー数 */
    get size() { return this.#timers.size; }
}
