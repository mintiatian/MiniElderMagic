import {UIBase} from './UIBase.js';
import {magicDataTable} from '../Utils/DataTable.js';

/**
 * UIMagic ― 習得済み魔法一覧 UI
 *   - M キーで開閉（UIBase 側で処理）
 *   - ▲/▼ ボタンで並び替え（クリック 1 回 ＝ 1 つ移動）
 *   - this.player.playerstatus.HasMagics の配列を splice で直接並べ替え
 *   - magicDataTable から絵文字と MP 消費を取得
 */
export class UIMagic extends UIBase {
    /**
     * @param {PlayerBase} player
     * @param {HTMLElement} [parent=document.body] 追加先の DOM ノード
     */
    constructor(parentElement, player) {
        super(parentElement);
        this.wizard = player;


        // 基本スタイル
        this.element.classList.add('ui-magic');
        Object.assign(this.element.style, {
            position: 'absolute',
            top: '300px',
            right: '8px',
            padding: '8px 12px',
            backgroundColor: 'rgba(0,0,0,0.6)',
            color: '#fff',
            fontFamily: 'monospace',
            fontSize: '14px',
            userSelect: 'none',
            borderRadius: '4px',
            zIndex: 90,
            display: 'flex',        // UIBase が flex を強制するので合わせる
            flexDirection: 'column', // 子を縦方向に並べる
            alignItems: 'flex-start',
            gap: '2px',              // 行間
        });

        // ▲/▼ クリック ―― デリゲート
        this.element.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;

            if (btn.dataset.dir) {
                const index = Number(btn.dataset.index);
                const dir = btn.dataset.dir; // 'up' | 'down'
                this._reorder(index, dir);
            }

            // 🪄 セット
            if (btn.dataset.action === 'set') {
                const index = Number(btn.dataset.index);
                this._setMagic(index);
            }
        });


        this.parentElement.appendChild(this.element);
        this.element.style.position = 'absolute';  // 画面 or 親要素基準
        //this.element.style.left = '80%';       // 横 1/4（25 %）ライン
        this.element.style.top = '20%';       // 縦 1/2（50 %）ライン
        //this.element.style.transform = 'translate(-50%, 0%)';  // 要素自身の中心を基準点に合わせる
        this.element.style.zIndex = 1000;         // ゲーム画より前面
        
        // 新: 右端固定（上下は中央にそろえる）
        this.element.style.right = '24px';      // 余白はお好みで
        //this.element.style.top = '50%';
        this.element.style.transform = 'translateY(-50%)';  // 横方向の -50% は不要
        this.hide();
    }

    _setMagic(index) {
        const list = this.wizard?.playerstatus?.HasMagics;
        if (!Array.isArray(list) || !list[index]) return;

        const magicId = list[index];
        // wizard(player) 側のメソッドを呼ぶ
        this.wizard?.SetMagic?.(magicId);
    }

    /**
     * 指定インデックスの要素を 1 つずらす
     * @private
     * @param {number} index
     * @param {'up'|'down'} dir
     */
    _reorder(index, dir) {
        const list = this.wizard.playerstatus?.HasMagics;
        if (!Array.isArray(list)) return;
        const newIndex = dir === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= list.length) return; // はみ出しガード

        const [item] = list.splice(index, 1);
        list.splice(newIndex, 0, item);
        this.updateDisplay(); // 再描画
    }

    updateDisplay() {
        const list = this.wizard?.playerstatus?.HasMagics;

        // クリア
        this.element.innerHTML = '';

        const title = document.createElement('h3');
        title.textContent = 'Magics';
        title.style.margin = '0 0 8px 0';
        this.element.appendChild(title);

        if (!list || list.length === 0) {
            const empty = document.createElement('div');
            empty.textContent = 'Has not yet learnt magic.';
            this.element.appendChild(empty);
            return;
        }

        // 縦方向に並べるため、各行は block 要素（デフォルト）
        list.forEach((magicId, i) => {
            const data = magicDataTable.get(magicId) || {};
            const emoji = data.emoji || '❓';
            const mpCost = data.useMP != null ? `${data.useMP}MP` : '';

            const row = document.createElement('div');
            Object.assign(row.style, {
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginBottom: '2px',
            });
            const indexTexts = [
                '1⃣', '2⃣', '3⃣', '4⃣', '5⃣',
                '6⃣', '7⃣', '8⃣', '9⃣', '0⃣', '⬜️', '⬜️', '⬜️', '⬜️', '⬜️', '⬜️', '⬜️', '⬜️'
            ];
            const spanIndex = document.createElement('span');
            spanIndex.textContent = indexTexts[i];

            const spanEmoji = document.createElement('span');
            spanEmoji.textContent = emoji;

            const spanId = document.createElement('span');
            spanId.textContent = magicId;
            spanId.style.minWidth = '80px';

            const spanMp = document.createElement('span');
            spanMp.textContent = mpCost;
            spanMp.style.minWidth = '48px';


            const btnUp = document.createElement('button');
            btnUp.textContent = '▲';
            btnUp.dataset.index = i;
            btnUp.dataset.dir = 'up';
            btnUp.style.cursor = 'pointer';
            btnUp.style.padding = '0 4px';

            const btnDown = document.createElement('button');
            btnDown.textContent = '▼';
            btnDown.dataset.index = i;
            btnDown.dataset.dir = 'down';
            btnDown.style.cursor = 'pointer';
            btnDown.style.padding = '0 4px';

            // 🪄 セットボタン
            const btnSet = document.createElement('button');
            btnSet.textContent = '🪄';        // いい感じの絵文字
            btnSet.dataset.index = i;
            btnSet.dataset.action = 'set';
            btnSet.style.cursor = 'pointer';
            btnSet.style.padding = '0 4px';
            btnSet.title = 'Set this magic.';

            row.append(spanIndex, spanEmoji, spanId, spanMp, btnSet, btnUp, btnDown);
            this.element.appendChild(row);
        });
    }
}
