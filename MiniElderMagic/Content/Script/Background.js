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
    MapColorDataTable, EnemyPopDataTable, enemyDataTable, enemyAIDataTable,        // ★ 色データテーブル
} from './Utils/DataTable.js';

import {EnemyBase} from './Character/EnemyBase.js';
import {CharacterDataTable} from './Utils/DataTable.js';
import {gameMain} from './GameMain.js';

// 下層レイヤにだけ描き、当たり判定も無視する “床” タイル
const DECOR_TILES = new Set(['🟫', '👣', '🌉']);               // キャラの下 / 踏める
const DECOR2_TILES = new Set(['🌿', '🌾', '🌴', '🌳', '🍀', '🌲']); // キャラの上 / 衝突なし

const ENEMY_ONLYWALL_TILES = new Set(['🟫']);               // キャラの下 / 踏める
const EVENT_TILES = new Set(['🏠', '🏡', '🏕️']);               // キャラの下 / 踏める
export class Background {
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


                if (DECOR_TILES.has(ch)) {
                    // 床デコ（衝突なし・キャラの下）
                    floorCtx.fillText(ch, cx, cy);
                } else if (EVENT_TILES.has(ch)) {
                    // 床デコ（衝突なし・キャラの下）
                    floorCtx.fillText(ch, cx, cy);
                } else {
                    // 通常／DECOR2 タイル（キャラの上）
                    frontCtx.fillText(ch, cx, cy);
                }
            }
        }

        this.popTimer = 0;
        this.PopTimerMax = 3000;
        this.popTimer = this.PopTimerMax;


    }

    // プレイヤーから離れたエネミーは消す
    // this.CurrentPopCount カウントをリセット

    popDoEnemyFromPawn(delta, Pawn) {

        this.popTimer -= delta;
        //console.log(this.popTimer);
        if (this.popTimer <= 0) {
            this.popTimer = this.PopTimerMax;
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
        const MAX_POP_COUNT = 5 * (1.0 + gameMain.wizard.status.shopBuyCount / 30);                         // 同時出現上限


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

            const c = Math.floor(spawnX / this.tile);
            const r = Math.floor(spawnY / this.tile);

            // Pop テーブルに敵が設定されていないマスはスキップ
            const enemyEmoji = this.mapEnemyPop?.[r]?.[c] ?? '';
            if (!enemyEmoji) continue;

            // 生成に成功したらカウントを進めて終了
            if (this.CreateEnemy(r, c, enemyEmoji)) {
                ++this.CurrentPopCount;
                break;
            }
        }
    }

    /**
     * タイル座標を受け取り、EnemyBase を生成して GameMain へ登録
     * @param {number} r タイル行
     * @param {number} c タイル列
     * @param {string} emoji Pop マップに書かれていた絵文字
     * @returns {boolean} 生成に成功したか
     */
    CreateEnemy(r, c, emoji) {
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

        const enemy = new EnemyBase(worldX, worldY, this.characterLayer, enemyData);

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
        const c = Math.floor(x / this.tile);
        const r = Math.floor(y / this.tile);

        if (r < 0 || c < 0 || r >= this.rows || c >= this.cols) return true;

        const ch = this.map[r][c];
        if (!ch) return false;          // 空白は通過

        /* ===== 敵専用の衝突判定 ===== */
        if (forEnemy) {
            // 敵が引っ掛かるのは ENEMY_ONLYWALL_TILES に列挙されたタイルのみ
            // （それ以外のタイル・空白・イベント・デコは通過可）
            if (ENEMY_ONLYWALL_TILES.has(ch)){
                return true;  
            } 
        }

        if (DECOR_TILES.has(ch)) return false;
        if (EVENT_TILES.has(ch)) {
            if (gameMain.wizard) gameMain.wizard.eventTile = ch;
            return false;
        }
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
