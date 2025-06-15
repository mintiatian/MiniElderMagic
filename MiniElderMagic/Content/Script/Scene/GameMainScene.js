import {Wizard} from '../Character/Wizard.js';
import {Background} from '../Background.js';

import {UIHud} from '../UI/UIHud.js';
import {UIStatus} from '../UI/UIStatus.js'; // ステータス画面クラスをインポート
import {UIDebug} from '../UI/UIDebug.js'; // デバッグ画面クラスをインポート
import {UIMagic} from '../UI/UIMagic.js';

import {UIEventDialog} from '../UI/UIEventDialog.js';
import {Camera} from '../Camera.js';
import {GameConfig} from '../Config.js';

import {
    EnemyDataTable,
    enemyDataTable,
    wizardDataTable,
    ItemDataTable,
    MagicDataTable,
    WizardDataTable,
    EnemyAIDataTable,
    MapDataTable,
    MapColorDataTable,
    EnemyPopDataTable,
    EventTileDataTable, EventDataTable, MapEventDataTable, ItemDropPopDataTable,
} from "../Utils/DataTable.js";
import {UIItemList} from "../UI/UIItemList.js";
import {BaseScene} from './BaseScene.js';

export let gameMainScene = null;

export class GameMainScene extends BaseScene {

    gameArea;
    background;
    AddNewPawns = [];
    pawns = [];

    ExitPawns = [];

    pressedKeys = {};

    lastTime = 0;
    accumulatedTime; // 経過時間をためるための変数

    wizard;
    // 1回あたりの理想フレーム時間（ミリ秒）
    FPS;
    FRAME_TIME; // 1000ms ÷ 60fps ≈ 16.6667ms

    

    constructor(gameArea, gameUiLayer) {
        /* ───── 基本セットアップ ───── */

        super(gameArea, gameUiLayer);
        this.gameUiLayer = gameUiLayer;
        this.gameArea = gameArea;
        /* === カメラ初期化 (#game-area を渡す) === */
        this.camera = new Camera(this.gameArea);


    }

    async _loadTables() {


        /* ───── 非同期テーブル読込 ───── */
        const urls = {
            magic: 'https://docs.google.com/spreadsheets/d/14KPqmm0KQ-wlcgV-WMGqlqIwCCoz94hI8InyBMPmJdA/export?format=csv',
            item: 'https://docs.google.com/spreadsheets/d/174mPJFw8fMOP5DAzL70FcuW549VnZK6FeVDcCkvfYfU/export?format=csv',
            enemy: 'https://docs.google.com/spreadsheets/d/1v_q-56Nb_CtzkIZBThYEuBWScLzRIBaiQlI5mtugv9w/export?format=csv',
            wizard: 'https://docs.google.com/spreadsheets/d/1CRTX72AUu4QXko0QUUq6X7LaNLxfy0YausEIx9zFBJA/export?format=csv',
            enemyai: 'https://docs.google.com/spreadsheets/d/16F7ksDu0R-01dE1ik7vZOADMWYiyqbCecUDhTVzOO5c/export?format=csv',
            mapChip: 'https://docs.google.com/spreadsheets/d/178l4JKlUGkUFAUFfU6Dt0yAyUwkOeCNQLc5tkn2BUSg/export?format=csv',
            mapColor: 'https://docs.google.com/spreadsheets/d/1fa4ZvsC3VE6mrOywsCM2H_3H8dGRoskF0LHAEz8-_VY/export?format=csv',
            mapEnemyPop: 'https://docs.google.com/spreadsheets/d/1tKr0LiD74U8PhFlnU6alooSWucwTK0qY6xmm6PnZ6Zc/export?format=csv',
            mapEvent: 'https://docs.google.com/spreadsheets/d/1O08oReBUjC22NyOL-902NcZaZdeGtxj3FNRsBYbkDCY/export?format=csv',
            mapDropPopItem: 'https://docs.google.com/spreadsheets/d/1vrdjApsk2xD-IaNrskusJPwARl7x0KazGLBTy7LTV3o/export?format=csv',
            eventTile: 'https://docs.google.com/spreadsheets/d/1knfjOwpXSkw6HYBdZn7Ugkk73sc88cPSsGLuv1EeMx8/export?format=csv',
            event: 'https://docs.google.com/spreadsheets/d/1Yz0RJs4WuimcoH2Af6c1JclQL46bgGOGj1QUqAnfXPc/export?format=csv',

        };


        this._loadedCount = 0;            // 進捗カウンター
        this._totalToLoad = Object.keys(urls).length;            // 期待ロード数

        const jobs = [
            MagicDataTable.init(urls.magic),
            ItemDataTable.init(urls.item),
            EnemyDataTable.init(urls.enemy),
            WizardDataTable.init(urls.wizard),
            EnemyAIDataTable.init(urls.enemyai),
            MapDataTable.init(urls.mapChip),
            MapColorDataTable.init(urls.mapColor),
            EnemyPopDataTable.init(urls.mapEnemyPop),
            MapEventDataTable.init(urls.mapEvent),
            ItemDropPopDataTable.init(urls.mapDropPopItem),
            EventTileDataTable.init(urls.eventTile),
            EventDataTable.init(urls.event),
        ];

        // すべて終わるまで待つ (失敗があれば catch で拾う)
        await Promise.all(jobs);
    }

    async init() {         // SceneManager が await
        await this._loadTables();
        this._setupGame(); // 旧 init() 本体
    }

    _setupGame() {

        gameMainScene = this;

        this.FPS = 60;
        this.FRAME_TIME = 1000 / this.FPS; // 1000ms ÷ 60fps ≈ 16.6667ms

        this.background = new Background(this.gameArea, this.camera, 60);
        this.CharacterLayer = this.background.characterLayer;

        const playerStartPosition = this.background.getPlayerStart();
        this.wizard = new Wizard(playerStartPosition.x, playerStartPosition.y, this.CharacterLayer, wizardDataTable.get("Wizard1"));


        // HUDの生成
        this.hud = new UIHud(this.gameUiLayer, this.wizard);
        this.hud.updateDisplay();
        this.hud.show();
        // ステータス画面の生成
        this.statusUI = new UIStatus(this.gameUiLayer, this.wizard);
        // デバッグ画面の生成
        const debugUI = new UIDebug(this.gameUiLayer, this.wizard);

        this.magicUI = new UIMagic(this.gameUiLayer, this.wizard);
        const itemList = new UIItemList(this.gameUiLayer, this.wizard);
        //magicUI.update();


        this.EventDialog = new UIEventDialog(this.gameUiLayer);


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
        //this.previousLivingEnemies = [...this.stageManager.enemies];
        // 敵の要素を追跡するためのMap（要素ID -> 要素）
        //this.enemyElementMap = new Map();


        this.lastTime = performance.now();
        this.accumulatedTime = 0; // 経過時間をためるための変数


        this.gameLoop = this.gameLoop.bind(this);
        requestAnimationFrame(this.gameLoop);
        console.log(`[GameMain] constructor end`);


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
        /* 既存のキャラ更新ループの後ろ（最終行近く）に追加 */
        /* プレイヤーを追ってカメラ位置を更新 */
        if (this.wizard) this.camera.update(this.wizard);

        this.background.update(delta);                // ← 必ず先に

        // 登録したpawnsがある時
        while (this.AddNewPawns.length > 0) {
            const ch = this.AddNewPawns.shift();   // 先頭を取り出してキューから削除
            ch.BeginStart();                       // 初期化
            if (ch.UseUpdate) {
                this.pawns.push(ch);                   // 本隊に登録
            }
        }

        for (const ch of this.pawns) {

            ch.setKeyState?.(this.pressedKeys);

            ch.updateMovePre();

            ch.update?.(delta);                     // 各クラス固有ロジック

            for (const hitch of this.pawns) {
                ch.isColliding(hitch);
            }

            ch.updateMoveEnd?.();
        }

        // 削除Pawnがある時
        while (this.ExitPawns.length > 0) {
            const ch = this.ExitPawns.shift();   // 先頭を取り出してキューから削除
            ch.destroy();                       // 削除処理
        }
        this.hud.updateDisplay();
    }

    /**
     * 指定したクラス (constructor) を基準に pawns を抽出する
     * @template {Function} C
     * @param {C} BaseClass  例: EnemyBase, BossBase, PlayerBase …
     * @returns {InstanceType<C>[]}  抽出された Pawn の配列
     */
    getPawnsByClass(BaseClass) {
        return this.pawns.filter(pawn => pawn instanceof BaseClass);
    }

    onEnter() {
    }

    onExit() {
    }
}