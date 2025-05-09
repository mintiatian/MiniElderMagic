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
}