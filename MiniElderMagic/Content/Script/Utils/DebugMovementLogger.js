/* ========== DebugMovementLogger.js ========== */
export class DebugMovementLogger {
    constructor(max = 5000) {                 // 最大保持行
        this.rows   = [];
        this._max   = max;
    }
    push(rec) {
        this.rows.push(rec);
        if (this.rows.length > this._max) this.rows.shift();
    }
    /** CSV 文字列を返す（コピーして Excel / LibreOffice へ） */
    toCSV() {
        return [
            'time,mode,x,y,dist,rad,accel',
            ...this.rows.map(r =>
                [r.t, r.m, r.x, r.y,
                    r.d, r.r, r.a].join(',')
            )
        ].join('\n');
    }
}
