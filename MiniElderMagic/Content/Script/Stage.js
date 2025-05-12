import { EnemyBase } from './enemyBase.js';

export class Stage {
    /**
     * @param {HTMLElement} gameArea - ゲームのメインエリア
     */
    constructor(gameArea) {
        this.gameArea = gameArea;
        this.enemies = [];
        this.currentStage = 0;
        this.difficultyFactor = 1.2; // 各ステージのHP/攻撃力増加倍率
        
        // 敵の種類を定義
        this.enemyTypes = [
            {
                emoji: '👾',     // 基本的な敵
                speed: 2,       // 移動速度
                hp: 100,        // 基本HP
                attack: 10      // 基本攻撃力
            },
            {
                emoji: '👹',     // 鬼の敵
                speed: 1.5,     // 移動速度
                hp: 150,        // 基本HP
                attack: 15      // 基本攻撃力
            },
            {
                emoji: '👻',     // 幽霊の敵
                speed: 3,       // 移動速度
                hp: 80,         // 基本HP
                attack: 8       // 基本攻撃力
            },
            {
                emoji: '🐉',     // ドラゴン
                speed: 1.2,     // 移動速度
                hp: 200,        // 基本HP
                attack: 20      // 基本攻撃力
            },
            {
                emoji: '🧟',     // ゾンビ
                speed: 1,       // 移動速度
                hp: 120,        // 基本HP
                attack: 12      // 基本攻撃力
            }
        ];
    }

    /**
     * 指定されたステージ番号に応じて敵を生成する
     * @param {number} stageNumber - ステージ番号
     * @returns {Array} - 生成された敵の配列
     */
    createEnemiesForStage(stageNumber) {
        // 古い敵を削除
        this.clearEnemies();
        
        // ステージ番号を保存
        this.currentStage = stageNumber;
        
        // ステージ番号に基づいて敵の数を決定
        let enemyCount = Math.min(1 + Math.floor(stageNumber / 2), 10);
        
        // ボスステージの場合（5の倍数のステージ）
        const isBossStage = stageNumber % 5 === 0 && stageNumber > 0;
        if (isBossStage) {
            enemyCount = 1; // ボスのみ
        }
        
        // 新しい敵を生成
        for (let i = 0; i < enemyCount; i++) {
            // ゲームエリア内のランダムな位置を生成
            const maxX = this.gameArea.clientWidth - 100;
            const maxY = this.gameArea.clientHeight - 100;
            const x = Math.random() * maxX + 50;
            const y = Math.random() * maxY + 50;
            
            // 敵の種類を選択
            let enemyTypeIndex;
            
            if (isBossStage) {
                // ボスステージの場合、難易度に応じたボスを選択
                enemyTypeIndex = Math.min(Math.floor(stageNumber / 5), this.enemyTypes.length - 1);
            } else {
                // 通常ステージでは、出現できる種類からランダムに選択
                // ステージが進むと出現する敵の種類が増える
                const availableTypes = Math.min(Math.floor(stageNumber / 3) + 1, this.enemyTypes.length);
                enemyTypeIndex = Math.floor(Math.random() * availableTypes);
            }
            
            const enemyType = this.enemyTypes[enemyTypeIndex];
            
            // 難易度係数（ステージが進むほど強くなる）
            const difficulty = Math.pow(this.difficultyFactor, stageNumber - 1);
            
            // 敵を生成
            const enemy = new EnemyBase(
                x, 
                y, 
                enemyType.speed, 
                enemyType.emoji, 
                this.gameArea
            );
            
            // ステージに応じてステータスを調整
            enemy.status.maxHP = Math.floor(enemyType.hp * difficulty);
            enemy.status.hp = enemy.status.maxHP;
            enemy.status.attack = Math.floor(enemyType.attack * difficulty);
            
            // ボスの場合は特別な処理
            if (isBossStage) {
                enemy.element.style.fontSize = '80px'; // ボスは大きく
                enemy.boss = true;
                // HPをさらに増加
                enemy.status.maxHP *= 2;
                enemy.status.hp = enemy.status.maxHP;
            }
            
            // 敵を描画し、配列に追加
            enemy.draw();
            this.enemies.push(enemy);
        }
        
        return this.enemies;
    }
    
    /**
     * 現在のすべての敵を更新
     */
    updateEnemies() {
        this.enemies.forEach(enemy => {
            enemy.update();
        });
        
        // 死んだ敵を配列から削除
        this.enemies = this.enemies.filter(enemy => enemy.status.hp > 0);
    }
    
    /**
     * すべての敵にプレイヤーの参照を渡す
     * @param {PlayerBase} player - プレイヤーオブジェクト
     */
    setPlayerTargetForAllEnemies(player) {
        this.enemies.forEach(enemy => {
            enemy.setPlayerTarget(player);
        });
    }
    
    /**
     * 敵がすべて倒されたかどうかを確認
     * @returns {boolean} - 敵が全滅していればtrue
     */
    areAllEnemiesDefeated() {
        return this.enemies.length === 0;
    }
    
    /**
     * 現在の敵を全て削除
     */
    clearEnemies() {
        // 各敵のフェードアウト処理を呼び出す
        this.enemies.forEach(enemy => {
            if (enemy && enemy.fadeOutAndRemove) {
                enemy.fadeOutAndRemove();
            }
        });
        
        // 配列をクリア
        this.enemies = [];
    }
    
    /**
     * 指定された敵を倒したときのコイン生成
     * @param {EnemyBase} enemy - 倒された敵
     * @returns {Object} - コインの位置情報 {x, y}
     */
    getEnemyPosition(enemy) {
        if (!enemy) return null;
        
        return {
            x: enemy.x,
            y: enemy.y
        };
    }
}
