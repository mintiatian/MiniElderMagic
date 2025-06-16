import {Wizard} from '../Character/Wizard.js';
import {Background} from '../Background.js';

import {UIHud} from '../UI/UIHud.js';
import {UIStatus} from '../UI/UIStatus.js'; // ステータス画面クラスをインポート
import {UIMagic} from '../UI/UIMagic.js';
import { TitleScene } from './TitleScene.js';
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

import { SceneManagerInstance } from './SceneManager.js';
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

    /* ====================================================================
     *  GameMainScene._setupGame
     *  ────────────────────────────────────────────────────────────────── */
    /* ====================================================================
     *  GameMainScene._setupGame  –  ゲーム世界だけを初期化
     * ==================================================================== */
    /* ====================================================================
     *  GameMainScene._setupGame  –  ゲーム世界＋HUD を初期化
     * ==================================================================== */
    _setupGame () {

        /* 0. まずはグローバル参照を立てて  Pawn / Background から使えるように */
        gameMainScene = this;

        /* 1. タイムステップ初期化（固定 60 FPS） */
        this.FPS           = 60;
        this.FRAME_TIME    = 1000 / this.FPS;   // ms
        this.accumulatedMs = 0;
        this.lastTime      = performance.now();

        /* 2. 背景レイヤとカメラ紐付け */
        this.background     = new Background(this.gameArea, this.camera, 60);
        this.CharacterLayer = this.background.characterLayer;

        /* 3. プレイヤー生成 → 登録キューへ */
        const { x, y } = this.background.getPlayerStart();
        this.wizard     = new Wizard(
            x, y,
            this.CharacterLayer,
            wizardDataTable.get('Wizard1')
        );
        this.AddNewPawns.push(this.wizard);   // ★必須：更新ループに載せる

        /* 4. ゲーム内管理配列と入力状態リセット */
        this.pawns       = [];
        this.ExitPawns   = [];
        this.pressedKeys = {};

        /* 5. 必須 UI（HUD / Status / Magic）はここで生成
          　　→ updateGame() がすぐ使える                         */
        this.hud       = new UIHud(this.gameUiLayer, this.wizard);
        this.statusUI  = new UIStatus(this.gameUiLayer, this.wizard);
        this.magicUI   = new UIMagic(this.gameUiLayer, this.wizard);
        this.debugUI   = null;   // debugUI は onEnter() で toggle 用に生成

        /* 6. 任意：初期敵ポップやイベント設置
           - EnemyPopDataTable.populateStage(...)
           - MapEventDataTable.setupEvents(...)
         */

        console.log('[GameMainScene] world setup complete');
    }


    /* ==================================================================== */

    


    update(dtSec){    // 固定 60fps シミュレーション用にミリ秒へ変換
        this.accumulatedMs += dtSec * 1000;
        while(this.accumulatedMs >= this.FRAME_TIME){   // FRAME_TIME = 16.666…
            this.updateGame(this.FRAME_TIME);           // ←既存ロジック
            this.accumulatedMs -= this.FRAME_TIME;
        }
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


        /* ── FPS 計測 ────────────────────────────── */
        this._fpsSum   += 1000 / delta;   // deltaMs は 16.67ms 固定
        this._fpsCount += 1;

        if (this._fpsCount >= 30){          // 0.5 秒おき (60fps想定)
            const ave = (this._fpsSum / this._fpsCount).toFixed(1);
            this.fpsLabel.textContent = `FPS: ${ave}`;
            this._fpsSum = this._fpsCount = 0;
        }
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

    onEnter(){
        // デバッグ UI は onEnter で生成しておく（toggle 用参照）
        this.itemList = new UIItemList(this.gameUiLayer, this.wizard);
        this.eventDialog = new UIEventDialog(this.gameUiLayer);   // ← lower-camel に統一
        this.eventDialog.hide();    // 既定は非表示に
        /* 共通ハンドラ */
        this._handleKey = (e,isDown)=>{
            const k = e.key.toLowerCase();
            if (k === 'escape' && isDown) { SceneManagerInstance.change(new TitleScene(this.gameArea, this.gameUiLayer)); return; }

            /* ── 特殊キー ───────────────── */
            if(k==='tab'){              // Tab はブラウザのフォーカス移動を止める
                e.preventDefault();
            }
            if(k==='o' && isDown){      // デバッグ UI 切替は押下時だけ
                this.debugUI.toggle();
                return;                 // pressedKeys には入れない
            }
            if(k==='p' && isDown){
                // shop.show();          // 将来使うならここ
                return;
            }

            /* ── 汎用入力フラグ更新 ───────── */
            this.pressedKeys[k] = isDown;

            /* Arrow ↔ WASD */
            const dirMap = {arrowup:'w', arrowdown:'s', arrowleft:'a', arrowright:'d'};
            if(dirMap[k]) this.pressedKeys[dirMap[k]] = isDown;

            /* Shift → run */
            if(k==='shift') this.pressedKeys.run = isDown;

            /* Ability */
            const abMap = {q:'ability1', e:'ability2', r:'ability3', f:'ability4'};
            if(abMap[k]) this.pressedKeys[abMap[k]] = isDown;

            /* Magic (0-9) */
            if('1234567890'.includes(k)) this.pressedKeys['magic'+k] = isDown;
        };

        /* イベント登録 */
        this._down = e => this._handleKey(e,true);
        this._up   = e => this._handleKey(e,false);
        document.addEventListener('keydown', this._down);
        document.addEventListener('keyup',   this._up);


        /* ── FPS ラベルを作成 ────────────────────────── */
        this.fpsLabel = document.createElement('div');
        Object.assign(this.fpsLabel.style, {
            position: 'absolute',
            top: '4px',
            left: '8px',
            color: '#0f0',
            font: 'bold 14px monospace',
            pointerEvents: 'none',
            textShadow: '0 0 4px #000',
            zIndex: 9999,
        });
        this.fpsLabel.textContent = 'FPS: 0';
        this.gameUiLayer.appendChild(this.fpsLabel);

        /* 平均 FPS 用カウンタ初期化 */
        this._fpsSum   = 0;
        this._fpsCount = 0;
    }

    /* ---------- onExit() ---------- */

    onExit(){
        /* ── リスナー解除 ─────────────────────── */
        document.removeEventListener('keydown', this._down);
        document.removeEventListener('keyup',   this._up);

        /* ── UI / DOM を完全クリーンアップ ───── */
        this.fpsLabel?.remove();
        this.itemList?.remove?.();        // hide() でも可
        this.eventDialog?.remove?.();
        this.debugUI?.remove?.();

        this.gameUiLayer.innerHTML = '';
        this.gameArea.innerHTML    = '';

        /* ── 配列・状態をリセット ─────────────── */
        this.pawns.length =
            this.AddNewPawns.length =
                this.ExitPawns.length = 0;
        this.pressedKeys = {};

        this.background = null;
        this.wizard     = null;

        /* ── 次シーンの dt スパイク防止 (任意) ─ */
        SceneManagerInstance._last = performance.now();

        gameMainScene = null;
    }

}