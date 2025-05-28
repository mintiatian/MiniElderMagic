// Script/BackgroundCanvas.js
import { TILE_SIZE } from './GameData.js';
import { MapDataTable } from './Utils/DataTable.js';

// 下層レイヤにだけ描き、当たり判定も無視する“床”タイル
const DECOR_TILES = new Set(['🟫', '👣','🌉']);
const DECOR2_TILES = new Set(['🌿', '🌾','🌴','🌳', '🍀','🌲']);

export class Background {
    /**
     * @param {HTMLElement} parentEl   #game-area
     * @param {Camera}      camera
     */
    constructor(parentEl, camera) {
        this.camera = camera;
        this.tile   = TILE_SIZE;
        this.map    = MapDataTable.getMap();

        this.rows   = this.map.length;
        this.cols   = this.map[0].length;

        /* ===== オフスクリーン: ワールド全域を描く ===== */
        const worldW = this.cols * this.tile;
        const worldH = this.rows * this.tile;

        // ── 衝突ありタイル用
        this.worldCanvas        = document.createElement('canvas');
        this.worldCanvas.width  = worldW;
        this.worldCanvas.height = worldH;
        const sctx = this.worldCanvas.getContext('2d');

        // ── 床デコタイル用
        this.decorCanvas        = document.createElement('canvas');
        this.decorCanvas.width  = worldW;
        this.decorCanvas.height = worldH;
        const dctx = this.decorCanvas.getContext('2d');

        // 共通フォント設定
        for (const ctx of [sctx, dctx]) {
            ctx.font = `${this.tile * 0.9}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
        }

        // マップ走査して描き分け
        for (let r = 0; r < this.rows; ++r) {
            for (let c = 0; c < this.cols; ++c) {
                const ch = this.map[r][c];
                if (!ch) continue;
                const x = c * this.tile + this.tile * 0.5;
                const y = r * this.tile + this.tile * 0.5;
                if (DECOR_TILES.has(ch)) dctx.fillText(ch, x, y);
                else                      sctx.fillText(ch, x, y);
            }
        }

        /* ===== ② 表示キャンバス: 画面サイズ分だけ ===== */
        // ※solid(壁) は z=1、decor(床) は z=0
        this.viewCanvas        = document.createElement('canvas'); // 壁レイヤ
        this.decorViewCanvas   = document.createElement('canvas'); // 床レイヤ

        for (const cvs of [this.viewCanvas, this.decorViewCanvas]) {
            cvs.width  = camera.vw;   // baseWidth
            cvs.height = camera.vh;   // baseHeight
        }

        this.ctx       = this.viewCanvas.getContext('2d');
        this.decorCtx  = this.decorViewCanvas.getContext('2d');

        const viewport = parentEl.parentElement;   // <div id="viewport">
        Object.assign(this.decorViewCanvas.style, {
            position:'absolute', left:'0', top:'0', pointerEvents:'none', zIndex:0
        });
        Object.assign(this.viewCanvas.style, {
            position:'absolute', left:'0', top:'0', pointerEvents:'none', zIndex:10
        });

        // 先にデコ→後に壁で DOM stacking-order も自然
        viewport.appendChild(this.decorViewCanvas);
        viewport.appendChild(this.viewCanvas);
    }

    /* 当たり判定：床タイルは false, それ以外で文字があれば true */
    isSolidAt(x, y) {
        const c = Math.floor(x / TILE_SIZE);
        const r = Math.floor(y / TILE_SIZE);
        if (r < 0 || c < 0 || r >= this.rows || c >= this.cols) return true;
        const ch = this.map[r][c];

        if (DECOR2_TILES.has(ch)) {
            return false;
        }
        
        if (DECOR_TILES.has(ch)) return false; // 床タイルは衝突なし
        return !!ch;
    }

    /** 毎フレーム呼ぶ */
    update() {
        const view = this.camera.getViewRect();

        // --- 床レイヤ描画 ---
        this.decorCtx.clearRect(0,0,this.decorViewCanvas.width,this.decorViewCanvas.height);
        this.decorCtx.drawImage(
            this.decorCanvas,
            view.left, view.top,
            view.width, view.height,
            0, 0,
            view.width, view.height
        );

        // --- 壁レイヤ描画 ---
        this.ctx.clearRect(0,0,this.viewCanvas.width,this.viewCanvas.height);
        this.ctx.drawImage(
            this.worldCanvas,
            view.left, view.top,
            view.width, view.height,
            0, 0,
            view.width, view.height
        );
    }
}