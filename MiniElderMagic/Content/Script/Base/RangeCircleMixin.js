// Utils/RangeCircleMixin.js
export const RangeCircleMixin = (Base) => class extends Base {

    /** [{ el, radius, color, parent }] の配列で保持 */
    _rangeCircles = [];

    /**
     * CircleCreate : 任意数の追従円を生成
     * @param {number} radius   半径(px) – 例: 300
     * @param {string} color    border 指定 – 例: '2px dashed rgba(0,255,255,0.5)'
     * @param {HTMLElement} parentEl 追加先 – 省略時 this.element.parentElement
     * @returns {HTMLElement} 生成（または既存）した円 DOM
     */
    CircleCreate(radius = 300,
                 color  = '2px dashed rgba(255,255,0,0.6)',
                 parentEl = null)
    {
        parentEl ??= (this.element?.parentElement ?? document.body);

        /* 既に同じ設定の円があれば再利用 */
        const already = this._rangeCircles.find(c =>
            c.radius === radius && c.color === color && c.parent === parentEl);
        if (already) return already.el;

        /* 新規生成 */
        const size = radius * 2;
        const circle = document.createElement('div');
        Object.assign(circle.style, {
            position:      'absolute',
            width:         `${size}px`,
            height:        `${size}px`,
            border:        color,
            borderRadius:  '50%',
            transform:     'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex:        '0',
        });
        parentEl.appendChild(circle);

        this._rangeCircles.push({ el: circle, radius, color, parent: parentEl });

        this.CircleUpdate();          // 位置合わせ
        return circle;
    }

    /**
     * CircleUpdate : すべての円を現在座標に追従
     * （Wizard.update 等の毎フレーム処理内で呼ぶ）
     */
    CircleUpdate() {
        /*
        if (!this._rangeCircles.length) return;

        const { x, y } =
            (typeof this.getPlayerPosition() === 'function')
                ? this.getPlayerPosition()
                : { x: this.x, y: this.y };

        for (const c of this._rangeCircles) {
            c.el.style.left = `${x}px`;
            c.el.style.top  = `${y}px`;
        }
        */
    }

    /**
     * CircleClear : 生成した全円を削除（任意呼び出し）
     */
    CircleClear() {
        for (const c of this._rangeCircles) {
            c.el.parentNode?.removeChild(c.el);
        }
        this._rangeCircles = [];
    }
};
