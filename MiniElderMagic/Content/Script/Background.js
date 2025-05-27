// Script/Background.js
import { TILE_SIZE } from './GameData.js';
import { Terrain   } from './Actor/Terrain.js';
import {MapDataTable} from "./Utils/DataTable.js";

/**
 * 背景マップを Terrain Actor の集合として組み立てる
 *  - フレームの内側いっぱいにタイルを敷く
 *  - 最外周 1 タイルを 🪨 で囲み、内部は空地
 */
export class Background {
    /**
     * @param {HTMLElement} gameArea 親 DOM (#game-area)
     * @param {number}      tileSize 1 タイルの辺 [px]
     */
    constructor(gameArea, tileSize = TILE_SIZE) {
        this.gameArea = gameArea;
        this.tileSize = tileSize;              // 60px

        /* 1. 画面実サイズ (1920×1080) を取得
           transform でスケールされても clientWidth/Height は論理値を返す */
        const widthPx  = gameArea.clientWidth  || 1920;
        const heightPx = gameArea.clientHeight || 1080;

        /* 2. グリッド数を算出 (端数切り捨て) */
        this.cols = Math.floor(widthPx  / this.tileSize); // = 32
        this.rows = Math.floor(heightPx / this.tileSize); // = 18

        /* 3. 外枠 1 マスを 🪨、内部を空地にした mapData を動的生成 */
        // 32*18
        /*this.mapData = Array.from({ length: this.rows }, (_r, r) =>
            Array.from({ length: this.cols }, (_c, c) =>
                (r === 0 || r === this.rows - 1 || c === 0 || c === this.cols - 1)
                    ? '🪨'   // 四辺を岩タイルで壁に
                    : ''     // 内部は空地
            )
        );
        */
        this.mapData = MapDataTable.getMap();          // 32×18 配列

        /** @type {Terrain[]} 生成済み Terrain 役者 */
        this.terrainActors = [];

        this.#buildTerrainActors();            // ここですべて生成
    }

    /** タイルごとに Terrain Actor を作成 */
    #buildTerrainActors() {
        this.mapData.forEach((row, r) => {
            row.forEach((cell, c) => {
                if (!cell) return;                 // 空地はスキップ

                /* マップセル左上 → 中心座標へ */
                const x = c * this.tileSize + this.tileSize * 0.5;
                const y = r * this.tileSize + this.tileSize * 0.5;

                const tile = new Terrain(x, y, cell, this.gameArea);
                this.terrainActors.push(tile);
            });
        });
    }

    /** GameMain でまとめて push するためのアクセサ */
    getActors() {
        return this.terrainActors;
    }
}
