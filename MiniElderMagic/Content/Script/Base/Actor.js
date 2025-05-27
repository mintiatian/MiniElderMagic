import {Pawn} from "./Pawn.js";
import { CHAR_SIZE } from '../GameData.js';

export class Actor extends Pawn {

    constructor(x, y, emoji,parentElement) {
        super(x, y,emoji, CHAR_SIZE, parentElement);        // ← 位置は親クラスへ
        
        this.IsActive = true;


        // キャラクター用の要素を作成
        this.element.style.fontSize = CHAR_SIZE + 'px';
        this.element.textContent = this.emoji;
    }
    

}