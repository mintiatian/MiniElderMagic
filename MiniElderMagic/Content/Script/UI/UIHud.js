/* UIHud.js --------------------------------------------------------------- */
import {UIBase} from './UIBase.js';
import {eventDataTable, eventTileDataTable} from "../Utils/DataTable.js";
import {gameMainScene} from "../Scene/GameMainScene.js";
import {SceneManagerInstance} from "../Scene/SceneManager.js";        // ★ 追加
/**
 * 画面左上にコイン枚数を表示する HUD
 */
export class UIHud extends UIBase {
    /**
     * @param {HTMLElement} parentElement – 通常は #game-ui-layer
     * @param {PlayerBase=} wizard        – コインを持つプレイヤー
     */
    constructor(parentElement, wizard = null) {
        super(parentElement);
        this.wizard = wizard;
        this.eventTile = null;           // 現在アクティブなタブ名

        /* ────── パネル全体の見た目 ────── */
        Object.assign(this.element.style, {
            position: 'absolute',
            left: '12px',
            top: '12px',

            /* ★ ここでサイズを固定 ★ */
            width: '220px',          // ← パネル横幅を固定
            height: '260px',           // ← 必要なら高さも固定
            boxSizing: 'border-box',     // padding を含めて計算させる

            padding: '8px 12px',
            borderRadius: '10px',
            background: 'rgba(0,0,0,.45)',
            backdropFilter: 'blur(4px)',
            boxShadow: '0 2px 6px rgba(0,0,0,.4)',
            color: '#f6c915',
            fontSize: '24px',
            fontWeight: 'bold',
            textShadow: '0 0 6px rgba(0,0,0,.6)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            rowGap: '4px',

            /* もしテキストがはみ出す場合は省略記号に */
            overflow: 'hidden',         // or 'clip'
        });

        /* ────── 1行目: 🪙アイコン + コイン枚数 ────── */
        const coinRow = document.createElement('span');
        Object.assign(coinRow.style, {
            display: 'inline-flex',
            alignItems: 'center',
        });

        this.iconSpan = document.createElement('span');
        this.iconSpan.textContent = '🪙';
        this.iconSpan.style.marginRight = '4px';
        this._lastEventKey = null;   // ← 直近イベントの「キー化した値」を保存
        this.textSpan = document.createElement('span');

        coinRow.append(this.iconSpan, this.textSpan);

        /* ────── 2行目: タブ名バッジ ────── */
        this.tabSpan = document.createElement('span');
        Object.assign(this.tabSpan.style, {
            padding: '2px 10px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,.18)',
            backdropFilter: 'blur(2px)',
            boxShadow: 'inset 0 0 3px rgba(255,255,255,.35), 0 1px 2px rgba(0,0,0,.3)',
            fontSize: '16px',
            lineHeight: '20px',
            color: '#ffffff',
            textTransform: 'uppercase',
            letterSpacing: '.5px',
        });

        /* ────── 2行目: 👾アイコン + 敵カウント ────── */
        const enemyRow = document.createElement('span');
        Object.assign(enemyRow.style, {
            display: 'inline-flex',
            alignItems: 'center',
            color: '#ff8080',
        });
        this.enemyIcon = document.createElement('span');
        this.enemyIcon.textContent = '👾';
        this.enemyIcon.style.marginRight = '4px';
        this.enemySpan = document.createElement('span');
        enemyRow.append(this.enemyIcon, this.enemySpan);

        /* ────── 3行目: 🛒アイコン + 購入数 ────── */
        const shopRow = document.createElement('span');
        Object.assign(shopRow.style, {
            display: 'inline-flex',
            alignItems: 'center',
            color: '#bbbbbb',
        });
        this.shopIcon = document.createElement('span');
        this.shopIcon.textContent = '⚔️';
        this.shopIcon.style.marginRight = '4px';
        this.shopSpan = document.createElement('span');
        shopRow.append(this.shopIcon, this.shopSpan);


        /* ───── HP / MP バー ───── */
        const makeBar = (label, color) => {
            const wrap = document.createElement('div');
            Object.assign(wrap.style, {width: '100%'});

            const text = document.createElement('div');
            text.textContent = label;
            Object.assign(text.style, {
                fontSize: '12px', marginBottom: '2px'
            });

            const outer = document.createElement('div');
            Object.assign(outer.style, {
                width: '100%', height: '10px',
                background: '#333', borderRadius: '5px',
                overflow: 'hidden'
            });

            const inner = document.createElement('div');
            Object.assign(inner.style, {
                height: '100%', width: '0%',
                background: color, transition: 'width .2s'
            });
            outer.appendChild(inner);
            wrap.append(text, outer);
            return {wrap, inner, text};
        };

        this.hpBar = makeBar('HP', '#ff4d4d');      // 赤
        this.mpBar = makeBar('MP', '#4d7bff');      // 青
        this.element.append(this.hpBar.wrap, this.mpBar.wrap);


        /* ────── DOM へ ────── */
        this.element.append(coinRow, enemyRow, shopRow, this.tabSpan);
        this.parentElement.appendChild(this.element);


        /* 初期表示 */
        this.updateDisplay();
    }

    handleKeyDown(event) {
        // Tabキーが押されたときの処理
    }

    /** プレイヤーを後から差し替える場合 */
    setWizard(wizard) {
        this.wizard = wizard;
        this.updateDisplay();
    }

    /** タブ名を切り替える場合 */
    setEventTile(tileName = null) {
        this.eventTile = tileName;
        this.updateDisplay();
    }

    updateDisplay() {
        if (!this.wizard) {
            this.textSpan.textContent = '—';
            return;
        }

        const coins = this.wizard?.playerstatus?.coins ?? 0;
        this.textSpan.textContent = ": " + String(coins);

        const event = gameMainScene.background.getMapValue("event", this.wizard.x, this.wizard.y);
        this.tabSpan.textContent = "TAB : Status";
        if (event !== null) {
            //console.log(event);
            if (eventDataTable.table.has(event)) {
                const eventData = eventDataTable.get(event);
                if (eventData.type === "exevent") {

                    if (eventData.type !== this._lastEventKey) {
                        SceneManagerInstance.audio.playSE('eventInfo');
                    }
                    this._lastEventKey = eventData.type;
                } else {

                    if (eventData.type !== this._lastEventKey) {
                        SceneManagerInstance.audio.playSE('eventInfo');
                    }

                    this._lastEventKey = eventData.type;
                    this.tabSpan.textContent = "TAB : " + eventData.type + " - " + eventData.mode;

                }
            }
        } else {

            this._lastEventKey = "";
        }
        /*
        // プレイヤーがいま踏んでいるタイル絵文字
        const tileEmoji = this.wizard?.eventTile ?? "";
        //if (!tileEmoji) return;                  // 空文字 → 何もなし

        // eventTileDataTable.table は Map
        if (!eventTileDataTable.table.has(tileEmoji)) {
            this.tabSpan.textContent = "TAB : Status";
        } else {

            const evtTile = eventTileDataTable.get(tileEmoji);

            this.tabSpan.textContent = "TAB : " + this.wizard.eventTile + " " + evtTile.title;
        }*/


        /* 敵出現数 (Background.CurrentPopCount) */
        const enemyCnt = gameMainScene?.background?.CurrentPopCount ?? 0;
        this.enemySpan.textContent = ": " + String(enemyCnt);

        /* 購入数 (shopBuyCount) */
        const buyCnt = this.wizard?.status?.shopBuyCount ?? 0;
        this.shopSpan.textContent = ": " + String(buyCnt);

        const hp = Math.trunc(this.wizard?.status?.hp ?? 0);
        const maxHP = Math.trunc(this.wizard?.status?.maxHP ?? 1);
        const mp = Math.trunc(this.wizard?.status?.mp ?? 0);
        const maxMP = Math.trunc(this.wizard?.status?.maxMP ?? 1);

        /* HP / MP バー幅を更新 */
        const hpPct = Math.max(0, Math.min(1, hp / maxHP));
        const mpPct = Math.max(0, Math.min(1, mp / maxMP));
        this.hpBar.inner.style.width = `${hpPct * 100}%`;
        this.mpBar.inner.style.width = `${mpPct * 100}%`;
        this.hpBar.text.textContent = `HP ${hp}/${maxHP}`;
        this.mpBar.text.textContent = `MP ${mp}/${maxMP}`;
    }
}
