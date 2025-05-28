// Script/Config.js
export const GameConfig = {
    /** もとの論理解像度 */
    baseWidth : 1920,
    baseHeight: 1080,

    /** ワールド全体を何倍に拡大して敷き詰めるか（1,2,3…） */
    renderScale: 6,
};

/** 動的に倍率を切り替えたいとき用 */
export function setRenderScale(scale){
    GameConfig.renderScale = Math.max(1, Math.floor(scale));
    /* index.html 側で resizeWorld() をフックしている */
    window.dispatchEvent(new Event('renderScaleChanged'));
}
