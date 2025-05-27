import {Wizard} from './Character/Wizard.js';
import {Background} from './Background.js';
import {Stair} from './Actor/Stair.js'; // デバッグ画面クラスをインポート
import {Stage} from './Stage.js';

import {UIHud} from './UI/UIHud.js';
import {UIStatus} from './UI/UIStatus.js'; // ステータス画面クラスをインポート
import {UIDebug} from './UI/UIDebug.js'; // デバッグ画面クラスをインポート
import {UIMagic} from './UI/UIMagic.js';

import {
    EnemyDataTable,
    enemyDataTable,
    wizardDataTable,
    ItemDataTable,
    MagicDataTable, WizardDataTable, EnemyAIDataTable, MapDataTable,
} from "./Utils/DataTable.js";
import {UIItemList} from "./UI/UIItemList.js";

export let gameMain = null;

export class GameMain {

    gameArea;
    background;
    AddNewPawns = [];
    pawns = [];

    ExitPawns = [];
    stageManager;

    pressedKeys = {};

    lastTime = 0;
    accumulatedTime; // 経過時間をためるための変数

    wizard;
    // 1回あたりの理想フレーム時間（ミリ秒）
    FPS;
    FRAME_TIME; // 1000ms ÷ 60fps ≈ 16.6667ms

    initCount() {
        if (++this._loadedCount === this._totalToLoad) {
            this.init();                      // ← ここで後続処理
        }
    }

    constructor(parentElement) {
        /* ───── 基本セットアップ ───── */

        this.gameArea = parentElement;

        /* ───── 非同期テーブル読込 ───── */
        const urls = {
            magic: 'https://docs.google.com/spreadsheets/d/14KPqmm0KQ-wlcgV-WMGqlqIwCCoz94hI8InyBMPmJdA/export?format=csv',
            item: 'https://docs.google.com/spreadsheets/d/174mPJFw8fMOP5DAzL70FcuW549VnZK6FeVDcCkvfYfU/export?format=csv',
            enemy: 'https://docs.google.com/spreadsheets/d/1v_q-56Nb_CtzkIZBThYEuBWScLzRIBaiQlI5mtugv9w/export?format=csv',
            wizard: 'https://docs.google.com/spreadsheets/d/1CRTX72AUu4QXko0QUUq6X7LaNLxfy0YausEIx9zFBJA/export?format=csv',
            enemyai: 'https://docs.google.com/spreadsheets/d/16F7ksDu0R-01dE1ik7vZOADMWYiyqbCecUDhTVzOO5c/export?format=csv',
            map_000: 'https://docs.google.com/spreadsheets/d/178l4JKlUGkUFAUFfU6Dt0yAyUwkOeCNQLc5tkn2BUSg/export?format=csv',

        };


        this._loadedCount = 0;            // 進捗カウンター
        this._totalToLoad = Object.keys(urls).length;            // 期待ロード数
        
        MagicDataTable.init(urls.magic).then(() => this.initCount());
        ItemDataTable.init(urls.item).then(() => this.initCount());
        EnemyDataTable.init(urls.enemy).then(() => this.initCount());
        WizardDataTable.init(urls.wizard).then(() => this.initCount());
        EnemyAIDataTable.init(urls.enemyai).then(() => this.initCount());
        MapDataTable.init(urls.map_000).then(() => this.initCount());
    }

    init() {

        gameMain = this;

        this.FPS = 60;
        this.FRAME_TIME = 1000 / this.FPS; // 1000ms ÷ 60fps ≈ 16.6667ms

        this.background = new Background(this.gameArea, 60);

        this.wizard = new Wizard(100, 100,  this.background, this.gameArea, wizardDataTable.get("Wizard1"));


        this.stageManager = new Stage(this.gameArea);
        this.stageManager.createEnemiesForStage(1, this.wizard);


        // HUDの生成
        const hud = new UIHud(this.gameArea);
        // ステータス画面の生成
        this.statusUI = new UIStatus(this.gameArea, this.wizard);
        // デバッグ画面の生成
        const debugUI = new UIDebug(this.gameArea, this.wizard);

        // ショップの生成
        //const shop = new UIShop(this.gameArea, this.wizard, stair);


        this.magicUI = new UIMagic(this.gameArea, this.wizard);
        const itemList = new UIItemList(this.gameArea, this.wizard);
        //magicUI.update();

        // ショップ完了イベントのリスナー（一度だけ登録）
        document.addEventListener('shopCompleted', () => {
            // ステージを1上げる
            wizard.playerstatus.nextStage();

            // 新しいステージのセットアップ
            onStageChange();
        });

        // キーの押下状態を監視
        document.addEventListener('keydown', (event) => {
            const key = event.key.toLowerCase();

            // Tabキーはデフォルトのブラウザの動作を防止する（ステータス画面UIで処理するため）
            if (key === 'tab') {
                event.preventDefault();
            }
            // 'o'キーでデバッグモードを切り替え
            else if (key === 'o') {
                debugUI.toggle();
            } else if (key === 'p') {
                //shop.show();
            } else {
                this.pressedKeys[key] = true;

                // 方向キーもWASDにマッピング
                if (key === 'arrowup') this.pressedKeys['w'] = true;
                if (key === 'arrowdown') this.pressedKeys['s'] = true;
                if (key === 'arrowleft') this.pressedKeys['a'] = true;
                if (key === 'arrowright') this.pressedKeys['d'] = true;

                if (key === 'shift') this.pressedKeys['run'] = true;

                //   例) アビリティスロットを明示的に区別したい場合
                if (key === 'q') this.pressedKeys['ability1'] = true;
                if (key === 'e') this.pressedKeys['ability2'] = true;
                if (key === 'r') this.pressedKeys['ability3'] = true;
                if (key === 'f') this.pressedKeys['ability4'] = true;

                if (key === '1') this.pressedKeys['magic1'] = true;
                if (key === '2') this.pressedKeys['magic2'] = true;
                if (key === '3') this.pressedKeys['magic3'] = true;
                if (key === '4') this.pressedKeys['magic4'] = true;
                if (key === '5') this.pressedKeys['magic5'] = true;
                if (key === '6') this.pressedKeys['magic6'] = true;
                if (key === '7') this.pressedKeys['magic7'] = true;
                if (key === '8') this.pressedKeys['magic8'] = true;
                if (key === '9') this.pressedKeys['magic9'] = true;
                if (key === '0') this.pressedKeys['magic0'] = true;
            }
        });


        document.addEventListener('keyup', (event) => {
            const key = event.key.toLowerCase();
            this.pressedKeys[key] = false;

            // 方向キーもWASDにマッピング解除
            if (key === 'arrowup') this.pressedKeys['w'] = false;
            if (key === 'arrowdown') this.pressedKeys['s'] = false;
            if (key === 'arrowleft') this.pressedKeys['a'] = false;
            if (key === 'arrowright') this.pressedKeys['d'] = false;

            if (key === 'shift') this.pressedKeys['run'] = false;

            //   例) アビリティスロットを明示的に区別したい場合
            if (key === 'q') this.pressedKeys['ability1'] = false;
            if (key === 'e') this.pressedKeys['ability2'] = false;
            if (key === 'r') this.pressedKeys['ability3'] = false;
            if (key === 'f') this.pressedKeys['ability4'] = false;

            if (key === '1') this.pressedKeys['magic1'] = false;
            if (key === '2') this.pressedKeys['magic2'] = false;
            if (key === '3') this.pressedKeys['magic3'] = false;
            if (key === '4') this.pressedKeys['magic4'] = false;
            if (key === '5') this.pressedKeys['magic5'] = false;
            if (key === '6') this.pressedKeys['magic6'] = false;
            if (key === '7') this.pressedKeys['magic7'] = false;
            if (key === '8') this.pressedKeys['magic8'] = false;
            if (key === '9') this.pressedKeys['magic9'] = false;
            if (key === '0') this.pressedKeys['magic0'] = false;
        });


        // 前のフレームで生きていた敵を記録するための配列
        this.previousLivingEnemies = [...this.stageManager.enemies];
        // 敵の要素を追跡するためのMap（要素ID -> 要素）
        this.enemyElementMap = new Map();


        this.lastTime = performance.now();
        this.accumulatedTime = 0; // 経過時間をためるための変数

        console.log(`[GameMain] constructor end`);


        this.gameLoop = this.gameLoop.bind(this);
        requestAnimationFrame(this.gameLoop);
    }


    fpsSum = 0;
    fpsCount = 0;
    fpsAve = 0;

    // フレームごとのループ
    gameLoop(timestamp) {
        //console.log(`[GameMain] gameLoop`);
        const delta = timestamp - this.lastTime;
        this.lastTime = timestamp;
        this.accumulatedTime += delta;

        while (this.accumulatedTime >= this.FRAME_TIME) {
            this.updateGame(this.FRAME_TIME);
            this.accumulatedTime -= this.FRAME_TIME;
        }

        this.fpsSum += 1000 / delta;
        this.fpsCount += 1;

        // 0.5 秒ごとに平均 fps を表示
        if (this.fpsSum >= 0 && this.fpsCount > 60) {     // 60fps なら約 0.5 秒
            this.fpsAve = this.fpsSum / this.fpsCount;
            //console.log(`FPS: ${this.fpsAve.toFixed(1)} `+this.fpsCount+" pawns = "+this.pawns.length);
            this.fpsSum = 0;
            this.fpsCount = 0;
        }
        requestAnimationFrame(this.gameLoop);
    }

    updateGame(delta) {

        // 登録したpawnsがある時
        while (this.AddNewPawns.length > 0) {
            const ch = this.AddNewPawns.shift();   // 先頭を取り出してキューから削除
            ch.BeginStart();                       // 初期化
            this.pawns.push(ch);                   // 本隊に登録
        }

        for (const ch of this.pawns) {
            ch.setKeyState?.(this.pressedKeys);

            ch.updateMovePre();

            ch.update?.(delta);                     // 各クラス固有ロジック

            for (const hitch of this.pawns) {
                ch.isColliding(hitch);
            }

            ch.updateMoveEnd();
        }

        // 削除Pawnがある時
        while (this.ExitPawns.length > 0) {
            const ch = this.ExitPawns.shift();   // 先頭を取り出してキューから削除
            ch.destroy();                       // 削除処理
        }

    }


    // ステージが変わったときに呼ばれる関数
    onStageChange() {
        // 新しいステージ番号でステージを生成
        const currentStage = wizard.playerstatus.stage;
        const enemies = stageManager.createEnemiesForStage(currentStage);

        // 階段の位置をランダムに変更
        const maxX = gameArea.clientWidth - 100;
        const maxY = gameArea.clientHeight - 100;
        const newX = Math.random() * maxX + 50;
        const newY = Math.random() * maxY + 50;

        wizard.changeStage();
        stair.x = newX;
        stair.y = newY;
        stair.draw();

        // 階段のタッチフラグをリセット
        stair.touched = false;

        // ステージ変更エフェクト
        const stageElement = document.createElement('div');
        stageElement.textContent = `ステージ ${currentStage}`;
        stageElement.style.position = 'absolute';
        stageElement.style.top = '50%';
        stageElement.style.left = '50%';
        stageElement.style.transform = 'translate(-50%, -50%)';
        stageElement.style.fontSize = '48px';
        stageElement.style.fontWeight = 'bold';
        stageElement.style.color = 'white';
        stageElement.style.textShadow = '3px 3px 5px rgba(0, 0, 0, 0.8)';
        stageElement.style.zIndex = '1000';
        stageElement.style.opacity = '0';
        stageElement.style.transition = 'opacity 0.5s ease-in, transform 0.5s ease-in';

        gameArea.appendChild(stageElement);

        // アニメーション
        setTimeout(() => {
            stageElement.style.opacity = '1';
            stageElement.style.transform = 'translate(-50%, -50%) scale(1.2)';

            setTimeout(() => {
                stageElement.style.opacity = '0';
                stageElement.style.transform = 'translate(-50%, -50%) scale(0.8)';

                setTimeout(() => {
                    if (stageElement.parentNode) {
                        stageElement.parentNode.removeChild(stageElement);
                    }
                }, 500);
            }, 1500);
        }, 10);
    }


    // ゲームオーバー表示関数
    displayGameOver() {
        // すでにゲームオーバー画面があれば何もしない
        if (document.getElementById('game-over')) return;

        // ゲームオーバー要素を作成
        const gameOverElement = document.createElement('div');
        gameOverElement.id = 'game-over';
        gameOverElement.style.position = 'absolute';
        gameOverElement.style.top = '50%';
        gameOverElement.style.left = '50%';
        gameOverElement.style.transform = 'translate(-50%, -50%)';
        gameOverElement.style.fontSize = '60px';
        gameOverElement.style.fontWeight = 'bold';
        gameOverElement.style.color = 'red';
        gameOverElement.style.textShadow = '3px 3px 5px rgba(0, 0, 0, 0.8)';
        gameOverElement.style.zIndex = '1000';
        gameOverElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        gameOverElement.style.padding = '30px';
        gameOverElement.style.borderRadius = '15px';
        gameOverElement.style.textAlign = 'center';
        gameOverElement.innerHTML = `
      <div>ゲームオーバー</div>
      <div style="font-size: 30px; margin-top: 20px;">ステージ: ${wizard.playerstatus.stage}</div>
      <div style="font-size: 30px;">コイン: ${wizard.playerstatus.coins}</div>
      <div style="font-size: 24px; margin-top: 40px;">リスタートするにはF5キーを押してください</div>
    `;

        gameArea.appendChild(gameOverElement);

        // ゲームを一時停止する効果（すべての敵を止める）
        stageManager.clearEnemies();
    }

}