// UI/UILanguageSelector.js

import { UIBase } from './UIBase.js';
import {languageList} from "../Utils/DataTable.js";

/**
 * 言語選択 UI コンポーネント
 * usage:
 *   const langUI = new UILanguageSelector(parentEl, ['ja', 'en'], lang => { ... });
 */
export class UILanguageSelector extends UIBase {
    /**
     * @param {HTMLElement} parentElement
     * @param {function(string):void} onChange - 言語が切り替わった時のコールバック
     */
    constructor(parentElement, onChange) {
        super(parentElement);

        this.onChange = onChange;

        this._buildDom();
    }

    _buildDom() {
        this.container = document.createElement('div');
        this.container.style.position = 'absolute';
        this.container.style.top = '20px';
        this.container.style.right = '20px';
        this.container.style.zIndex = '9999';

        const select = document.createElement('select');
        select.style.padding = '6px 12px';
        select.style.fontSize = '16px';
        select.style.borderRadius = '6px';

        languageList.forEach(lang => {
            const option = document.createElement('option');
            option.value = lang;
            option.textContent = lang.toUpperCase();
            if (lang === this.currentLang) option.selected = true;
            select.appendChild(option);
        });

        select.addEventListener('change', () => {
            this.currentLang = select.value;
            this.onChange?.(this.currentLang);
        });

        this.container.appendChild(select);
        this.element.appendChild(this.container);
    }
}
