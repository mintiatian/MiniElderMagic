import {gameMainScene} from "../Scene/GameMainScene.js";
import {BaseAnime} from "./BaseAnime.js";

export const CollisionType = Object.freeze({
    COLLISION: 'collision', // 物理的に Block／反射する
    TRIGGER: 'trigger',   // 重なりを検出してイベントだけ発火
    NO_COLLISION: 'no_collision',
});

export class Pawn extends BaseAnime {
    /**
     * @param {number}      x              X 座標(px)
     * @param {number}      y              Y 座標(px)
     */
    constructor(x, y, emoji, CHAR_SIZE, parentElement) {
        super(emoji, parentElement)
        if (!parentElement) {
            console.error('parentElement is null : Pawn');
        }
        if (!parentElement) {
            return;
        }

        this.x = x;
        this.y = y;

        this.preX = this.x;
        this.preY = this.y;

        // true にすると当たり判定円を表示
        this.DEBUG_COLLISION = false;

        /* ====== デバッグ円要素 ====== */

        if (this.DEBUG_COLLISION) {
            this.debugCircle = document.createElement('div');
        }


        this.touches = [];

        this.moveX = 0;
        this.moveY = 0;

        this.radian = 0;
        this.acceleration = 0;
        this.strafe = 0;
        this.teamId = 'neutral';

        // キャラクターが既に消えているかどうかを管理するフラグ
        this.isFadingOut = false;

        this.element.classList.add('character');
        this.element.style.transform = 'translate(-50%, -50%)'; // 中心を基準に配置
        this.element.style.textAlign = 'center'; // テキストを中央揃え
        this.element.style.display = 'flex';
        this.element.style.justifyContent = 'center';
        this.element.style.alignItems = 'center';

        this.element.style.left = this.x + 'px';
        this.element.style.top = this.y + 'px';


        this.setCollisionType(CollisionType.COLLISION);


        if (!this.parentElement) {
            return;
        }

        try {

            if (this.DEBUG_COLLISION) {
                this.parentElement?.appendChild(this.debugCircle);
            }
            this.parentElement?.appendChild(this.element);

        } catch (e) {
            console.error(e);
            return;
        }

        this.UseUpdate = true;
        gameMainScene.AddNewPawns.push(this);
    }

    // --- 背景タイル衝突判定 ---------------------------------
    hitsWall(px, py, forEnemy = false) {
        if (!gameMainScene.background) return false;
        const r = this.r - 1;
        return (
            gameMainScene.background.isSolidAt(px - r, py, forEnemy) ||
            gameMainScene.background.isSolidAt(px + r, py, forEnemy) ||
            gameMainScene.background.isSolidAt(px, py - r, forEnemy) ||
            gameMainScene.background.isSolidAt(px, py + r, forEnemy)
        );
    }

    setSize(CHAR_SIZE) {

        this.CHAR_SIZE = CHAR_SIZE;
        this.r = CHAR_SIZE * 0.5;

        if (this.DEBUG_COLLISION) {
            this.debugCircle.style.cssText = `
              position:absolute;
              border:1px dashed red;
              border-radius:50%;
              pointer-events:none;   /* クリック透過 */
              display:${this.DEBUG_COLLISION ? 'block' : 'none'};
              width:${this.r * 2}px;
              height:${this.r * 2}px;
              transform:translate(-50%,-50%); /* 中心合わせ用 */
        `;
        }
    }

    setDir(radian) {
        this.radian = radian;
    }

    setAcceleration(acceleration) {
        this.acceleration = acceleration;
    }

    setCollisionType(type) {
        this.collisionType = type;

        if (this.DEBUG_COLLISION) {

            switch (this.collisionType) {
                case CollisionType.COLLISION:
                    this.debugCircle.style.border = '1px dashed red';
                    break;
                case CollisionType.TRIGGER:
                    this.debugCircle.style.border = '1px dashed yellow';
                    break;
                case CollisionType.NO_COLLISION:
                    this.debugCircle.style.border = '1px dashed blue';
                    break;
            }
        }
    }

    /* ───────── 位置ユーティリティ ───────── */

    /** 絶対座標を更新 */
    setPosition(x, y) {
        this.x = x;
        this.y = y;

        if (!this.x) {
            console.trace("kokoayasi 3");
        }
    }

    /** {x, y} を取得 */
    getPosition() {
        return {x: this.x, y: this.y};
    }

    /** element がある場合に DOM 位置を反映 */
    drawPosition() {
        if (!this.element) return;
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
    }

    BeginStart() {
    }

    update(delta) {
    }

    draw() {
        if (this.element) {

            this.element.style.left = this.x + 'px';
            this.element.style.top = this.y + 'px';


            /* ====== デバッグ円の位置合わせ ====== */
            if (this.DEBUG_COLLISION) {
                // “中心が x,y” なので (x, y) に円の中心を合わせる
                this.debugCircle.style.left = this.x + 'px';
                this.debugCircle.style.top = this.y + 'px';
            }
        }
    }

    /* ───────── 当たり判定 (矩形) ───────── */

    /* ==============================================================
     円形当たり判定メソッド
     --------------------------------------------------------------
     @param {Object} other  x, y, r プロパティを持つ対象
     @return {boolean}      true なら衝突
    ================================================================= */
    isColliding(other) {
        // ---- 自分自身なら判定しない ----
        /* === どちらも teamId を持ち、かつ同一なら「味方」扱い === */
        if (this.teamId && other.teamId && this.teamId === other.teamId) {
            return false;   // 衝突（ダメージ＆Trigger）処理へ進まない
        }

        if (this.collisionType === CollisionType.NO_COLLISION) {
            return;
        }

        // 自分を除外
        if (this === other) return false;

        const dx = this.x - other.x;
        const dy = this.y - other.y;
        // (自分の半径＋相手の半径)^2 と 距離^2 を比較（√ を取らないで高速）
        if (dx * dx + dy * dy <= (this.r + other.r) ** 2) {

            if (!this.touches.includes(other)) {
                this.TriggerBegin(other);
                this.touches.push(other);
            }

            this.TriggerEnter(other);

            this.OnHit(other);
        } else {

            /* ===== 衝突終了 ===== */
            const idx = this.touches.indexOf(other);
            if (idx !== -1) {
                this.touches.splice(idx, 1);      // 配列から削除
                this.TriggerEnd(other);
            }
        }
    }


    updateMovePre() {
    }

    updateMoveEnd() {

        this.preX = this.x;
        this.preY = this.y;

        if (!this.x) {
            console.trace("kokoayasi");
        }

        /* ----- X 軸 ----- */
        if (this.moveX !== 0) {
            const nx = this.x + this.moveX;
            if (!this.hitsWall(nx, this.y)) this.x = nx;
            else this.moveX = 0;
        }
        /* ----- Y 軸 ----- */
        if (this.moveY !== 0) {
            const ny = this.y + this.moveY;

            if (!this.hitsWall(this.x, ny)) this.y = ny;
            else this.moveY = 0;
        }


        // 表示更新
        this.draw();
    }

    OnHit(other) {

        if (this.collisionType === CollisionType.COLLISION &&
            other.collisionType === CollisionType.COLLISION) {
            // ここに衝突時の処理を書く
            this.x = this.preX;
            this.y = this.preY;

            if (!this.x) {
                console.trace("kokoayasi 2");
            }
            this.moveX = 0;
            this.moveY = 0;
        }
    }

    TriggerBegin(other) {
        //console.log('TriggerBegin');
    }

    TriggerEnter(other) {
        //console.log('TriggerEnter');
    }

    TriggerEnd(other) {
        //console.log('TriggerEnd');
    }

    /**
     * @desc キャラクターをフェードアウトさせてDOMから取り除く
     */
    ExitStart() {
        // すでにフェードアウト中なら何もしない
        if (this.isFadingOut) {
            return;
        }

        this.isFadingOut = true;


        // 削除するのでコリジョンを無効にする
        this.setCollisionType(CollisionType.NO_COLLISION);

        this.AnimationFade("Exit");

        const idx = gameMainScene.pawns.indexOf(this); // 見つからなければ -1
        if (idx !== -1) {
            // loopから処理を外す
            gameMainScene.pawns.splice(idx, 1);
        }

    }

    OnExitAnime(Tag, Type) {
        super.OnExitAnime(Tag, Type);
        switch (Tag) {
            case "Exit":
                gameMainScene.ExitPawns.push(this);
                break;
        }
    }


    destroy() {
        //console.log('destroy');
        if (this.element && this.element.parentNode) {
            this.clearAllEvents?.();
            this.parentElement.removeChild(this.element);

            if (this.DEBUG_COLLISION) {
                this.parentElement.removeChild(this.debugCircle);
            }
            // 明示的にnullを設定して参照を切る
            this.element = null;
            this.parentElement = null;
        }
    }

}
