import { Character } from './character.js';


export class Stair extends Character {
  /**
   * @param {number} x - 初期x位置
   * @param {number} y - 初期y位置
   * @param {HTMLElement} parentElement - 親要素
   */
  constructor(x, y, parentElement) {
    // ステップを0に設定して動かないようにする
    super(x, y, 0, '🪜', parentElement);
    
    // 親要素の参照を明示的に保存
    this.parentContainer = parentElement;
    
    // HPゲージを非表示にする
    this.hpGage.hide();
    
    // 階段の見た目をカスタマイズ
    this.element.style.fontSize = '60px';
    this.element.style.zIndex = '1'; // プレイヤーより下に表示
    
    // 当たり判定用のサイズを少し調整
    this.collisionWidth = 50;
    this.collisionHeight = 70;
    
    // 階段に接触したかどうか判定するためのフラグ
    this.touched = false;
  }
  
  /**
   * @desc 階段は静的なのでupdateは必要最小限
   */
  update() {
    // ベースのCharacterクラスのupdateを部分的に利用
    this.draw();
  }
  
  /**
   * @desc プレイヤーとの衝突判定
   * @param {Character} player - 判定対象のプレイヤー
   * @returns {boolean} - 接触しているかどうか
   */
  checkCollision(player) {
    const stairRect = this.element.getBoundingClientRect();
    const playerRect = player.element.getBoundingClientRect();
    
    // 矩形が重なっているかどうかの判定
    const isOverlap = 
      stairRect.left < playerRect.right &&
      stairRect.right > playerRect.left &&
      stairRect.top < playerRect.bottom &&
      stairRect.bottom > playerRect.top;
    
    return isOverlap;
  }
  
  /**
   * @desc 階段と接触した時の処理
   * @param {PlayerBase} player - プレイヤーオブジェクト
   * @returns {boolean} - 初めて接触した場合はtrue
   */
  onTouch(player) {
    // まだ触れていない場合のみtrue
    if (!this.touched) {
      this.touched = true;
      
      // エフェクト表示
      this.showLevelUpEffect();
      
      return true;
    }
    return false;
  }
  
  /**
   * @desc レベルアップ時のエフェクト表示
   */
  showLevelUpEffect() {
    // 親要素が存在しない場合は処理をスキップ
    if (!this.parentContainer || !this.element) {
      console.warn('Cannot show level up effect - parent container is missing');
      return;
    }
    
    // ゲームエリアの取得（親コンテナを使用）
    const gameArea = this.parentContainer;
    
    // エフェクト用のテキスト要素を作成
    const effectElement = document.createElement('div');
    effectElement.textContent = 'LEVEL UP! →';
    effectElement.style.position = 'absolute';
    effectElement.style.left = (this.x - 50) + 'px';
    effectElement.style.top = (this.y - 50) + 'px';
    effectElement.style.fontSize = '24px';
    effectElement.style.fontWeight = 'bold';
    effectElement.style.color = 'gold';
    effectElement.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.7)';
    effectElement.style.zIndex = '100';
    effectElement.style.transition = 'transform 1s ease-out, opacity 1s ease-out';
    
    // 明示的に保存した親要素を使用
    gameArea.appendChild(effectElement);
    
    // アニメーション
    setTimeout(() => {
      effectElement.style.transform = 'translateY(-50px) scale(1.5)';
      effectElement.style.opacity = '0';
    }, 10);
    
    // アニメーション後に削除
    setTimeout(() => {
      if (effectElement.parentNode) {
        effectElement.parentNode.removeChild(effectElement);
      }
    }, 1000);
  }
}