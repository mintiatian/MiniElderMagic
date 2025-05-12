export class UIStatus {
    /**
     * @param {HTMLElement} parentElement - ステータスUIを表示する親要素
     * @param {Object} player - プレイヤーオブジェクト
     */
    constructor(parentElement, player) {
        this.parentElement = parentElement;
        this.player = player;
        this.isVisible = false;
        
        // ステータス表示用のコンテナ
        this.container = document.createElement('div');
        this.container.classList.add('status-container');
        this.container.style.position = 'absolute';
        this.container.style.top = '50%';
        this.container.style.left = '50%';
        this.container.style.transform = 'translate(-50%, -50%)';
        this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.container.style.padding = '20px';
        this.container.style.borderRadius = '10px';
        this.container.style.boxShadow = '0 0 15px rgba(100, 149, 237, 0.7)'; // 青色の光
        this.container.style.zIndex = '1000';
        this.container.style.display = 'none';
        this.container.style.flexDirection = 'column';
        this.container.style.alignItems = 'center';
        this.container.style.minWidth = '300px';
        this.container.style.color = 'white';
        this.container.style.fontFamily = 'Arial, sans-serif';
        
        // タイトル
        const title = document.createElement('h2');
        title.textContent = 'プレイヤーステータス';
        title.style.color = 'cornflowerblue';
        title.style.marginBottom = '20px';
        title.style.fontFamily = 'Arial, sans-serif';
        title.style.textAlign = 'center';
        this.container.appendChild(title);
        
        // ステータス情報を表示するテーブル
        this.statusTable = document.createElement('table');
        this.statusTable.style.width = '100%';
        this.statusTable.style.borderCollapse = 'collapse';
        this.statusTable.style.marginBottom = '15px';
        this.container.appendChild(this.statusTable);
        
        // ヘルプテキスト
        const helpText = document.createElement('div');
        helpText.textContent = 'Tabキーで閉じる';
        helpText.style.marginTop = '15px';
        helpText.style.fontSize = '14px';
        helpText.style.opacity = '0.7';
        helpText.style.textAlign = 'center';
        this.container.appendChild(helpText);
        
        // コンテナを親要素に追加
        this.parentElement.appendChild(this.container);
        
        // Tabキーのイベントリスナーを追加（バインドして1回だけ登録）
        this.handleKeyDownBound = this.handleKeyDown.bind(this);
        document.addEventListener('keydown', this.handleKeyDownBound);
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
     * ステータス画面の表示/非表示を切り替える
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    /**
     * @desc ステータス画面を表示する
     */
    show() {
        this.isVisible = true;
        this.container.style.display = 'flex';
        this.updateStatusDisplay();
        
        // 表示アニメーション
        this.container.style.opacity = '0';
        this.container.style.transform = 'translate(-50%, -50%) scale(0.9)';
        this.container.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        
        setTimeout(() => {
            this.container.style.opacity = '1';
            this.container.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 50);
    }
    
    /**
     * @desc ステータス画面を非表示にする
     */
    hide() {
        // 非表示アニメーション
        this.container.style.opacity = '0';
        this.container.style.transform = 'translate(-50%, -50%) scale(0.9)';
        
        setTimeout(() => {
            this.isVisible = false;
            this.container.style.display = 'none';
        }, 300);
    }
    
    /**
     * @desc ステータス表示を更新する
     */
    updateStatusDisplay() {
        // テーブルの内容をクリア
        this.statusTable.innerHTML = '';
        
        // プレイヤーのステータスデータを取得
        const statusData = [
            { name: 'HP', value: `${this.player.status.hp} / ${this.player.status.maxHP}`, color: 'lightgreen' },
            { name: 'MP', value: `${this.player.status.mp} / ${this.player.status.maxMP}`, color: 'lightblue' },
            { name: '攻撃力', value: this.player.status.attack, color: 'salmon' },
            { name: '火球射程', value: `${this.player.status.fireRange}`, color: 'orange', highlight: true },
            { name: '移動速度', value: this.player.status.speed, color: 'lightyellow' },
            { name: 'コイン', value: this.player.playerstatus.coins, color: 'gold' },
            { name: 'ステージ', value: this.player.playerstatus.stage, color: 'white' }
        ];
        
        // ステータス項目を順番に追加
        statusData.forEach(item => {
            const row = document.createElement('tr');
            row.style.borderBottom = '1px solid rgba(255, 255, 255, 0.2)';
            
            // 名前セル
            const nameCell = document.createElement('td');
            nameCell.textContent = item.name;
            nameCell.style.padding = '8px 10px';
            nameCell.style.textAlign = 'left';
            nameCell.style.fontWeight = 'bold';
            
            // ハイライト表示（主に火球射程用）
            if (item.highlight) {
                nameCell.style.position = 'relative';
                const highlightSpan = document.createElement('span');
                highlightSpan.textContent = ' 🔥';
                highlightSpan.style.fontSize = '0.8em';
                highlightSpan.style.opacity = '0.7';
                nameCell.appendChild(highlightSpan);
            }
            
            row.appendChild(nameCell);
            
            // 値セル
            const valueCell = document.createElement('td');
            valueCell.textContent = item.value;
            valueCell.style.padding = '8px 10px';
            valueCell.style.textAlign = 'right';
            valueCell.style.color = item.color;
            
            // ハイライト効果が指定されている場合、追加スタイルを適用
            if (item.highlight) {
                valueCell.style.fontWeight = 'bold';
                valueCell.style.textShadow = `0 0 5px ${item.color}`;
            }
            
            row.appendChild(valueCell);
            
            this.statusTable.appendChild(row);
        });
        
        // バージョン情報を追加
        const versionRow = document.createElement('tr');
        const versionNameCell = document.createElement('td');
        versionNameCell.textContent = 'バージョン';
        versionNameCell.style.padding = '8px 10px';
        versionNameCell.style.textAlign = 'left';
        versionNameCell.style.fontWeight = 'bold';
        versionNameCell.style.opacity = '0.7';
        
        const versionValueCell = document.createElement('td');
        versionValueCell.textContent = 'v1.0.0';
        versionValueCell.style.padding = '8px 10px';
        versionValueCell.style.textAlign = 'right';
        versionValueCell.style.opacity = '0.7';
        
        versionRow.appendChild(versionNameCell);
        versionRow.appendChild(versionValueCell);
        this.statusTable.appendChild(versionRow);
    }
}
