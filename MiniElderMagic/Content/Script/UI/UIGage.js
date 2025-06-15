// ───────────────────────────────────────────────
// ゲージ種別 ID                       0   1   …
// ───────────────────────────────────────────────
export const GAUGE_KIND = {
    HP: 0,   // 体力
    MP: 1    // 魔力
};

// ───────────────────────────────────────────────
//          ゲージ色テーブル  [種別][段階]
// ───────────────────────────────────────────────
// 0段階 : 残量60%以上
// 1段階 : 30〜60%
// 2段階 : 30%未満
export const GAUGE_COLORS = [
    /* HP */ ['#0f0', '#ff0', '#f00'],        // 緑 → 黄 → 赤
    /* MP */ ['#00bfff', '#00bfff', '#00bfff'] // 常にシアン
];

export class UIGage {
    /**
     * @param {HTMLElement} parentElement - ゲージの親要素
     */
    constructor(parentElement, kind = GAUGE_KIND.HP) {
        this.kind = kind;

        this.container = document.createElement('div');
        this.container.style.position = 'absolute';
        this.container.style.width = '40px';
        this.container.style.height = '4px';
        this.container.style.left = '50%';
        this.container.style.transform = 'translateX(-50%)';
        this.container.style.borderRadius = '2px';
        this.container.style.overflow = 'hidden';
        this.container.style.backgroundColor = '#222';
        
        if (kind === GAUGE_KIND.MP) {
            this.container.style.bottom = '-15px';
        } else {
            this.container.style.bottom = '-10px';
        }

        this.gage = document.createElement('div');
        this.gage.classList.add('UIGage');
        this.gage.style.width = '100%';
        this.gage.style.height = '100%';
        this.gage.style.backgroundColor = GAUGE_COLORS[this.kind][0];
        this.gage.style.borderRadius = '2px';
        this.gage.style.transition = 'width 0.3s ease';
        this.gage.style.position = 'absolute';
        this.gage.style.left = '0';
        this.gage.style.top = '0';

        this.container.appendChild(this.gage);
        parentElement.appendChild(this.container);
    }
    
    

    update(currentHP, maxHP) {
        const ratio = Math.max(0, Math.min(1, currentHP / maxHP));
        this.gage.style.width = (ratio * 100) + '%';

        const level = ratio > 0.6 ? 0 : ratio > 0.3 ? 1 : 2;
        this.gage.style.backgroundColor = GAUGE_COLORS[this.kind][level];
    }

    hide() {
        this.container.style.display = 'none';
    }

    show() {
        this.container.style.display = 'block';
    }
}
