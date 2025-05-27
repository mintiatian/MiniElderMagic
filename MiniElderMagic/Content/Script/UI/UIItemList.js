/* UIItemList.js ----------------------------------------------------------- */
import {UIBase} from './UIBase.js';
import {itemDataTable} from '../Utils/DataTable.js';
import {gameMain} from '../GameMain.js';

/**
 * ショップ UI  ― タイトル／コイン表示／フィルターバー／アイテムグリッド
 */
export class UIItemList extends UIBase {
    /**
     * @param {HTMLElement} parentElement
     * @param {PlayerBase=} wizard
     */
    constructor(parentElement, wizard = null) {
        super(parentElement);
        this.wizard = wizard;

        /* ───────── 購入コールバック ───────── */
        this.onItemClick = (item) => {
            const cost = Number(item.shopcost);
            if (this.wizard.playerstatus.coins >= cost) {
                this.wizard.playerstatus.coins -= cost;
                this.wizard.addItem(item);
                gameMain.statusUI.updateDisplay();
                gameMain.magicUI.updateDisplay();
                this.updateDisplay();
            }
        };

        /* ───────── type → カラーMAP ───────── */
        this.typeColors = {
            coin: '#f6c915', shopcost: '#bbbbbb',
            hp: '#ff4d4d', maxHP: '#ff8080',
            mp: '#4d7bff', maxMP: '#80a7ff', mpregene: '#5aa0ff',
            attack: '#ff6b00', deffence: '#00d0d0',
            MaxSpeed: '#00e64d', AddMaxSpeed: '#19f07c',
            attackPierceCount: '#c040ff', HomingRadius: '#b6ff00',
            HomingPower: '#ffb300', AddLifeTime: '#ffa500',
            FireCnt: '#ff914d', UseMP: '#3f51b5',
            MagicName: '#d15cff', shoplevel: '#8d6e63'
        };

        /* ───────── フレーム ───────── */
        this.element.classList.add('ui-shop');
        Object.assign(this.element.style, {
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            minWidth: '600px', maxWidth: '620px',
            padding: '12px 18px 18px',
            background: 'rgba(0,0,0,0.92)',
            borderRadius: '10px',
            border: '2px solid rgba(0,160,255,0.85)',
            boxShadow: '0 0 12px rgba(0,160,255,0.6)',
            fontFamily: 'inherit', color: '#fff', fontSize: '14px',
            display: 'flex', flexDirection: 'column', gap: '10px',
            overflow: 'visible', zIndex: 1000
        });

        /* タイトル */
        this.heading = document.createElement('div');
        this.heading.textContent = 'Shop';
        Object.assign(this.heading.style, {
            fontWeight: 'bold', fontSize: '20px',
            color: '#00bfff', textAlign: 'left'
        });
        this.element.appendChild(this.heading);

        /* 所持コイン表示 */
        this.coinLabel = document.createElement('div');
        Object.assign(this.coinLabel.style, {
            fontSize: '14px', color: '#ffd700', textAlign: 'left'
        });
        this.element.appendChild(this.coinLabel);

        /* 🔍 フィルターバー */
        this.filterBar = document.createElement('div');
        Object.assign(this.filterBar.style, {
            display: 'flex', flexWrap: 'wrap',
            gap: '6px', marginBottom: '4px'
        });
        this.element.appendChild(this.filterBar);
        this.currentFilter = 'all';

        /* スクロールリスト（高さ固定：55vh） */
        this.listWrapper = document.createElement('div');
        Object.assign(this.listWrapper.style, {
            height: '55vh',       /* ← ここで固定 */
            minHeight: '55vh',
            maxHeight: '55vh',
            overflowY: 'auto', paddingRight: '6px',
            display: 'grid', gap: '8px',
            gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))',
            justifyItems: 'center',
            alignContent: 'flex-start'   // ★ 追加：行を常に上詰め
        });
        this.element.appendChild(this.listWrapper);

        parentElement.appendChild(this.element);
        this.hide();
    }

    /* ───────── フィルターボタン再生成 ───────── */
    rebuildFilterButtons(items) {
        const types = Array.from(new Set(items.map(i => i.filtertype).filter(Boolean))).sort();
        types.unshift('all');
        this.filterBar.innerHTML = '';

        for (const tp of types) {
            const btn = document.createElement('button');
            btn.textContent = tp === 'all' ? 'ALL' : tp;
            Object.assign(btn.style, {
                padding: '2px 8px', fontSize: '12px',
                borderRadius: '6px', cursor: 'pointer',
                border: '1px solid #888',
                background: this.currentFilter === tp ? '#008cff' : '#444',
                color: '#fff'
            });
            btn.onclick = () => {
                this.currentFilter = tp;
                this.updateDisplay();
            };
            this.filterBar.appendChild(btn);
        }
    }

    /* ───────── 再描画 ───────── */
    updateDisplay() {
        const ps = this.wizard?.playerstatus ?? {};
        const coins = ps.coins ?? 0;
        const disc = ps.shopcost ?? 0;
        const level = ps.shoplevel ?? 1;
        this.coinLabel.textContent =
            `Coins 🪙 ${coins}　💲Discount ${disc}　🏪Shoplevel ${level}`;

        /* アイテム取得 */
        const table = itemDataTable?.table;
        let items = table instanceof Map ? [...table.values()]
            : Array.isArray(table) ? [...table] : [];

        this.rebuildFilterButtons(items);

        if (this.currentFilter !== 'all') {
            items = items.filter(it => it.filtertype === this.currentFilter);
        }
        
        
        items.sort((a, b) => {
            const costA = (() => {
                const bp = Number(a.shopcost) || 0;
                return bp === 0 ? 0 : Math.max(5, bp - disc);
            })();
            const costB = (() => {
                const bp = Number(b.shopcost) || 0;
                return bp === 0 ? 0 : Math.max(5, bp - disc);
            })();
            const affordA = coins >= costA;
            const affordB = coins >= costB;
            if (affordA !== affordB) return affordA ? -1 : 1;   /* 買える方を先に */
            return String(a?.id ?? '').localeCompare(String(b?.id ?? ''));
        });

        this.listWrapper.innerHTML = '';
        if (!items.length) {
            this.listWrapper.textContent = 'No items';
            return;
        }

        for (const item of items) {
            if (item.shop === 0) continue;
            if (item.shop > level) continue;

            /* 価格計算 */
            const basePrice = Number(item.shopcost) || 0;
            const discounted = basePrice - disc;
            const cost = basePrice === 0 ? 0 : Math.max(5, discounted);
            const affordable = coins >= cost;

            /* ───── タイルボタン ───── */
            const btn = document.createElement('button');
            Object.assign(btn.style, {
                width: '100%', aspectRatio: '1',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'space-between',
                background: 'rgba(0,0,0,0.5)',
                border: `2px solid ${this.typeColors[item.type] || '#fff'}`,
                borderRadius: '8px', padding: '6px', color: '#fff',
                cursor: 'pointer',
                opacity: affordable ? '1' : '0.35',
                transition: 'background 0.2s, transform 0.1s'
            });
            /* ホバー・押下アニメは affordable のときだけ */
            btn.onmouseenter = () => {
                if (affordable) btn.style.background = 'rgba(0,0,0,0.65)';
            };
            btn.onmouseleave = () => {
                btn.style.background = 'rgba(0,0,0,0.5)';
            };
            btn.onmousedown = () => {
                if (affordable) btn.style.transform = 'scale(0.96)';
            };
            btn.onmouseup = () => {
                btn.style.transform = 'scale(1)';
            };
            btn.onclick = () => affordable && this.onItemClick?.(item);

            /* 絵文字 */
            const emojiDiv = document.createElement('div');
            emojiDiv.textContent = item.emoji ?? '—';
            emojiDiv.style.fontSize = '64px';

            /* 説明 */
            const infoDiv = document.createElement('div');
            infoDiv.textContent = String(item.infotext ?? '').slice(0, 24);
            Object.assign(infoDiv.style, {
                fontSize: '10px', lineHeight: '1.2', textAlign: 'center',
                height: '26px', overflow: 'hidden'
            });

            /* コスト */
            const costDiv = document.createElement('div');
            costDiv.innerHTML = `<span style="color:#ffd700;font-size:12px;">🪙 ${cost}</span>`;

            btn.append(emojiDiv, infoDiv, costDiv);
            this.listWrapper.appendChild(btn);
        }
    }

    /* ───────── 表示 / 非表示 ───────── */
    show() {
        this.updateDisplay();
        super.show();
    }
}
