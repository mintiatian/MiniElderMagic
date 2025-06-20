// Script/Actor.js
// ───────────────────────────────────────────────────────────────
import {Pawn} from "./Pawn.js";
import {CHAR_SIZE} from "../GameData.js";

/**
 * 汎用アクター基底
 *  - 任意の絵文字キャラ
 *  - オーバーレイ（バリア等）を複数重ねられる
 */
export class Actor extends Pawn {

    constructor(x, y, emoji, parentElement) {
        super(x, y, emoji, CHAR_SIZE, parentElement);

        this.IsActive = true;

        /* ───────── 本体の見た目 ───────── */
        this.element.style.fontSize = `${this.CHAR_SIZE}px`;

        this.face = document.createElement("span");
        this.face.textContent = this.emoji;
        this.element.append(this.face);
        //this.element.textContent = this.emoji;

        this.setSize(CHAR_SIZE);
        /* ───────── オーバーレイ管理 ───────── */
        /** @type {Map<string, {el:HTMLElement, offset:{x:number,y:number}, followRot:boolean}>} */
        this._overlays = new Map();
    }
    
    setSize(size) {
        super.setSize(size);
        this.element.style.fontSize = `${this.CHAR_SIZE}px`;
        //this.element.textContent = this.emoji;
        this.face.textContent = this.emoji;
    }

    // ==================================================================
    // Overlay API
    // ==================================================================

    /**
     * 絵文字 1 つをキャラの中心に重ねる
     * @param {string} emoji      例: '🟡'
     * @param {Object} [opt={}]   追加オプション
     *  ──────────────────────────────────────
     *  duration   : ms  指定すると自動で消滅         (既定 null)
     *  size       : px  絵文字サイズ                 (既定 本体 font-size)
     *  opacity    : 0〜1                            (既定 1)
     *  zDelta     : キャラ z-index + zDelta          (既定 +1)
     *  followRot  : true でキャラ回転に追従          (既定 false)
     *  offset     : {x,y} 中心からのずれ             (既定 {0,0})
     *  id         : 自前で ID 指定したい場合         (既定 自動採番)
     * @returns {string} 生成された overlay ID
     */
    addOverlay(
        emoji,
        {
            duration = null,
            size = null,
            opacity = 0.5,
            zDelta = 1,
            followRot = false,
            offset = {x: 0, y: 0},
            id = `ov-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        } = {}
    ) {
        if (!this.element || !this.element.parentElement) return null;

        /* 要素生成 */
        const el = document.createElement('div');
        el.classList.add('character', 'overlay');
        el.textContent = emoji;
        el.style.position = 'absolute';
        el.style.pointerEvents = 'none';
        el.style.transform = 'translate(-50%, -50%)';
        el.style.opacity = opacity.toString();

        const baseZ = parseInt(getComputedStyle(this.element).zIndex || '3', 10);
        el.style.zIndex = (baseZ + zDelta).toString();

        if (size === null) {
            size = parseFloat(getComputedStyle(this.element).fontSize) || this.CHAR_SIZE;
        }
        el.style.fontSize = `${size}px`;

        /* DOM へ挿入 */
        this.element.parentElement.appendChild(el);
        this._overlays.set(id, {el, offset, followRot});

        /* 初期位置同期 */
        this._updateSingleOverlay(id);

        /* 自動消滅 */
        if (duration) setTimeout(() => this.removeOverlay(id), duration);

        return id;
    }

    /** 指定 ID のオーバーレイを即座に削除 */
    removeOverlay(id) {
        const ov = this._overlays.get(id);
        if (!ov) {
            console.warn(`removeOverlay: id "${id}" not found`);
            return;
        }
        if (ov.el.parentElement){
            console.log(`removeOverlay: id "${id}" kesita 01`);
            ov.el.parentElement.removeChild(ov.el);
        }
        this._overlays.delete(id);

        console.log(`removeOverlay: id "${id}" kesita 02`);
    }

    /** 全オーバーレイを一括更新（毎フレーム呼び出し） */
    updateOverlays() {
        for (const id of this._overlays.keys()) this._updateSingleOverlay(id);
    }

    /** ExitStart などで一括破棄 */
    _cleanupAllOverlays() {
        for (const id of this._overlays.keys()) this.removeOverlay(id);
    }

    /* 内部：オーバーレイ 1 枚を座標合わせ */
    _updateSingleOverlay(id) {
        const ov = this._overlays.get(id);
        if (!ov) return;

        /* ★ getBoundingClientRect は使わずワールド座標を直使用 ★ */
        ov.el.style.left = `${this.x + ov.offset.x}px`;
        ov.el.style.top = `${this.y + ov.offset.y}px`;

        if (ov.followRot) {
            const angle = Math.atan2(this.dirY, this.dirX) * 180 / Math.PI;
            ov.el.style.transform =
                `translate(-50%, -50%) rotate(${angle}deg)`;
        }
    }

    // ==================================================================
    // 更新／終了フック
    // ==================================================================

    /** フレーム毎更新：Pawn 側の update を呼んだあとオーバーレイ追従 */
    update(delta) {
        super.update?.(delta);     // Pawn に update があれば実行
        this.updateOverlays();     // オーバーレイを追従
    }

    /** シーン離脱時の後始末 */
    ExitStart() {
        if(this.CanRespown === false){
            this._cleanupAllOverlays(); // 残骸を残さない
        }
        super.ExitStart?.();
    }
}
