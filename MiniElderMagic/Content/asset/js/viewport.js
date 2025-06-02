/* -------------------------------------------------
 *  ビューポート（ズーム・パン）管理
 * ------------------------------------------------- */
import {MIN_CELL, MAX_CELL} from "./constants.js";

export class Viewport {
    /**
     * @param {HTMLElement} viewportEl
     * @param {HTMLElement} overlayEl
     */
    constructor(viewportEl, overlayEl) {
        this.el = viewportEl;
        this.overlay = overlayEl;
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;

        /* ★ ① 追加 – ビューポート中央寄せユーティリティ
            *    読み込み直後など 1 回だけ呼び出します。*/
        this.centerView = (worldW, worldH) => {
            this.el.scrollLeft = Math.max(0, (worldW - this.el.clientWidth) / 2);
            this.el.scrollTop = Math.max(0, (worldH - this.el.clientHeight) / 2);
        };

        this._bindEvents();


        /* ★ ⑤ 追加 – ワールドがビューポートより小さい時だけ中央に配置
 *    (scale 適用後の worldW/H を渡す) */

        this.applyWorldOffset = (worldW, worldH) => {
            const offsetX = (worldW < this.el.clientWidth)
                ? (this.el.clientWidth - worldW) / 2
                : 0;
            const offsetY = (worldH < this.el.clientHeight)
                ? (this.el.clientHeight - worldH) / 2
                : 0;
            this.offsetX = offsetX;
            this.offsetY = offsetY;
            // Canvas レイヤ & オーバーレイをまとめて移動
            [...this.el.querySelectorAll('.canvas-layer, #overlay')]
                .forEach(el => {
                    el.style.left = offsetX + 'px';
                    el.style.top = offsetY + 'px';
                });
        };
    }

    /** クライアント座標 → セル座標 */
    clientToCell(ev, cellSize) {
        const rect = this.el.getBoundingClientRect();
        const x = (ev.clientX - rect.left + this.el.scrollLeft - this.offsetX) / this.scale;
        const y = (ev.clientY - rect.top  + this.el.scrollTop  - this.offsetY) / this.scale;
        return [Math.floor(y / cellSize), Math.floor(x / cellSize)];
    }

    /* 既存 constructor の下あたり */
    /** ビューポート中央にワールドを寄せる */
    centerView(worldW, worldH) {
        this.el.scrollLeft = Math.max(0, (worldW - this.el.clientWidth) / 2);
        this.el.scrollTop = Math.max(0, (worldH - this.el.clientHeight) / 2);
    }




    _bindEvents() {
        // ホイールズーム
        this.el.addEventListener("wheel", ev => {
            ev.preventDefault();
            const factor = ev.deltaY < 0 ? 1.1 : 0.9;
            const newScale = Math.max(MIN_CELL / 32, Math.min(4, this.scale * factor));
            if (newScale === this.scale) return;

            const rect = this.el.getBoundingClientRect();
            const mx = ev.clientX - rect.left + this.el.scrollLeft;
            const my = ev.clientY - rect.top + this.el.scrollTop;
            const ratio = newScale / this.scale;

            this.scale = newScale;
            [...this.el.querySelectorAll(".canvas-layer")].forEach(
                c => (c.style.transform = `scale(${this.scale})`));
            this.overlay.style.transform = `scale(${this.scale})`;


            /* ★ ② 差し替え – マウス下セルを維持しつつパン。
 *     さらにスクロール範囲をクランプして“行き過ぎ”を防止 */
            this.el.scrollLeft = mx * ratio - (ev.clientX - rect.left);
            this.el.scrollTop = my * ratio - (ev.clientY - rect.top);

            const worldW = this.overlay.width * this.scale;
            const worldH = this.overlay.height * this.scale;
            const maxX = Math.max(0, worldW - this.el.clientWidth);
            const maxY = Math.max(0, worldH - this.el.clientHeight);
            this.el.scrollLeft = Math.min(Math.max(0, this.el.scrollLeft), maxX);
            this.el.scrollTop = Math.min(Math.max(0, this.el.scrollTop), maxY);

            /* ★ ③ オプション – ワールドがビューポートより小さくなったら中央に寄せる */
            if (worldW <= this.el.clientWidth) this.el.scrollLeft = (worldW - this.el.clientWidth) / 2;
            if (worldH <= this.el.clientHeight) this.el.scrollTop = (worldH - this.el.clientHeight) / 2;

                        /* ★ ⑥ 追加 – ワールドが小さいときだけビューポート中央に見せる */
                           this.applyWorldOffset(worldW, worldH);
        });
    }
}
