/**
 * デバッグモードUI管理クラス
 * 各ステータスパラメータを+/-ボタンで調整できるUIを提供
 */
export class UIDebug {
  /**
   * @param {HTMLElement} parentElement - デバッグUIを表示する親要素
   * @param {Object} player - プレイヤーオブジェクト
   */
  constructor(parentElement, player) {
    this.parentElement = parentElement;
    this.player = player;
    this.isVisible = false;
    this.container = null;
    
    // デバッグコンテナを初期化
    this.createDebugContainer();
  }
  
  /**
   * デバッグUIのコンテナを作成
   */
  createDebugContainer() {
    // 既存のコンテナがあれば削除
    if (this.container) {
      this.parentElement.removeChild(this.container);
    }
    
    // デバッグUIコンテナ
    this.container = document.createElement('div');
    this.container.id = 'debug-ui';
    this.container.style.position = 'absolute';
    this.container.style.top = '50px';
    this.container.style.right = '20px';
    this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    this.container.style.color = '#fff';
    this.container.style.padding = '10px';
    this.container.style.borderRadius = '5px';
    this.container.style.fontFamily = 'monospace';
    this.container.style.fontSize = '14px';
    this.container.style.zIndex = '1000';
    this.container.style.display = 'none'; // 初期状態は非表示
    this.container.style.minWidth = '200px';
    this.container.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
    
    // タイトル
    const title = document.createElement('div');
    title.textContent = '🛠️ デバッグモード';
    title.style.fontSize = '16px';
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '10px';
    title.style.textAlign = 'center';
    title.style.borderBottom = '1px solid #555';
    title.style.paddingBottom = '5px';
    this.container.appendChild(title);
    
    // パラメータセクション
    this.createParameterSection('HP', () => this.player.status.hp, (v) => {
      this.player.status.hp = Math.max(0, Math.min(this.player.status.maxHP, v));
    });
    
    this.createParameterSection('最大HP', () => this.player.status.maxHP, (v) => {
      this.player.status.setMaxHP(v);
    });
    
    this.createParameterSection('MP', () => this.player.status.mp, (v) => {
      this.player.status.mp = Math.max(0, Math.min(this.player.status.maxMP, v));
    });
    
    this.createParameterSection('最大MP', () => this.player.status.maxMP, (v) => {
      this.player.status.setMaxMP(v);
    });
    
    this.createParameterSection('攻撃力', () => this.player.status.attack, (v) => {
      this.player.status.setAttack(v);
    });
    
    this.createParameterSection('移動速度', () => this.player.status.speed, (v) => {
      this.player.status.setSpeed(v);
    });
    
    this.createParameterSection('火球射程', () => this.player.status.fireRange, (v) => {
      this.player.status.setFireRange(v);
    });
    
    this.createParameterSection('コイン', () => this.player.playerstatus.coins, (v) => {
      this.player.playerstatus.coins = v;
    });
    
    this.createParameterSection('ステージ', () => this.player.playerstatus.stage, (v) => {
      this.player.playerstatus.setStage(v);
    });
    
    // 閉じるボタン
    const closeButton = document.createElement('button');
    closeButton.textContent = '閉じる';
    closeButton.style.marginTop = '10px';
    closeButton.style.padding = '5px 10px';
    closeButton.style.width = '100%';
    closeButton.style.backgroundColor = '#555';
    closeButton.style.color = 'white';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '3px';
    closeButton.style.cursor = 'pointer';
    closeButton.addEventListener('click', () => this.hide());
    this.container.appendChild(closeButton);
    
    // 親要素に追加
    this.parentElement.appendChild(this.container);
  }
  
  /**
   * パラメータ調整セクションを作成
   * @param {string} name - パラメータ名
   * @param {Function} getValue - 現在値を取得する関数
   * @param {Function} setValue - 値を設定する関数
   */
  createParameterSection(name, getValue, setValue) {
    const section = document.createElement('div');
    section.style.marginBottom = '8px';
    section.style.display = 'flex';
    section.style.alignItems = 'center';
    section.style.justifyContent = 'space-between';
    
    // パラメータ名
    const label = document.createElement('span');
    label.textContent = name;
    label.style.marginRight = '10px';
    section.appendChild(label);
    
    // コントロール部分
    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.alignItems = 'center';
    
    // マイナスボタン
    const minusBtn = document.createElement('button');
    minusBtn.textContent = '-';
    minusBtn.style.width = '24px';
    minusBtn.style.height = '24px';
    minusBtn.style.borderRadius = '3px';
    minusBtn.style.backgroundColor = '#700';
    minusBtn.style.color = 'white';
    minusBtn.style.border = 'none';
    minusBtn.style.margin = '0 5px';
    minusBtn.style.cursor = 'pointer';
    
    // 値表示
    const valueDisplay = document.createElement('span');
    valueDisplay.textContent = getValue();
    valueDisplay.style.minWidth = '40px';
    valueDisplay.style.textAlign = 'center';
    
    // プラスボタン
    const plusBtn = document.createElement('button');
    plusBtn.textContent = '+';
    plusBtn.style.width = '24px';
    plusBtn.style.height = '24px';
    plusBtn.style.borderRadius = '3px';
    plusBtn.style.backgroundColor = '#070';
    plusBtn.style.color = 'white';
    plusBtn.style.border = 'none';
    plusBtn.style.margin = '0 5px';
    plusBtn.style.cursor = 'pointer';
    
    // イベントハンドラーの設定
    minusBtn.addEventListener('click', () => {
      // 値に応じて減少量を調整
      const currentValue = getValue();
      let decrementBy = 1;
      
      // パラメータに応じて減少量を調整
      if (name === 'HP' || name === '最大HP' || name === 'MP' || name === '最大MP') {
        decrementBy = 10;
      } else if (name === '攻撃力') {
        decrementBy = 5;
      } else if (name === '火球射程') {
        decrementBy = 50;
      } else if (name === 'コイン') {
        decrementBy = 10;
      }
      
      // 値を設定
      const newValue = Math.max(0, currentValue - decrementBy);
      setValue(newValue);
      valueDisplay.textContent = newValue;
    });
    
    plusBtn.addEventListener('click', () => {
      // 値に応じて増加量を調整
      const currentValue = getValue();
      let incrementBy = 1;
      
      // パラメータに応じて増加量を調整
      if (name === 'HP' || name === '最大HP' || name === 'MP' || name === '最大MP') {
        incrementBy = 10;
      } else if (name === '攻撃力') {
        incrementBy = 5;
      } else if (name === '火球射程') {
        incrementBy = 50;
      } else if (name === 'コイン') {
        incrementBy = 10;
      }
      
      // 値を設定
      const newValue = currentValue + incrementBy;
      setValue(newValue);
      valueDisplay.textContent = newValue;
    });
    
    // 要素の追加
    controls.appendChild(minusBtn);
    controls.appendChild(valueDisplay);
    controls.appendChild(plusBtn);
    section.appendChild(controls);
    
    this.container.appendChild(section);
    
    // 更新関数を返す
    return () => {
      valueDisplay.textContent = getValue();
    };
  }
  
  /**
   * パラメータの表示を更新
   */
  update() {
    if (!this.isVisible) return;
    
    // コンテナ内のすべての値表示を更新
    const sections = this.container.querySelectorAll('div');
    sections.forEach(section => {
      const valueDisplay = section.querySelector('span:nth-child(2)');
      if (valueDisplay) {
        // 値を取得するロジックをここに追加
        // この例では単純に表示を更新しない
      }
    });
  }
  
  /**
   * デバッグUIを表示
   */
  show() {
    this.isVisible = true;
    if (this.container) {
      this.container.style.display = 'block';
    }
  }
  
  /**
   * デバッグUIを非表示
   */
  hide() {
    this.isVisible = false;
    if (this.container) {
      this.container.style.display = 'none';
    }
  }
  
  /**
   * デバッグUIの表示/非表示を切り替え
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }
}
