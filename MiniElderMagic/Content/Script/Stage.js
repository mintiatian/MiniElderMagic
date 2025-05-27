import { EnemyBase } from './Character/EnemyBase.js';
import { BOSS_SIZE } from './GameData.js';
import {enemyAIDataTable, enemyDataTable} from "./Utils/DataTable.js";

export class Stage {
    /**
     * @param {HTMLElement} gameArea - ゲームのメインエリア
     */
    constructor(gameArea) {
        this.gameArea = gameArea;
        this.enemies = [];
        this.currentStage = 0;
        this.difficultyFactor = 1.2; // 各ステージのHP/攻撃力増加倍率
        
    }

    /**
     * 指定されたステージ番号に応じて敵を生成する
     * @param {number} stageNumber - ステージ番号
     * @param {Wizard} wizard
     * @returns {Array} - 生成された敵の配列
     */
    createEnemiesForStage(stageNumber,wizard) {

        // 敵の種類を定義
        
        // ステージ番号を保存
        this.currentStage = stageNumber;
        
        // ステージ番号に基づいて敵の数を決定
        let enemyCount = Math.min(3 + Math.floor(stageNumber / 2), 10);
        
        // ボスステージの場合（5の倍数のステージ）
        const isBossStage = stageNumber % 5 === 0 && stageNumber > 0;
        if (isBossStage) {
            enemyCount = 1; // ボスのみ
        }
        
        // 新しい敵を生成
        for (let i = 0; i < enemyCount; i++) {
            // ゲームエリア内のランダムな位置を生成
            const maxX = this.gameArea.clientWidth - 200;
            const maxY = this.gameArea.clientHeight - 200;
            const x = Math.random() * maxX + 100;
            const y = Math.random() * maxY + 100;
            
            // 敵の種類を選択
            let enemyTypeIndex;
            
            if (isBossStage) {
                // ボスステージの場合、難易度に応じたボスを選択
                enemyTypeIndex = Math.min(Math.floor(stageNumber / 5), enemyDataTable.table.size - 1);
            } else {
                // 通常ステージでは、出現できる種類からランダムに選択
                // ステージが進むと出現する敵の種類が増える
                const availableTypes = Math.min(Math.floor(stageNumber / 3) + 1, enemyDataTable.table.size);
                enemyTypeIndex = Math.floor(Math.random() * availableTypes);
            }

            const keyArray   = Array.from(enemyDataTable.table.keys());   // もしくは [...this.enemyTypes.table.keys()]
            const enemyId        = keyArray[enemyTypeIndex];                   // N 番目のキー
            
            const charaData  = enemyDataTable.table.get(enemyId);             // 対応する value
            const enemyAIData = enemyAIDataTable.get(enemyId);
            
            
            // 難易度係数（ステージが進むほど強くなる）
            const difficulty = Math.pow(this.difficultyFactor, stageNumber - 1);
            
            // 敵を生成
            const enemy = new EnemyBase(
                x, 
                y, 
                this.gameArea,
                charaData
            );
            
            enemy.SetAIData(enemyAIData);
            enemy.setPlayerTarget(wizard);
            
            // ステージに応じてステータスを調整
            enemy.status.maxHP = Math.floor(charaData.hp * difficulty);
            enemy.status.hp = enemy.status.maxHP;
            enemy.status.attack = Math.floor(charaData.attack * difficulty);
            
            // ボスの場合は特別な処理
            if (isBossStage) {
                enemy.element.style.fontSize = BOSS_SIZE + 'px'; // ボスは大きく
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
}
