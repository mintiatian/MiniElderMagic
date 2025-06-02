export class UIBase {
    constructor(parentElement) {

        this.parentElement = parentElement;
        this.isVisible = false;

        // ステータス表示用のコンテナ
        this.element = document.createElement('div');


        // Tabキーのイベントリスナーを追加（バインドして1回だけ登録）
        this.handleKeyDownBound = this.handleKeyDown.bind(this);
        document.addEventListener('keydown', this.handleKeyDownBound);
        this.parentElement.appendChild(this.element);
    }

    /**
     * @desc キー入力のハンドラ
     * @param {KeyboardEvent} event - キーボードイベント
     */
    handleKeyDown(event) {
        // Tabキーが押されたときの処理
        if (event.key === 'Tab') {
            // デフォルトのTabキーの動作を防止
            event.preventDefault();

            if (this.isVisible) {
                this.hide();
            } else {
                this.show();
            }
        }
    }


    /**
     * @desc ステータス画面を表示する
     */
    show() {
        this.isVisible = true;
        this.element.style.display = 'flex';   // ← 初期は none にしておくと安心

        /* ----------- アニメーション ----------- */
        this.element.style.opacity   = '0';
        //this.element.style.transform = 'scale(0.9)';
        this.element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

        setTimeout(() => {
            this.element.style.opacity   = '1';
            //this.element.style.transform = 'scale(1)';
            }, 50);

        this.updateDisplay();
    }

    /**
     * @desc ステータス画面を非表示にする
     */
    hide() {
        // 非表示アニメーション
        this.element.style.opacity   = '0';
        //this.element.style.transform = 'scale(0.9)';


        setTimeout(() => {
            this.isVisible = false;
            this.element.style.display = 'none';
        }, 300);
    }

    updateDisplay() {
    }
}