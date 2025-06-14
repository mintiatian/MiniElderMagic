import {UIBase} from "./UIBase.js";

export class UIStatus extends UIBase{
    /**
     * @param {HTMLElement} parentElement - ステータスUIを表示する親要素
     * @param {Object} player - プレイヤーオブジェクト
     */
    constructor(parentElement, player) {
        super(parentElement);
        this.wizard = player;
        
        this.element.classList.add('status-element');
        
        // ── 位置指定 ──────────────────────────────
        this.element.style.position  = 'absolute';  // 画面 or 親要素基準
        this.element.style.left      = '20%';       // 横 1/4（25 %）ライン
        this.element.style.top       = '50%';       // 縦 1/2（50 %）ライン
        this.element.style.transform = 'translate(-50%, -50%)';  // 要素自身の中心を基準点に合わせる
        
        this.element.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.element.style.padding = '20px';
        this.element.style.borderRadius = '10px';
        this.element.style.boxShadow = '0 0 15px rgba(100, 149, 237, 0.7)'; // 青色の光
        this.element.style.zIndex = '1000';
        this.element.style.display = 'none';
        this.element.style.flexDirection = 'column';
        this.element.style.alignItems = 'center';
        this.element.style.minWidth = '300px';
        this.element.style.color = 'white';
        this.element.style.fontFamily = 'Arial, sans-serif';
        
        // タイトル
        const title = document.createElement('h2');
        title.textContent = 'プレイヤーステータス';
        title.style.color = 'cornflowerblue';
        title.style.marginBottom = '20px';
        title.style.fontFamily = 'Arial, sans-serif';
        title.style.textAlign = 'center';
        this.element.appendChild(title);
        
        // ステータス情報を表示するテーブル
        this.statusTable = document.createElement('table');
        this.statusTable.style.width = '100%';
        //this.statusTable.style.borderCollapse = 'collapse';
        this.statusTable.style.marginBottom = '15px';
        this.element.appendChild(this.statusTable);
        
        // コンテナを親要素に追加
        this.parentElement.appendChild(this.element);
        //document.body.appendChild(this.element);
        this.element.style.display = 'none';
        this.element.style.position = 'fixed';     // カメラに流されない
        this.element.style.zIndex  = 1000;         // ゲーム画より前面
    }






    shosuu(value,kurai){
        return (Math.ceil(value * 100) / 100).toFixed(kurai)
    }
    
    hide() {
        super.hide();
        this.wizard.IsActive = true;
    }
    show() {
        super.show();
        this.wizard.IsActive = false;
    }

    /**
     * @desc ステータス表示を更新する
     */
    updateDisplay() {
        super.updateDisplay();
        // テーブルの内容をクリア
        this.statusTable.innerHTML = '';
        
        // プレイヤーのステータスデータを取得
        const statusData = [
            { name: '🗺️ステージ',       value: this.wizard.playerstatus.stage,                   color: 'white' },
           // { name: '🪙所持金', value: this.wizard.playerstatus.coins, color: 'gold' },
           // { name: '💲ショップ割引', value: this.wizard.playerstatus.shopcost, color: 'gold' },
            
            { name: '❤️HP', value: `${this.wizard.status.hp} / ${this.wizard.status.maxHP}`, color: 'white' },
            { name: '💠MP', value: `${Math.floor(this.wizard.status.mp)} / ${this.wizard.status.maxMP}`, color: 'white' },
            { name: '🍷MP自動回復', value: `${this.shosuu(this.wizard.status.mpregene,1)}`, color: 'white' },
            { name: '🗡️攻撃力', value: this.wizard.status.attack, color: 'white' },
            { name: '🛡️防御力', value: `${this.shosuu(this.wizard.status.deffence,1)}`, color: 'white' },
            { name: '🌀移動速度', value: this.shosuu(this.wizard.status.MaxSpeed,1), color: 'white' },




            { name: '🏹魔法貫通',       value: `${this.shosuu(this.wizard.status.attackPierceCount,1)}`,       color: 'white' },
            { name: '🎯誘導範囲',       value: `${this.wizard.status.HomingRadius}`,            color: 'white' },
            { name: '🧲誘導補正',       value: `${this.shosuu(this.wizard.status.HomingPower,1)}`,             color: 'white' },
            { name: '📡射程', value: `${this.wizard.status.AddLifeTime}`, color: 'white' },
            { name: '📒魔法個数', value: (this.wizard.status.FireCnt1), color: 'white' },

            { name: '🚀魔法速度',       value: `${this.shosuu(this.wizard.status.AddMaxSpeed,1)}`,             color: 'white' },
            { name: '🔋使用魔力',       value: `${this.wizard.status.UseMP}`,                  color: 'white' },
            
            { name: '🔥耐性', value: `${this.shosuu(this.wizard.status.RegistFIREBALL,2)}`, color: 'white' },
            { name: '❄️耐性', value: `${this.shosuu(this.wizard.status.RegistICE,2)}`, color: 'white' },
            { name: '⚡耐性', value: `${this.shosuu(this.wizard.status.RegistLIGHTNING,2)}`, color: 'white' },
            { name: '🌪️耐性', value: `${this.shosuu(this.wizard.status.RegistLIGHTNING,2)}`, color: 'white' },
            { name: '☄️耐性', value: `${this.shosuu(this.wizard.status.RegistMETEOR,2)}`, color: 'white' },
            { name: '💥耐性', value: `${this.shosuu(this.wizard.status.RegistEXPLOSION,2)}`, color: 'white' },
            { name: '💨耐性', value: `${this.shosuu(this.wizard.status.RegistGUST,2)}`, color: 'white' },
            { name: '🫧耐性', value: `${this.shosuu(this.wizard.status.RegistBUBBLE,2)}`, color: 'white' },
            { name: '🌈耐性', value: `${this.shosuu(this.wizard.status.RegistRAINBOW,2)}`, color: 'white' },
            { name: '🕸️耐性', value: `${this.shosuu(this.wizard.status.RegistWEB,2)}`, color: 'white' },
            { name: '🦂耐性', value: `${this.shosuu(this.wizard.status.RegistPOISONSTING,2)}`, color: 'white' },
            { name: '🗡️耐性', value: `${this.shosuu(this.wizard.status.RegistSWORDSLASH,2)}`, color: 'white' },
            { name: '🪓耐性', value: `${this.shosuu(this.wizard.status.RegistGREATAxe,2)}`, color: 'white' },
            { name: '🔨耐性', value: `${this.shosuu(this.wizard.status.RegistHAMMERCRUSH,2)}`, color: 'white' },
            { name: '🔱耐性', value: `${this.shosuu(this.wizard.status.RegistTRIDENTTHRUST,2)}`, color: 'white' },
            { name: '🛡️耐性', value: `${this.shosuu(this.wizard.status.RegistSHIELDBASH,2)}`, color: 'white' },

        ];

        // ② 2 つずつ取り出して 1 行にまとめる
        for (let i = 0; i < statusData.length; i += 2) {
            const row = document.createElement('tr');
            row.style.borderBottom = '1px solid rgba(255,255,255,0.2)';

            // 内部ヘルパー
            const addCellPair = (item) => {
                const nameTd  = document.createElement('td');
                const valueTd = document.createElement('td');

                nameTd.textContent  = item?.name  ?? '';
                valueTd.textContent = item?.value ?? '';

                // スタイル共通
                nameTd.style.padding  =
                    valueTd.style.padding = '8px 10px';
                nameTd.style.fontWeight = 'bold';
                nameTd.style.textAlign  = 'left';
                valueTd.style.textAlign = 'right';
                valueTd.style.color     = item?.color ?? 'inherit';

                row.appendChild(nameTd);
                row.appendChild(valueTd);
            };

            addCellPair(statusData[i]);           // 左列
            addCellPair(statusData[i + 1]);       // 右列（要素が無ければ空セル）

            this.statusTable.appendChild(row);
        }

        /*
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
        */
    }
}
