import { Status } from './status.js';
import { UIGage } from './UIGage.js';
import { FireBall } from './fireBall.js'; // attackBase を継承したクラス

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
    this.isFadingOut = true;
    this.element.style.transition = 'opacity 1s ease';
    this.element.style.opacity = '0';

    // フェードアウト後に要素を削除
    setTimeout(() => {
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
    }, 1000);
  }
}