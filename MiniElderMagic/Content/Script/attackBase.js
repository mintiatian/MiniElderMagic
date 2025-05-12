export class attackBase {
    /**
     * @param {number} x - オブジェクトの初期x座標
     * @param {number} y - オブジェクトの初期y座標
     * @param {number} step - 1フレームごとの基本移動量
     * @param {HTMLElement} parentElement - 親要素
     */
    constructor(x, y, step, parentElement) {
        this.x = x;
        this.y = y;
        this.step = step;
        this.parentElement = parentElement;
    }

    /**
     * @desc 位置をセットするための汎用メソッド
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * @desc 位置を得るための汎用メソッド
     * @returns {{x: number, y: number}}
     */
    getPosition() {
        return { x: this.x, y: this.y };
    }

    /**
     * @desc 毎フレームごとに必要な更新ロジックがあれば、継承先でoverride
     */
    update() {
        // このクラスでは空実装。継承先で必要に応じて書き換え。
    }
    
    /**
     * @desc 移動方向を矢印や傾きで表現する
     * @param {HTMLElement} element - 方向を表示する要素
     * @param {number} dx - X方向の移動量
     * @param {number} dy - Y方向の移動量 
     */
    applyDirectionStyle(element, dx, dy) {
        if (!element) return;
        
        // 方向に基づいて回転角度を計算
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        
        // 要素に回転を適用
        element.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
    }
}