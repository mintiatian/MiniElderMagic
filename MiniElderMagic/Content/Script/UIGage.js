export class UIGage {
  /**
   * @param {HTMLElement} parentElement - ゲージの親要素
   */
  constructor(parentElement) {
    // ゲージのコンテナを作成
    this.container = document.createElement('div');
    this.container.style.position = 'absolute';
    this.container.style.width = '40px';
    this.container.style.height = '4px';
    this.container.style.backgroundColor = '#333';
    this.container.style.bottom = '-10px';
    this.container.style.left = '50%';
    this.container.style.transform = 'translateX(-50%)';
    this.container.style.borderRadius = '2px';
    
    // 実際のゲージ部分
    this.gage = document.createElement('div');
    this.gage.style.width = '100%';
    this.gage.style.height = '100%';
    this.gage.style.backgroundColor = '#0f0';
    this.gage.style.borderRadius = '2px';
    this.gage.style.transition = 'width 0.3s ease';
    
    this.container.appendChild(this.gage);
    parentElement.appendChild(this.container);
  }
  
  /**
   * @desc HPの割合に応じてゲージを更新
   * @param {number} currentHP - 現在のHP
   * @param {number} maxHP - 最大HP
   */
  update(currentHP, maxHP) {
    const ratio = Math.max(0, Math.min(1, currentHP / maxHP));
    this.gage.style.width = (ratio * 100) + '%';
    
    // HPの割合に応じて色を変える
    if (ratio > 0.6) {
      this.gage.style.backgroundColor = '#0f0'; // 緑
    } else if (ratio > 0.3) {
      this.gage.style.backgroundColor = '#ff0'; // 黄
    } else {
      this.gage.style.backgroundColor = '#f00'; // 赤
    }
  }
  
  /**
   * @desc ゲージを非表示にする
   */
  hide() {
    this.container.style.display = 'none';
  }
  
  /**
   * @desc ゲージを表示する
   */
  show() {
    this.container.style.display = 'block';
  }
}
