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
    
        // 杖の要素を作成
        this.staffElement = document.createElement('div');
        this.staffElement.classList.add('character');
        this.staffElement.textContent = '🪄';  // 杖の絵文字
        this.staffElement.style.fontSize = '40px';
        this.staffElement.style.zIndex = '1';  // キャラクターの後ろに表示
        this.staffElement.style.transform = 'translate(-50%, -50%)'; // 中心を基準に配置
        parentElement.appendChild(this.staffElement);
        
        // 初期方向に杖を配置
        this.updateStaffPosition();

        // 左クリック時、新しい弾を生成して発射する
        document.addEventListener('click', (evt) => {
            // プレイヤーの中心位置を取得
            const playerCenter = this.getPlayerCenter();
            
            // プレイヤーの中心から FireBall を生成
            const newFire = new FireBall(
                playerCenter.x,
                playerCenter.y,
                this.step,
                parentElement,
                10,      // 攻撃力
                350,     // 飛距離
                '🔥'     // 攻撃の絵文字
            );
            // 最後に押されたWASDキーの方向に発射
            newFire.fire(this.lastDirection.dx, this.lastDirection.dy);
            this.attacks.push(newFire);
        });
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
        const offset = 30; // 杖のオフセット距離
        
        // 方向ベクトルを使用して杖の位置を計算
        // 方向ベクトルはすでに正規化されている（長さが1）
        const staffX = this.x + this.lastDirection.dx * offset;
        const staffY = this.y + this.lastDirection.dy * offset;
        
        // 杖の要素の位置を更新
        this.staffElement.style.left = staffX + 'px';
        this.staffElement.style.top = staffY + 'px';
        
        // 杖の回転角度を計算（ラジアンから度に変換）
        const angle = Math.atan2(this.lastDirection.dy, this.lastDirection.dx) * (180 / Math.PI);
        
        // 杖を回転させる
        this.staffElement.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
    }
    
    // 杖の現在位置を取得するメソッド
    getStaffPosition() {
        const rect = this.staffElement.getBoundingClientRect();
        const containerRect = this.staffElement.parentElement.getBoundingClientRect();
        
        // ゲームエリア内の相対座標に変換
        return {
            x: rect.left - containerRect.left + rect.width / 2,
            y: rect.top - containerRect.top + rect.height / 2
        };
    }
    
    // プレイヤーの中心位置を取得するメソッド（攻撃発射位置用）
    getPlayerCenter() {
        const rect = this.element.getBoundingClientRect();
        const containerRect = this.element.parentElement.getBoundingClientRect();
        
        // ゲームエリア内の相対座標に変換
        return {
            x: rect.left - containerRect.left + rect.width / 2,
            y: rect.top - containerRect.top + rect.height / 2
        };
    }
    
    /**
     * @desc ダメージを受けたときの処理をオーバーライド
     * @param {number} damage - 受けるダメージ量
     */
    takeDamage(damage) {
        // ダメージを受ける（親クラスのstatusを使用）
        this.status.takeDamage(damage);
        
        // ダメージエフェクト（一時的に赤くする）
        this.element.style.filter = 'brightness(2) sepia(1) hue-rotate(-50deg) saturate(7)';
        setTimeout(() => {
            this.element.style.filter = 'none';
        }, 200);
        
        // HPゲージを更新
        this.playerHPGage.update(this.status.hp, this.status.maxHP);
        
        // ダメージテキストを表示（赤色で3秒間）
        if (damage > 0) {
            this.showFloatingText(`-${damage}`, 'red', 3000, -60);
        }
    }
    
    // キャラクターが削除されるときに杖も削除
    fadeOutAndRemove() {
        this.staffElement.style.transition = 'opacity 1s ease';
        this.staffElement.style.opacity = '0';
        
        // HPゲージも非表示にする
        this.playerHPGage.hide();
        
        setTimeout(() => {
            if (this.staffElement && this.staffElement.parentNode) {
                this.staffElement.parentNode.removeChild(this.staffElement);
            }
        }, 1000);
        
        super.fadeOutAndRemove();
    }
}