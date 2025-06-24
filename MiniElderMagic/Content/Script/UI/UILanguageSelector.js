// UI/UILanguageSelector.js
import { UIBase } from './UIBase.js';
import { languageList } from '../Utils/DataTable.js';

/**
 * 言語選択 UI コンポーネント
 * usage:
 *   const langUI = new UILanguageSelector(parentEl, lang => { ... });
 */
export class UILanguageSelector extends UIBase {
    /**
     * @param {HTMLElement} parentElement
     * @param {function(string):void} onChange - 言語が切り替わった時のコールバック
     */
    constructor(parentElement, onChange) {
        super(parentElement);

        this.onChange = onChange;

        /* --------------- ① 保存済み言語を復元 --------------- */
        const saved = localStorage.getItem('ui.lang');
        this.currentLang = languageList.includes(saved) ? saved : languageList[0];

        this._buildDom();

        /* --------------- ② 初期化時にもコールバック --------------- */
        this.onChange?.(this.currentLang);
    }

    _buildDom() {
        this.container = document.createElement('div');
        Object.assign(this.container.style, {
            position: 'absolute',
            top: '20px',
            right: '20px',
            zIndex: '9999',
        });

        const select = document.createElement('select');
        Object.assign(select.style, {
            padding: '6px 12px',
            fontSize: '16px',
            borderRadius: '6px',
        });

        languageList.forEach(lang => {
            const option = document.createElement('option');
            option.value = lang;
            option.textContent = lang.toUpperCase();
            option.selected = (lang === this.currentLang);
            select.appendChild(option);
        });

        /* --------------- ③ 変更時に保存 & コールバック --------------- */
        select.addEventListener('change', () => {
            this.currentLang = select.value;
            localStorage.setItem('ui.lang', this.currentLang);   // ← 保存
            this.onChange?.(this.currentLang);
        });

        this.container.appendChild(select);
        this.element.appendChild(this.container);
    }
}
