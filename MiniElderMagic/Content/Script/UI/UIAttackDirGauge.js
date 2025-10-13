/* UIAttackDirGauge.js ─ MiniElderMagic
 * Wizard.status.AttackdirRatio を視覚化する右下ゲージ
 * ------------------------------------------------------------------ */
import { UIBase } from './UIBase.js';

export class UIAttackDirGauge extends UIBase {
    /**
     * @param {HTMLElement} parentElement  #game-ui-layer 推奨
     * @param {Wizard}      wizard         値を監視する Wizard インスタンス
     * @param {Object=}     opts           {width, height, barColor}
     */
    constructor(parentElement, wizard, opts = {}) {
        super(parentElement);
        this.wizard = wizard;

        // ---------- visual ----------
        const W = opts.width  ?? 120;
        const H = opts.height ?? 16;
        const barColor = opts.barColor ?? '#0af';

        Object.assign(this.element.style, {
            position:   'absolute',
            right:      '12px',
            bottom:     '12px',
            width:      `${W}px`,
            height:     `${H}px`,
            background: '#222',
            border:     '1px solid #888',
            borderRadius: '4px',
            pointerEvents: 'none',   // クリック透過
            zIndex:     999,
        });

        // 塗りつぶしバー
        this._bar = document.createElement('div');
        Object.assign(this._bar.style, {
            height: '100%',
            width:  '0%',
            background: barColor,
            borderRadius: '3px 0 0 3px',
            transition: 'width 0.05s linear',
        });
        this.element.append(this._bar);

        // 数値ラベル
        this._label = document.createElement('span');
        Object.assign(this._label.style, {
            position: 'absolute',
            left: '50%',
            top:  '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '12px',
            color: '#fff',
            pointerEvents: 'none',
            textShadow: '0 0 3px #000',
        });
        this.element.append(this._label);


        // constructor 内の最後あたり
        this._hint = document.createElement('span');
        this._hint.textContent = 'shift +🖱️↕️';   // ← 好みで変更
        Object.assign(this._hint.style, {
            position: 'absolute',
            right: '2px',
            bottom: '100%',          // ゲージのすぐ上
            fontSize: '20px',
            color:  '#ccc',
            userSelect: 'none',
        });
        this.element.append(this._hint);

        
        
        // 一度だけ初期反映
        this.update();
    }

    /** 0.0-1.0 の値をゲージに反映 */
    update() {
        const ratio = Math.max(0, Math.min(1, this.wizard.status.AttackdirRatio ?? 0));
        const percent = Math.round(ratio * 100);
        this._bar.style.width = `${percent}%`;
        this._label.textContent = percent;
    }

    handleKeyDown(event) {

    }
}
