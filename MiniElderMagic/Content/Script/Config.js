// Script/Config.js
export const GameConfig = {
    /** もとの論理解像度 */
    baseWidth: 1920,
    baseHeight: 1080,

    /** ワールド全体を何倍に拡大して敷き詰めるか（1,2,3…） */
    renderScale: 6,


    /** 移動基準
     *  "relative" … 旧仕様（視線に対する前進/ストレーフ）
     *  "absolute" … W=上, A=左, S=下, D=右（今回追加）
     */
    moveAxisMode: "absolute",      // ← ここを "relative" に戻せば元どおり
};

/** 動的に倍率を切り替えたいとき用 */
export function setRenderScale(scale) {
    GameConfig.renderScale = Math.max(1, Math.floor(scale));
    /* index.html 側で resizeWorld() をフックしている */
    window.dispatchEvent(new Event('renderScaleChanged'));
}
