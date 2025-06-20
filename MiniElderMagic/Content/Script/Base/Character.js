
import { Actor } from './Actor.js';
import {MoveBase} from "./MoveBase.js";


export class Character extends Actor{
  
  
  /**
   * @param {number} x - 初期x位置
   * @param {number} y - 初期y位置
   * @param {number} speed - 1フレームごとの移動量
   * @param {string} emoji - キャラクターの絵文字
   */
  constructor(x, y, speed, emoji, parentElement) {
    super(x, y,emoji,parentElement);        // ← 位置は親クラスへ


    this.pressedKeys = {};
    this.MaxSpeed = speed;
    
    
    this.moveBase = new MoveBase(this);
  }

  /**
   * @desc 毎フレーム呼び出されるメソッド
   */
  update(delta) {
    super.update(delta);
    
    this.moveBase.moveUpdate(delta);
  }

  
  /**
   * @desc キーの押下状態を同期
   */
  setKeyState(pressedKeys) {
    this.pressedKeys = pressedKeys;
  }
 

  
  
}