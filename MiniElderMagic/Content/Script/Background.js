// Script/BackgroundCanvas.js
// ------------------------------------------------------------
// 背景レイヤをまとめて扱うクラス。
// 1. カラーレイヤ（最背面）      … mapColor のパレットで塗りつぶし
// 2. 床デコレイヤ（背景）       … DECOR_TILES（🟫👣🌉）など、当たり判定なし
// 3. キャラクターレイヤ（中間）  … ゲーム側で動的にキャラクターを配置する DIV
// 4. 前面タイルレイヤ（最前面）  … 通常タイル／DECOR2_TILES（🌿🌳…）など
// ------------------------------------------------------------
import {TILE_SIZE} from './GameData.js';
import {
    MapDataTable,
    MapColorDataTable,
    EnemyPopDataTable,
    enemyDataTable,
    enemyAIDataTable,
    EventDataTable,
    MapEventDataTable,
    ItemDropPopDataTable,
    ItemDataTable        // ★ 色データテーブル
} from './Utils/DataTable.js';

import {EnemyBase} from './Character/EnemyBase.js';
import {CharacterDataTable} from './Utils/DataTable.js';
import {gameMain} from './GameMain.js';

// 下層レイヤにだけ描き、当たり判定も無視する “床” タイル
const DECOR_TILES = new Set(['🟫', '👣', '🌉', '🏠', '🏡', '🏕️']);               // キャラの下 / 踏める
const DECOR2_TILES = new Set(['🌿', '🌾', '🌴', '🌳', '🍀', '🌲']); // キャラの上 / 衝突なし

// アイテムで船を持っていたら
// アイテムの🚢を持っていたら🌊の上に乗れる
// 水の上をのタイルに乗ったらWizardが🚢に変わるそれ以外では魔法使いの絵文字


const ENEMY_ONLYWALL_TILES = new Set(['🟫']);               // キャラの下 / 踏める

export class Background {


    DECOR_TILES_VOLCANO = new Set(['🌋']);
    DECOR_TILES_DESERT = new Set(['🟨']);
    DECOR_TILES_ICE = new Set(['🟦', '⬜']);
    DECOR_TILES_SEA = new Set(['🌊']);
    DECOR_TILES_SKY = new Set(['🗻']);


    /**
     * @param {HTMLElement} gameArea #game-area
     * @param {Camera}      camera   カメラ（ワールド→ビューポート座標変換用）
     */
    constructor(gameArea, camera) {
        this.gameArea = gameArea;
        this.camera = camera;

        /* ===== データ読み込み ===== */
        this.tile = TILE_SIZE;
        this.map = MapDataTable.getMap();          // 2D 配列: タイル文字列
        this.mapColor = MapColorDataTable.getMap();     // 2D 配列: '#rrggbb' or '' (透明)
        this.mapEnemyPop = EnemyPopDataTable.getMap();     // なんのエネミーがPopするかの情報
        this.mapEvent = MapEventDataTable.getMap();
        this.mapItemDropPop = ItemDropPopDataTable.getMap();

        this.CurrentPopCount = 0;
        this.MinPopRadius = 300;
        this.MaxPopRadius = 800;
        // 基本寸法
        this.rows = this.map.length;
        this.cols = this.map[0].length;
        const worldW = this.cols * this.tile;
        const worldH = this.rows * this.tile;

        /* ===== ① カラーレイヤ（最背面） ===== */
        this.colorLayer = document.createElement('canvas');
        Object.assign(this.colorLayer, {
            id: 'Background_ColorLayer',
            width: worldW,
            height: worldH,
        });
        Object.assign(this.colorLayer.style, {
            position: 'absolute',
            zIndex: '0',
            left: '0',
            top: '0',
        });
        this.gameArea.appendChild(this.colorLayer);
        const cctx = this.colorLayer.getContext('2d');

        /* ===== ② 衝突なしタイル（床デコ） ===== */
        this.backgroundLayer = document.createElement('canvas');
        Object.assign(this.backgroundLayer, {
            id: 'Background_FloorLayer',
            width: worldW,
            height: worldH,
        });
        Object.assign(this.backgroundLayer.style, {
            position: 'absolute',
            zIndex: '1',
            left: '0',
            top: '0',
        });
        this.gameArea.appendChild(this.backgroundLayer);
        const floorCtx = this.backgroundLayer.getContext('2d');

        /* ===== ③ キャラクターレイヤ（動的） ===== */
        this.characterLayer = document.createElement('div');
        Object.assign(this.characterLayer, {id: 'Background_CharacterLayer'});
        Object.assign(this.characterLayer.style, {
            position: 'absolute',
            zIndex: '100',
            left: '0',
            top: '0',
            width: `${worldW}px`,
            height: `${worldH}px`,
        });
        this.gameArea.appendChild(this.characterLayer);

        /* ===== ④ 前面タイルレイヤ（最前面） ===== */
        this.frontLayer = document.createElement('canvas');
        Object.assign(this.frontLayer, {
            id: 'Background_FrontLayer',
            width: worldW,
            height: worldH,
        });
        Object.assign(this.frontLayer.style, {
            position: 'absolute',
            zIndex: '1000',
            left: '0',
            top: '0',
        });
        this.gameArea.appendChild(this.frontLayer);
        const frontCtx = this.frontLayer.getContext('2d');

        /* ===== 共通フォント設定 ===== */
        for (const ctx of [floorCtx, frontCtx]) {
            ctx.font = `${this.tile * 0.9}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
        }

        /* =========================================================
         * ワールド全域を一括で描画
         * =======================================================*/
        for (let r = 0; r < this.rows; ++r) {
            for (let c = 0; c < this.cols; ++c) {
                const px = c * this.tile;
                const py = r * this.tile;
                const cx = px + this.tile * 0.5;
                const cy = py + this.tile * 0.5;

                /* ---- ① カラーパレット塗り ---- */
                const colorCode = this.mapColor?.[r]?.[c] ?? '';
                if (colorCode) {
                    cctx.fillStyle = colorCode;
                    cctx.fillRect(px, py, this.tile, this.tile);
                }

                /* ---- ② タイル絵文字描画 ---- */
                const ch = this.map?.[r]?.[c];
                if (!ch) continue;


                if (this.DECOR_TILES_VOLCANO.has(ch)) {
                    // 床デコ（衝突なし・キャラの下）
                    floorCtx.fillText(ch, cx, cy);
                } else if (this.DECOR_TILES_DESERT.has(ch)) {
                    // 床デコ（衝突なし・キャラの下）
                    floorCtx.fillText(ch, cx, cy);
                } else if (this.DECOR_TILES_ICE.has(ch)) {
                    // 床デコ（衝突なし・キャラの下）
                    floorCtx.fillText(ch, cx, cy);
                } else if (this.DECOR_TILES_SKY.has(ch)) {
                    // 床デコ（衝突なし・キャラの下）
                    floorCtx.fillText(ch, cx, cy);
                } else if (this.DECOR_TILES_SEA.has(ch)) {
                    // 床デコ（衝突なし・キャラの下）
                    floorCtx.fillText(ch, cx, cy);
                } else if (DECOR_TILES.has(ch)) {
                    // 床デコ（衝突なし・キャラの下）
                    floorCtx.fillText(ch, cx, cy);
                } else {
                    // 通常／DECOR2 タイル（キャラの上）
                    frontCtx.fillText(ch, cx, cy);
                }
            }
        }

        this.popTimer = 0;
        this.MAXBASE_POP_COUNT = 5;
        this.PopTimerMax = 3000;
        this.PopTimerMin = 2000;
        this.popTimer = this.PopTimerMax;


    }

    // プレイヤーから離れたエネミーは消す
    // this.CurrentPopCount カウントをリセット

    popDoEnemyFromPawn(delta, Pawn) {

        this.popTimer -= delta;
        //console.log(this.popTimer);
        if (this.popTimer <= 0) {
            this.popTimer = this.PopTimerMax - (gameMain.wizard.status.shopBuyCount / 30);
            this.popTimer = Math.max(this.PopTimerMin, this.PopTimerMax);
            this.popDoEnemy(Pawn.x, Pawn.y);
        }
    }

    /**
     * 指定座標（たとえばプレイヤー位置）を中心に、
     * 最小～最大半径のリング内へエネミーをスポーンする
     * @param {number} x ワールド X 座標
     * @param {number} y ワールド Y 座標
     */
    popDoEnemy(x, y) {
        const MAX_POP_COUNT = this.MAXBASE_POP_COUNT * (1.0 + gameMain.wizard.status.shopBuyCount / 30);                         // 同時出現上限


        if (this.CurrentPopCount >= MAX_POP_COUNT) return;

        // 最大 20 回だけ配置場所を試行
        for (let tryCnt = 0; tryCnt < 20; ++tryCnt) {
            // ---- ランダムな極座標 → ワールド座標へ ----
            const radius = this.MinPopRadius +
                Math.random() * (this.MaxPopRadius - this.MinPopRadius);
            const theta = Math.random() * Math.PI * 2;

            const spawnX = x + radius * Math.cos(theta);
            const spawnY = y + radius * Math.sin(theta);

            // マップ範囲外・衝突タイル上は NG
            if (this.isSolidAt(spawnX, spawnY)) continue;

            const pos = this.getTilePos(spawnX, spawnY);
            const enemyEmoji = this.getMapValue('enemyPop', spawnX, spawnY);   // ←★★ここ
            if (!enemyEmoji) continue;


            const extraItemEmoji = this.getMapValue('itemDropPop', spawnX, spawnY);

            // ItemデータからIDを取得する
            const extraDropID = ItemDataTable.getIdByEmoji(extraItemEmoji);


            // 生成に成功したらカウントを進めて終了
            if (this.CreateEnemy(pos.row, pos.col, enemyEmoji, extraDropID)) {
                ++this.CurrentPopCount;
                break;
            }
        }
    }

    /* =========================================================
     * ① ワールド座標 → タイル座標(row, col) 変換
     * =======================================================*/
    /**
     * 指定ワールド座標 (x, y) が属するタイル位置を返す
     * @param {number} x  ワールド X 座標
     * @param {number} y  ワールド Y 座標
     * @returns {{row:number, col:number, inBounds:boolean}}
     *          マップ外なら inBounds が false
     */
    getTilePos(x, y) {
        const col = Math.floor(x / this.tile);
        const row = Math.floor(y / this.tile);
        const inBounds = !(row < 0 || col < 0 || row >= this.rows || col >= this.cols);
        return {row, col, inBounds};
    }

    /* =========================================================
     * ② 任意マップテーブルから値を取り出す
     * =======================================================*/
    /**
     * 'tile' | 'color' | 'enemyPop' | 'event' のいずれかを指定して
     * 対応するテーブルの値を取得する
     * @param {'tile'|'color'|'enemyPop'|'event'|'itemDropPop'} type
     * @param {number} row
     * @param {number} col
     * @returns {string|null}  存在しなければ null
     */
    getMapValue(type, x, y) {
        const {row, col, inBounds} = this.getTilePos(x, y);

        let table;
        switch (type) {
            case 'tile':
                table = this.map;
                break;
            case 'color':
                table = this.mapColor;
                break;
            case 'enemyPop':
                table = this.mapEnemyPop;
                break;
            case 'event':
                table = this.mapEvent;
                break;
            case 'itemDropPop':
                table = this.mapItemDropPop;
                break;
            default:
                console.warn(`getMapValue: 不明な type '${type}'`);
                return null;
        }

        // テーブルが存在しない、または範囲外なら null
        if (!table?.[row]?.[col]) return null;
        return table[row][col];
    }


    /**
     * タイル座標を受け取り、EnemyBase を生成して GameMain へ登録
     * @param {number} r タイル行
     * @param {number} c タイル列
     * @param {string} emoji Pop マップに書かれていた絵文字
     * @param {string} extraDropID Pop マップに書かれていた追加Drop情報
     * @returns {boolean} 生成に成功したか
     */
    CreateEnemy(r, c, emoji, extraDropID) {
        // 絵文字 → CharacterDataTable 行を検索
        let enemyData = null;
        let enemyId = "INVADER";
        for (const data of enemyDataTable.table.values()) {
            if (data.emoji === emoji) {
                enemyData = data;
                break;
            }
        }
        if (!enemyData) {
            console.warn(`CreateEnemy: 該当キャラデータがありません (${emoji})`);
            return false;
        }

        // タイル中央座標に配置
        const worldX = c * this.tile + this.tile * 0.5;
        const worldY = r * this.tile + this.tile * 0.5;

        const enemy = new EnemyBase(worldX, worldY, this.characterLayer, enemyData, extraDropID);

        const enemyAIData = enemyAIDataTable.get(enemyId);
        enemy.SetAIData(enemyAIData);
        enemy.setPlayerTarget(gameMain.wizard);

        enemy.on('destroyed', enemy => {
            this.CurrentPopCount--;
        });

        return true;
    }


    /**
     * @param {number}  x
     * @param {number}  y
     * @param {boolean} [forEnemy=false]  true のとき敵用コリジョン判定
     */
    isSolidAt(x, y, forEnemy = false) {
        // ワールド座標 → タイル情報
        const {row: r, col: c, inBounds} = this.getTilePos(x, y);
        if (!inBounds) return true;

        const ch = this.getMapValue('tile', x, y);   // ←★★ここ
        if (!ch) return false;          // 空白は通過

        /* ===== 敵専用の衝突判定 ===== */
        if (forEnemy) {
            // 敵が引っ掛かるのは ENEMY_ONLYWALL_TILES に列挙されたタイルのみ
            // （それ以外のタイル・空白・イベント・デコは通過可）
            if (ENEMY_ONLYWALL_TILES.has(ch)) {
                return true;
            }
        }


        if (gameMain.Inventory.hasItem("🐦", 1) || gameMain.Inventory.hasItem("🦉", 1)) {
            if (this.DECOR_TILES_VOLCANO.has(ch)) return false;
        }
        if (gameMain.Inventory.hasItem("🐫", 1) || gameMain.Inventory.hasItem("🦉", 1)) {
            if (this.DECOR_TILES_DESERT.has(ch)) return false;
        }
        if (gameMain.Inventory.hasItem("🛷", 1) || gameMain.Inventory.hasItem("🦉", 1)) {
            if (this.DECOR_TILES_ICE.has(ch)) return false;
        }
        if (gameMain.Inventory.hasItem("🦅", 1) || gameMain.Inventory.hasItem("🦉", 1)) {
            if (this.DECOR_TILES_SKY.has(ch)) return false;
        }
        if (gameMain.Inventory.hasItem("⛵", 1) || gameMain.Inventory.hasItem("🦉", 1)) {
            if (this.DECOR_TILES_SEA.has(ch)) return false;
        }
        if (DECOR_TILES.has(ch)) return false;
        return !DECOR2_TILES.has(ch);   // それ以外は壁扱い
    }


    /** カメラ追従やアニメ付きタイルを入れる場合に毎フレーム呼ぶ想定 */
    update(delta) {
        // 例: カメラのビューポートに合わせてレイヤを translate
        const view = this.camera.getViewRect(); // {x,y,w,h}
        const offsetX = -view.x;
        const offsetY = -view.y;

        // すべてのレイヤを同じだけ移動
        for (const layer of [this.colorLayer,
            this.backgroundLayer,
            this.characterLayer,
            this.frontLayer]) {
            layer.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        }

        this.popDoEnemyFromPawn(delta, gameMain.wizard);

    }
}
