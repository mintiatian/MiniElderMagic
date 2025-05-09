
import { Character } from './character.js';

export class Coin extends Character {
  /**
   * @param {number} x - 初期x位置
   * @param {number} y - 初期y位置
   * @param {HTMLElement} parentElement - 親要素
   */
  constructor(x, y, parentElement) {
    super(x, y, 0, '🪙', parentElement);
    
    // HPゲージを非表示にする
    this.hpGage.hide();
    
    // キラキラ効果用のタイマー
    this.animationTimer = null;
    this.startAnimation();
  }
  
  /**
   * @desc コインはHP管理不要なのでupdateを最小限に
   */
  update() {
    // 位置の更新のみ
    this.draw();
  }
  
  /**
   * @desc キラキラ効果アニメーション
   */
  startAnimation() {
    let scale = 1.0;
    let increasing = false;
    
    this.animationTimer = setInterval(() => {
      if (increasing) {
        scale += 0.01;
        if (scale >= 1.1) {
          increasing = false;
        }
      } else {
        scale -= 0.01;
        if (scale <= 0.9) {
          increasing = true;
        }
      }
      
      this.element.style.transform = `scale(${scale})`;
    }, 50);
  }
  
  /**
   * @desc キャラクター削除時にタイマーも停止
   */
  fadeOutAndRemove() {
    // アニメーションタイマーをクリア
    if (this.animationTimer) {
      clearInterval(this.animationTimer);
      this.animationTimer = null;
    }
    
    // 親のフェードアウト処理を呼び出す
    super.fadeOutAndRemove();
  }
}