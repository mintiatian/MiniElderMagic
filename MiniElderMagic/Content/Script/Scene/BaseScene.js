export class BaseScene {
    /** DOM 参照などをコンストラクタで受け取る */
    constructor(gameArea, gameUiLayer) {
        this.gameArea = gameArea;
        this.gameUiLayer = gameUiLayer;


    }
    /** 非同期リソース読み込み等が必要ならここで */
    async init() {}
    /** 毎フレーム呼ばれる */
    update(dt) {}
    /** シーンに入った瞬間に呼ばれる */
    onEnter() {}
    /** シーンを抜ける直前に呼ばれる */
    onExit() {}
}
