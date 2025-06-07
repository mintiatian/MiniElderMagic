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
                [r.t, r.m, r.x.toFixed(1), r.y.toFixed(1),
                    r.d.toFixed(1), r.r.toFixed(3), r.a.toFixed(2)].join(',')
            )
        ].join('\n');
    }
}
