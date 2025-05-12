import { Character } from './character.js';
import { Coin } from './coin_character.js';
import { FireBall } from './fireBall.js';

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
    
    // 攻撃関連の設定
    this.attackPower = 5;          // 攻撃力
    this.attackRange = 150;        // 攻撃範囲
    this.attackCooldown = 2000;    // 攻撃クールダウン（ミリ秒）
    this.lastAttackTime = 0;       // 最後に攻撃した時間
    
    // 火球攻撃システム
    this.attackSystem = new FireBall(x, y, step, parentElement);
    this.attacks = [];             // 発射した火球を管理する配列
    
    // プレイヤーへの参照
    this.playerTarget = null;
  }

  /**
   * @desc プレイヤーの参照を設定する
   * @param {PlayerBase} player - プレイヤーオブジェクト
   */
  setPlayerTarget(player) {
    this.playerTarget = player;
  }
  
  /**
   * @desc 毎フレーム呼び出され、敵の移動を行う
   * ランダム移動の実装
   */
  update() {
    // HPが残っている場合のみ動く
    if (this.status.hp > 0) {
      // プレイヤーが設定されている場合、プレイヤーに向かって移動
      if (this.playerTarget) {
        // プレイヤーとの距離を計算
        const dx = this.playerTarget.x - this.x;
        const dy = this.playerTarget.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 検出半径内にプレイヤーがいる場合
        if (distance < this.detectionRadius) {
          // 攻撃範囲内ならば火球を発射
          if (distance <= this.attackRange) {
            // 火球発射を試みる
            this.fire();
            
            // 火球を撃った後も少し距離を保つ
            if (distance < 100) {
              // プレイヤーから離れる
              const normalizedDx = dx / distance;
              const normalizedDy = dy / distance;
              this.x -= normalizedDx * this.step * 0.5;
              this.y -= normalizedDy * this.step * 0.5;
            } else {
              // 攻撃範囲内で維持
              const normalizedDx = dx / distance;
              const normalizedDy = dy / distance;
              this.x += normalizedDx * this.step * 0.2;
              this.y += normalizedDy * this.step * 0.2;
            }
          } else {
            // 攻撃範囲外ならプレイヤーに向かって移動
            // 移動方向を正規化
            const normalizedDx = dx / distance;
            const normalizedDy = dy / distance;
            
            // プレイヤーに向かって移動
            this.x += normalizedDx * this.step;
            this.y += normalizedDy * this.step;
          }
        } else {
          // プレイヤーが検出範囲外の場合はランダム移動
          this.x += (Math.random() * 2 - 1) * this.step;
          this.y += (Math.random() * 2 - 1) * this.step;
        }
      } else {
        // プレイヤーが設定されていない場合はランダム移動
        this.x += (Math.random() * 2 - 1) * this.step;
        this.y += (Math.random() * 2 - 1) * this.step;
      }
      
      // 発射済みの火球をアップデートし、使用済みの火球を削除
      this.attacks = this.attacks.filter(fireBall => {
        if (this.playerTarget) {
          // FireBallのupdateメソッドを実行
          fireBall.update([this.playerTarget]);
        }
        // activeがtrueの火球のみを残す
        return fireBall.active;
      });
      
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
  
  /**
   * @desc 火球を発射する
   * @returns {boolean} 発射に成功したかどうか
   */
  fire() {
    // プレイヤーが存在しないか、敵のHPが0以下なら攻撃しない
    if (!this.playerTarget || this.status.hp <= 0) {
      return false;
    }
    
    // 現在の時間を取得
    const currentTime = Date.now();
    
    // クールダウン中なら攻撃しない
    if (currentTime - this.lastAttackTime < this.attackCooldown) {
      return false;
    }
    
    // プレイヤーとの距離を計算
    const dx = this.playerTarget.x - this.x;
    const dy = this.playerTarget.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 攻撃範囲内にプレイヤーがいるか確認
    if (distance <= this.attackRange) {
      // 攻撃時間を更新
      this.lastAttackTime = currentTime;
      
      // プレイヤーの方向を計算（正規化）
      const normalizedDx = dx / distance;
      const normalizedDy = dy / distance;
      
      // 火球を生成（attackSystemを使わない新しいインスタンスを生成）
      const fireBall = new FireBall(
        this.x, 
        this.y, 
        5, 
        this.parentElement,
        this.attackPower, // 攻撃力
        300,             // 射程範囲
        '🔥'             // 火球の絵文字
      );
      
      // 正規化された方向ベクトルで火球を発射
      fireBall.fire(normalizedDx, normalizedDy);
      
      // 敵の火球であることを設定（FireBallクラスが対応している場合）
      if (typeof fireBall.setOwner === 'function') {
        fireBall.setOwner('enemy');
      }
      
      // 攻撃配列に追加
      this.attacks.push(fireBall);
      
      // 長時間飛んでいる場合に備えて、一定時間後に強制的に非アクティブ化
      setTimeout(() => {
        fireBall.deactivate();
      }, 5000); // 5秒後に削除（射程範囲内で消えなかった場合の保険）
      
      console.log("敵が火球を発射しました");
      return true;
    }
    
    return false;
  }
}