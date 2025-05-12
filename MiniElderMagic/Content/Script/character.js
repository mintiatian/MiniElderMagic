
import { UIGage } from './UIGage.js';
import { FireBall } from './FireBall.js';
import { Status } from './status.js';

export class Character {
  /**
   * @param {number} x - 初期x位置
   * @param {number} y - 初期y位置
   * @param {number} step - 1フレームごとの移動量
   * @param {string} emoji - キャラクターの絵文字
   * @param {HTMLElement} parentElement - 親要素
   */
  constructor(x, y, step, emoji, parentElement) {
    this.x = x;
    this.y = y;
    this.step = step;
    this.emoji = emoji;
    this.keys = {};

    // ステータス管理クラスのインスタンス
    this.status = new Status(100, 50, step, 10);

    // キャラクター用の要素を作成
    this.element = document.createElement('div');
    this.element.classList.add('character');
    this.element.textContent = this.emoji;
    parentElement.appendChild(this.element);

    // HPゲージの生成
    this.hpGage = new UIGage(this.element);

    // 攻撃手段 (FireBall) を所持
    this.attack = new FireBall(this.x, this.y, this.step, parentElement);

    // キャラクターが既に消えているかどうかを管理するフラグ
    this.isFadingOut = false;
  }

  /**
   * @desc 毎フレーム呼び出されるメソッド
   */
  update() {
    // HPが残っている(>0)場合のみ動作する
    if (this.status.hp > 0) {
      // キー入力による移動
      if (this.keys['w']) this.y -= this.status.speed;
      if (this.keys['s']) this.y += this.status.speed;
      if (this.keys['a']) this.x -= this.status.speed;
      if (this.keys['d']) this.x += this.status.speed;

      // 表示更新
      this.draw();

      // 攻撃の更新 (弾の移動など)
      // 互換性のために単一のattackがある場合は更新
      if (this.attack) {
        this.attack.update();
      }
    }

    // HPが0以下になったら、フェードアウト処理
    if (this.status.hp <= 0 && !this.isFadingOut) {
      this.fadeOutAndRemove();
    }
  }

  /**
   * @desc キャラクターの頭上にテキストを表示する
   * @param {string} text - 表示するテキスト
   * @param {string} color - テキストの色
   * @param {number} duration - 表示時間（ミリ秒）
   * @param {number} offsetY - Y軸方向のオフセット（負の値で上方向）
   * @returns {HTMLElement} - 作成されたテキスト要素
   */
  showFloatingText(text, color = 'white', duration = 3000, offsetY = -50) {
    // 表示用の要素を作成
    const textElement = document.createElement('div');
    textElement.textContent = text;
    textElement.style.position = 'absolute';
    textElement.style.color = color;
    textElement.style.fontSize = '24px';
    textElement.style.fontWeight = 'bold';
    textElement.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.7)';
    textElement.style.zIndex = '1000';
    textElement.style.pointerEvents = 'none'; // クリックイベントを透過
    textElement.style.userSelect = 'none'; // テキスト選択を防止
    textElement.style.whiteSpace = 'nowrap'; // 折り返しを防止
    
    // アニメーション用のスタイル
    textElement.style.transition = 'transform 0.5s ease-out, opacity 0.5s ease-in-out';
    textElement.style.opacity = '0';
    
    // 親要素に追加
    if (this.element && this.element.parentNode) {
      this.element.parentNode.appendChild(textElement);
    
      // 位置の更新関数（キャラクターの移動に追従させるため）
      const updatePosition = () => {
        const rect = this.element.getBoundingClientRect();
        const parentRect = this.element.parentNode.getBoundingClientRect();
        
        // キャラクターの中心上部に配置
        const centerX = rect.left - parentRect.left + rect.width / 2;
        const topY = rect.top - parentRect.top + offsetY;
        
        textElement.style.left = `${centerX}px`;
        textElement.style.top = `${topY}px`;
        textElement.style.transform = 'translate(-50%, -50%)';
      };
      
      // 初期位置を設定
      updatePosition();
      
      // 表示開始
      setTimeout(() => {
        textElement.style.opacity = '1';
        textElement.style.transform = 'translate(-50%, -80%)'; // 少し上に浮かび上がる
      }, 10);
      
      // キャラクターの移動に合わせて位置を更新
      const interval = setInterval(updatePosition, 16); // 約60FPS
      
      // 指定時間後に消える
      setTimeout(() => {
        textElement.style.opacity = '0';
        textElement.style.transform = 'translate(-50%, -100%)';
        
        // 完全に透明になったら要素を削除
        setTimeout(() => {
          if (textElement.parentNode) {
            textElement.parentNode.removeChild(textElement);
          }
          clearInterval(interval);
        }, 500);
      }, duration);
      
      return textElement;
    }
    
    return null;
  }
  
  /**
   * @desc キーの押下状態を同期
   */
  setKeyState(pressedKeys) {
    this.keys = pressedKeys;
  }

  /**
   * @desc キャラクターの描画・HPゲージ更新
   */
  draw() {
    this.element.style.left = this.x + 'px';
    this.element.style.top = this.y + 'px';

    // HPゲージ更新（statusのmaxHP値を使用）
    this.hpGage.update(this.status.hp, this.status.maxHP);
  }

  /**
   * @desc キャラクターをフェードアウトさせてDOMから取り除く
   */
  fadeOutAndRemove() {
    // すでにフェードアウト中なら何もしない
    if (this.isFadingOut) {
      return;
    }
    
    console.log(`[Character] フェードアウト開始: ${this.emoji}`);
    this.isFadingOut = true;
    
    // HPゲージを非表示
    if (this.hpGage) {
      this.hpGage.hide();
    }
    
    // フェードアウトとスケール縮小アニメーション
    this.element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    this.element.style.opacity = '0';
    this.element.style.transform = 'scale(0.8)';
  
    // フェードアウト後に要素を削除
    setTimeout(() => {
      if (this.element && this.element.parentNode) {
        console.log(`[Character] DOM要素を削除: ${this.emoji}`);
        this.element.parentNode.removeChild(this.element);
        // 明示的にnullを設定して参照を切る
        this.element = null;
      }
    }, 500); // 短めのフェードアウト時間(500ms)に変更
  }
  
  /**
   * @desc ダメージを受けたときの処理
   * @param {number} damage - 受けるダメージ量
   */
  takeDamage(damage) {
    // statusオブジェクトにダメージを適用
    this.status.takeDamage(damage);
    
    // HPゲージを更新
    this.hpGage.update(this.status.hp, this.status.maxHP);
    
    // ダメージテキストを表示
    if (damage > 0) {
      this.showFloatingText(`-${damage}`, 'red', 3000, -50);
    }
  }
  
  /**
   * @desc HPを回復したときに回復量を表示
   * @param {number} amount - 回復量
   */
  showHealAmount(amount) {
    if (amount > 0) {
      this.showFloatingText(`+${amount}`, 'lightgreen', 3000, -50);
    }
  }
  
  /**
   * @desc HPを回復する
   * @param {number} amount - 回復量
   */
  heal(amount) {
    // Statusオブジェクトの回復メソッドを呼び出し、実際に回復した量を取得
    const healedAmount = this.status.heal(amount);
    
    // HPゲージを更新
    this.hpGage.update(this.status.hp, this.status.maxHP);
    
    // 回復テキストを表示
    if (healedAmount > 0) {
      this.showFloatingText(`+${healedAmount}`, 'lightgreen', 3000, -50);
    }
    
    return healedAmount;
  }
}