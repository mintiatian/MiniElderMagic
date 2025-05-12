import { Character } from './character.js';
import { FireBall } from './FireBall.js';
import { PlayerStatus } from "./playerStatus.js";
import { UIGage } from './UIGage.js';

export class PlayerBase extends Character {
    constructor(x, y, step, emoji, parentElement) {
        super(x, y, step, emoji, parentElement);

        // プレイヤーの絵文字を単一の文字に戻す
        this.element.textContent = '🧙';

        // プレイヤー要素を中心配置するためのスタイル設定
        this.element.style.transform = 'translate(-50%, -50%)'; // 中心を基準に配置
        this.element.style.textAlign = 'center'; // テキストを中央揃え
        this.element.style.display = 'flex';
        this.element.style.justifyContent = 'center';
        this.element.style.alignItems = 'center';
    
        // 攻撃用の配列を追加
        this.attacks = [];
    
        // 最後に押された移動方向を保持（デフォルトは右方向）
        this.lastDirection = { dx: 1, dy: 0 };
    
        this.playerstatus = new PlayerStatus(0, 0);
        
        // HPゲージの作成（Character.jsのhpGageとは別に独自のものを作成）
        this.playerHPGage = new UIGage(this.element);
        // HPゲージのスタイリングをカスタマイズ
        this.playerHPGage.container.style.width = '50px'; // 幅を広げる
        this.playerHPGage.container.style.height = '6px'; // 高さを広げる
        this.playerHPGage.container.style.bottom = '-15px'; // 少し下に表示
    
        // 杖の要素を作成する関数
        this.createStaffElement = () => {
          // 既存の杖要素があれば削除
          if (this.staffElement && this.staffElement.parentNode) {
            this.staffElement.parentNode.removeChild(this.staffElement);
          }
          
          // 新しい杖要素を作成
          this.staffElement = document.createElement('div');
          this.staffElement.id = `staff-${Date.now()}`; // ユニークIDを設定
          this.staffElement.classList.add('character', 'player-staff');
          this.staffElement.textContent = '🪄';  // 杖の絵文字
          this.staffElement.style.fontSize = '40px';
          this.staffElement.style.zIndex = '1';  // キャラクターの後ろに表示
          this.staffElement.style.transform = 'translate(-50%, -50%)'; // 中心を基準に配置
          
          // 親要素に追加
          if (parentElement && document.body.contains(parentElement)) {
            parentElement.appendChild(this.staffElement);
          }
          
          return this.staffElement;
        };
        
        // 杖要素を初期作成
        this.createStaffElement();
        
        // 初期方向に杖を配置
        this.updateStaffPosition();
        
        // 杖要素の健全性を定期的にチェック (3秒ごと)
        this.staffCheckInterval = setInterval(() => {
          if (!this.staffElement || !document.body.contains(this.staffElement)) {
            this.createStaffElement();
            this.updateStaffPosition();
          }
        }, 3000);

        // クリックイベントハンドラ参照を保持
        this.clickHandler = this.onPlayerClick.bind(this);
        
        // 左クリック時、新しい弾を生成して発射する
        document.addEventListener('click', this.clickHandler);
            }
            
            /**
             * プレイヤークリックイベント処理
             * @param {MouseEvent} evt - クリックイベント
             */
            onPlayerClick(evt) {
        // プレイヤーのHPが0以下なら攻撃できない
        if (this.status.hp <= 0) {
            return;
        }
        
        try {
            // 杖の位置から FireBall を生成
            // より堅牢な杖の存在チェック
            if (!this.staffElement) {
                this.createStaffElement();
                this.updateStaffPosition();
            }
                    
            if (!document.body.contains(this.staffElement)) {
                this.createStaffElement();
                this.updateStaffPosition();
            }
            
            const staffPos = this.getStaffPosition();
            if (!staffPos) {
                return;
            }
            
            const newFire = new FireBall(
                staffPos.x,
                staffPos.y,
                this.step,
                this.element.parentElement,  // 常に有効な親要素を参照
                this.status.attack,          // プレイヤーの攻撃力を使用
                this.status.fireRange,       // ステータスから射程距離を取得
                '🔥'                         // 攻撃の絵文字
            );
            
            // 最後に押されたWASDキーの方向に発射
            newFire.fire(this.lastDirection.dx, this.lastDirection.dy);
            this.attacks.push(newFire);
            
            // 発射エフェクト（杖から出る小さな光）
            this.createCastEffect(staffPos);
                    } catch (error) {
            // エラー発生時はログを出力せず静かに続行
        }
    }

    update() {
        // 移動前の位置を記録
        const prevX = this.x;
        const prevY = this.y;

        // 方向ベクトルを初期化
        let dx = 0;
        let dy = 0;
    
        // 押されているキーに基づいて方向ベクトルを更新
        if (this.keys['w']) dy -= 1; // 上
        if (this.keys['s']) dy += 1; // 下
        if (this.keys['a']) dx -= 1; // 左
        if (this.keys['d']) dx += 1; // 右
    
        // 方向ベクトルが変更されていれば最終方向を更新
        if (dx !== 0 || dy !== 0) {
            this.updateLastDirection(dx, dy);
        }
    
        // 正規化（斜め移動時に速度が増加するのを防ぐ）
        if (dx !== 0 && dy !== 0) {
            const length = Math.sqrt(dx * dx + dy * dy);
            dx = dx / length;
            dy = dy / length;
        }
    
        // 実際の移動
        this.x += dx * this.step;
        this.y += dy * this.step;
        
        super.update();
        
        // プレイヤー固有のHPゲージを更新
        this.playerHPGage.update(this.status.hp, this.status.maxHP);
        
        // 杖の位置を更新
        this.updateStaffPosition();
    
        // 配列内の全ての弾を更新 & 使い終わった弾は取り除く例
        this.attacks = this.attacks.filter((fireBall) => {
            fireBall.update();
            // FireBall の active が false になっていれば取り除く
            return fireBall.active;
        });
    }
    
    // 最後に押された方向を更新するメソッド
    updateLastDirection(dx, dy) {
        // 方向を正規化（長さを1にする）
        if (dx !== 0 || dy !== 0) {
            const length = Math.sqrt(dx * dx + dy * dy);
            this.lastDirection = { 
                dx: dx / length, 
                dy: dy / length 
            };
        }
        
        // 杖の位置を更新
        this.updateStaffPosition();
    }
    
    // 杖の位置を更新するメソッド
    updateStaffPosition() {
        // 杖要素の存在チェック
        if (!this.staffElement) {
            // 杖が未定義の場合は再作成
            this.createStaffElement();
        } else if (!document.body.contains(this.staffElement)) {
            // DOMに存在しない場合も再作成
            this.createStaffElement();
        }
        
        // 再作成後も杖が無い場合は処理を中止
        if (!this.staffElement) {
            return;
        }
        
        const offset = 30; // 杖のオフセット距離
        
        // 方向ベクトルを使用して杖の位置を計算
        // 方向ベクトルはすでに正規化されている（長さが1）
        const staffX = this.x + this.lastDirection.dx * offset;
        const staffY = this.y + this.lastDirection.dy * offset;
        
        try {
            // 杖の要素の位置を更新
            this.staffElement.style.left = staffX + 'px';
            this.staffElement.style.top = staffY + 'px';
            
            // 杖の回転角度を計算（ラジアンから度に変換）
            const angle = Math.atan2(this.lastDirection.dy, this.lastDirection.dx) * (180 / Math.PI);
            
            // 杖を回転させる
            this.staffElement.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
        } catch (error) {
            // エラーが発生した場合は杖を再作成
            this.createStaffElement();
            
            // 再試行
            try {
                this.staffElement.style.left = staffX + 'px';
                this.staffElement.style.top = staffY + 'px';
                const angle = Math.atan2(this.lastDirection.dy, this.lastDirection.dx) * (180 / Math.PI);
                this.staffElement.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
            } catch (retryError) {
                // 再試行失敗時も静かに続行
            }
        }
    }
    
    // 杖の現在位置を取得するメソッド
    getStaffPosition() {
        // 安全チェック - 要素が存在するか確認
        if (!this.staffElement) {
            this.createStaffElement();
            this.updateStaffPosition();
            
            // それでも杖がなければプレイヤー位置からの相対位置を返す（フォールバック）
            if (!this.staffElement) {
                return {
                    x: this.x + this.lastDirection.dx * 30,
                    y: this.y + this.lastDirection.dy * 30
                };
            }
        }
        
        if (!document.body.contains(this.staffElement)) {
            this.createStaffElement();
            this.updateStaffPosition();
            
            // それでも杖がDOMにない場合はフォールバック
            if (!document.body.contains(this.staffElement)) {
                return {
                    x: this.x + this.lastDirection.dx * 30,
                    y: this.y + this.lastDirection.dy * 30
                };
            }
        }
        
        try {
            // まず直接座標を試みる（より信頼性が高い）
            if (this.staffElement.style.left && this.staffElement.style.top) {
                const left = parseFloat(this.staffElement.style.left);
                const top = parseFloat(this.staffElement.style.top);
                
                if (!isNaN(left) && !isNaN(top)) {
                    return { x: left, y: top };
                }
            }
            
            // 上記が失敗した場合はBoundingClientRectを試みる
            const rect = this.staffElement.getBoundingClientRect();
            if (!rect.width || !rect.height) {
                return {
                    x: this.x + this.lastDirection.dx * 30,
                    y: this.y + this.lastDirection.dy * 30
                };
            }
            
            const containerRect = this.staffElement.parentElement.getBoundingClientRect();
            
            // ゲームエリア内の相対座標に変換
            return {
                x: rect.left - containerRect.left + rect.width / 2,
                y: rect.top - containerRect.top + rect.height / 2
            };
        } catch (error) {
            // エラーが発生した場合はゲーム座標をそのまま返す（フォールバック）
            return {
                x: this.x + this.lastDirection.dx * 30,
                y: this.y + this.lastDirection.dy * 30
            };
        }
    }
    
    // プレイヤーの中心位置を取得するメソッド（攻撃発射位置用）
    getPlayerCenter() {
        // 安全チェック - 要素が存在するか確認
        if (!this.element || !this.element.parentElement) {
            return { x: this.x, y: this.y }; // フォールバック
        }
        
        try {
            const rect = this.element.getBoundingClientRect();
            const containerRect = this.element.parentElement.getBoundingClientRect();
            
            // ゲームエリア内の相対座標に変換
            return {
                x: rect.left - containerRect.left + rect.width / 2,
                y: rect.top - containerRect.top + rect.height / 2
            };
        } catch (error) {
            return { x: this.x, y: this.y }; // 内部座標をフォールバックとして使用
        }
    }
    
    /**
     * @desc ダメージを受けたときの処理をオーバーライド
     * @param {number} damage - 受けるダメージ量
     */
    takeDamage(damage) {
        // 親クラスのtakeDamageを呼び出す
        super.takeDamage(damage);
        
        // ダメージエフェクト（一時的に赤くする）
        this.element.style.filter = 'brightness(2) sepia(1) hue-rotate(-50deg) saturate(7)';
        setTimeout(() => {
            this.element.style.filter = 'none';
        }, 200);
        
        // プレイヤー固有のHPゲージを更新
        this.playerHPGage.update(this.status.hp, this.status.maxHP);
    }
    
    // キャラクターが削除されるときに杖も削除
    fadeOutAndRemove() {
        // クリックイベントリスナーを削除
        document.removeEventListener('click', this.clickHandler);
        
        // 杖チェックインターバルをクリア
        if (this.staffCheckInterval) {
            clearInterval(this.staffCheckInterval);
            this.staffCheckInterval = null;
        }
        
        // 杖要素の存在チェック
        if (this.staffElement) {
            try {
                this.staffElement.style.transition = 'opacity 1s ease';
                this.staffElement.style.opacity = '0';
                
                setTimeout(() => {
                    try {
                        if (this.staffElement && document.body.contains(this.staffElement)) {
                            this.staffElement.parentNode.removeChild(this.staffElement);
                        }
                    } catch (error) {
                        // エラー時は静かに続行
                    } finally {
                        this.staffElement = null;  // 明示的に参照を解放
                    }
                }, 1000);
            } catch (error) {
                // エラーが発生した場合は直接削除を試みる
                if (this.staffElement && document.body.contains(this.staffElement)) {
                    try {
                        this.staffElement.parentNode.removeChild(this.staffElement);
                    } catch (removeErr) {
                        // 静かに失敗
                    } finally {
                        this.staffElement = null;
                    }
                }
            }
        }
        
        // 攻撃オブジェクトをすべて非アクティブ化
        this.attacks.forEach(attack => {
            if (attack && typeof attack.deactivate === 'function') {
                attack.deactivate();
            }
        });
        this.attacks = [];  // 攻撃配列をクリア
        
        // HPゲージも非表示にする
        if (this.playerHPGage) {
            this.playerHPGage.hide();
        }
        
        super.fadeOutAndRemove();
    }
    
    /**
     * @desc 火球発射時の杖のエフェクトを生成
     * @param {Object} position - エフェクトを表示する位置 {x, y}
     */
    createCastEffect(position) {
        // 安全チェック - 親要素が存在しない場合は処理しない
        if (!this.element) {
            return;
        }
        
        if (!document.body.contains(this.element)) {
            return;
        }
        
        const parentElement = this.element.parentElement;
        if (!parentElement) {
            return;
        }
        
        try {
            const effect = document.createElement('div');
            effect.textContent = '✨';
            effect.style.position = 'absolute';
            effect.style.left = `${position.x}px`;
            effect.style.top = `${position.y}px`;
            effect.style.fontSize = '25px';
            effect.style.transform = 'translate(-50%, -50%)';
            effect.style.zIndex = '4';
            effect.style.opacity = '0';
            
            // ユニークIDを付与して追跡可能にする
            effect.id = `effect-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            
            parentElement.appendChild(effect);
            
            // エフェクトアニメーション
            setTimeout(() => {
                // 要素が存在するか確認
                if (!document.getElementById(effect.id)) return;
                
                effect.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-in-out';
                effect.style.opacity = '1';
                effect.style.transform = 'translate(-50%, -50%) scale(1.3)';
                
                setTimeout(() => {
                    // 要素が存在するか確認
                    if (!document.getElementById(effect.id)) return;
                    
                    effect.style.opacity = '0';
                    effect.style.transform = 'translate(-50%, -50%) scale(0.5)';
                    
                    setTimeout(() => {
                        const effectElement = document.getElementById(effect.id);
                        if (effectElement && effectElement.parentNode) {
                            effectElement.parentNode.removeChild(effectElement);
                        }
                    }, 300);
                }, 200);
            }, 10);
        } catch (error) {
            // エラー発生時は静かに続行
        }
    }
}