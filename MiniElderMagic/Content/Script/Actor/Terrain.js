// Script/Actor/Terrain.js
import { Actor } from '../Base/Actor.js';

/**
 * 背景タイル（木・岩・水面など）を表す静的 Actor
 * 位置は絵文字の中心座標で指定
 */
export class Terrain extends Actor {
    /**
     * @param {number}  x          中心 X 座標[px]
     * @param {number}  y          中心 Y 座標[px]
     * @param {string}  emoji      表示用絵文字
     * @param {number}  tileSize   フォントサイズ (= タイル幅)
     * @param {HTMLElement} parent 親要素
     */
    constructor(x, y, emoji, parent) {
        super(x, y, emoji, parent);

        // フォントをタイルサイズに合わせ直す
        //this.element.style.fontSize = `${tileSize}px`;

    }

    /* ------ 何もしないダミー実装群 ------ */
    /*
    update() {}
    updateMovePre() {}
    updateMoveEnd() {}
    //setKeyState() {}
    */
}
