import { Character } from './character.js';
import { Coin } from './coin_character.js';

export class EnemyBase extends Character {
  constructor(x, y, step, emoji, parentElement) {
    super(x, y, step, emoji, parentElement);
    
    // コインドロップ関連の設定
    this.coinDropCount = 5;         // ドロップするコインの数
    this.parentElement = parentElement;
    this.hasDroppedCoins = false;   // コインをドロップしたかのフラグ
    
    // 敵特有の設定
    this.status.hp = 30;           // 敵のHPを設定
    this.status.maxHP = 30;        // 敵の最大HPを設定
    this.detectionRadius = 200;    // プレイヤー検出半径
  }

  /**
   * @desc 毎フレーム呼び出され、敵の移動を行う
   * ランダム移動の実装
   */
  update() {
    // HPが残っている場合のみ動く
    if (this.status.hp > 0) {
      // -1 以上 1 未満のランダム値を使用して
      // ちょっとずつ動かす例
      this.x += (Math.random() * 2 - 1) * this.step;
      this.y += (Math.random() * 2 - 1) * this.step;
      
      // 親クラスのupdate処理（HPゲージ更新など）
      super.update();
    } 
    // HPが0以下でまだコインをドロップしていない場合
    else if (this.status.hp <= 0 && !this.hasDroppedCoins) {
      // コインをドロップする
      this.dropCoins();
      this.hasDroppedCoins = true;
      
      // フェードアウト
      this.fadeOutAndRemove();
    }
  }

  /**
   * @desc HP0になったときの処理をオーバーライド
   */
  fadeOutAndRemove() {
    // コインをドロップする（二重ドロップ防止のためフラグチェック）
    if (!this.hasDroppedCoins) {
      this.dropCoins();
      this.hasDroppedCoins = true;
    }
    
    // 元のフェードアウト処理を呼び出す
    super.fadeOutAndRemove();
  }

  /**
   * @desc 敵の周りにコインを配置する
   * @param {number} count - 生成するコインの数（デフォルトは設定値）
   */
  dropCoins(count = this.coinDropCount) {
    console.log("敵が倒れて" + count + "枚のコインをドロップします");
    
    // 敵の現在位置を中心にコインを配置
    const centerX = this.x;
    const centerY = this.y;
    
    // 指定された数だけコインを生成
    for (let i = 0; i < count; i++) {
      // ランダムな方向に少し離れた位置にコインを配置
      const angle = Math.random() * Math.PI * 2; // 0〜2πのランダムな角度
      const distance = 20 + Math.random() * 40; // 20〜60pxのランダムな距離
      
      const coinX = centerX + Math.cos(angle) * distance;
      const coinY = centerY + Math.sin(angle) * distance;
      
      // 少し遅延させてコインを順番に生成（アニメーション効果）
      setTimeout(() => {
        // コインを生成
        const coin = new Coin(coinX, coinY, this.parentElement);
        
        // コインが最初は小さく表示され、アニメーションで通常サイズになる
        coin.element.style.transition = 'transform 0.3s ease';
        coin.element.style.transform = 'scale(0.1)';
        
        // 少し遅延して通常サイズに戻す
        setTimeout(() => {
          coin.element.style.transform = 'scale(1)';
        }, 10);
        
        coin.draw();
      }, i * 100); // 100ミリ秒ごとにコインを生成
    }
  }
  
  /**
   * @desc ダメージを受けたときの処理（オプション：エフェクト追加）
   * @param {number} damage - 受けるダメージ量
   */
  takeDamage(damage) {
    // ダメージを受ける
    this.status.takeDamage(damage);
    
    // ダメージエフェクト（一時的に赤くする）
    this.element.style.filter = 'brightness(2) sepia(1) hue-rotate(-50deg) saturate(7)';
    setTimeout(() => {
      this.element.style.filter = 'none';
    }, 200);
    
    // HPが0以下になったらコインをドロップ
    if (this.status.hp <= 0 && !this.hasDroppedCoins) {
      this.dropCoins();
      this.hasDroppedCoins = true;
    }
  }
}