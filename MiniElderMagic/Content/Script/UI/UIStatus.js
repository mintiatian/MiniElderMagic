/* UIStatus.js ─ MiniElderMagic
 * プレイヤーの各種ステータスを一覧表示するウィンドウ
 * 数値が変化したときは色付き＋スケールアップで 0.6 秒フラッシュ
 * ------------------------------------------------------------------ */
import { UIBase }       from "./UIBase.js";
import { textDataTable} from "../Utils/DataTable.js";

export class UIStatus extends UIBase {
    /**
     * @param {HTMLElement} parentElement – ステータス UI を配置する親要素
     * @param {Wizard}      player        – 対応するプレイヤー（Wizard）
     */
    constructor(parentElement, player) {
        super(parentElement);
        this.wizard = player;

        /* ========= 一度だけアニメーション用 CSS を注入 ========= */
        if (!document.getElementById("ui-status-anim-style")) {
            const css = `
@keyframes flashUp   { 0% {color:#6f6;transform:scale(3);} 100% {color:inherit;transform:scale(1);} }
@keyframes flashDown { 0% {color:#f66;transform:scale(3);} 100% {color:inherit;transform:scale(1);} }
.value-flash-up   { animation: flashUp   0.6s ease; }
.value-flash-down { animation: flashDown 0.6s ease; }`;
            const style = document.createElement("style");
            style.id = "ui-status-anim-style";
            style.textContent = css;
            document.head.appendChild(style);
        }

        /* ========= 基本レイアウト ========= */
        this.element.classList.add("status-element");
        Object.assign(this.element.style, {
            position:   "absolute",
            left:       "1%",
            top:        "50%",
            transform:  "translate(0%,-50%)",
            background: "rgba(0,0,0,0.8)",
            padding:    "20px",
            borderRadius: "10px",
            boxShadow:  "0 0 15px rgba(100,149,237,0.7)",
            zIndex:     1000,
            display:    "none",
            flexDirection: "column",
            alignItems: "center",
            minWidth:   "300px",
            color:      "white",
            fontFamily: "Arial, sans-serif",
        });

        /* ---------- タイトル ---------- */
        const title = document.createElement("h2");
        title.textContent   = "Player Status";
        title.style.color   = "cornflowerblue";
        title.style.margin  = "0 0 20px 0";
        title.style.textAlign = "center";
        this.element.appendChild(title);

        /* ---------- ステータス表 ---------- */
        this.statusTable           = document.createElement("table");
        this.statusTable.style.width  = "100%";
        this.statusTable.style.marginBottom = "15px";
        this.element.appendChild(this.statusTable);

        /* ---------- DOM へ追加 ---------- */
        this.parentElement.appendChild(this.element);
        this.element.style.position = "fixed";        // カメラ移動と独立
        this.element.style.display  = "none";

        /* ---------- 前回値のキャッシュ ---------- */
        this._prevValues = Object.create(null);
    }

    /* ========= ユーティリティ ========= */
    shosuu(value, kurai) {
        return (Math.ceil(value * 100) / 100).toFixed(kurai);
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
     * ステータス表示を更新（変動時はアニメーション）
     */
    updateDisplay() {
        super.updateDisplay();
        this.statusTable.innerHTML = "";

        /* ---------- 表示するステータス配列 ---------- */
        const s = this.wizard.status;
        const T = (key) => textDataTable.get(key).text;
        const statusData = [
            { name:`⚔️${T("stage")}`,              value:s.shopBuyCount                      },
            { name:`❤️${T("HP")}`,                value:`${Math.floor(s.hp)} / ${s.maxHP}`  },
            { name:`💠${T("MP")}`,                value:`${Math.floor(s.mp)} / ${s.maxMP}`  },
            { name:`🍷${T("MPAutoRecovery")}`,    value:this.shosuu(s.mpregene,1)            },
            { name:`🗡️${T("AttackPower")}`,       value:s.attack                             },
            { name:`🛡️${T("Defensepower")}`,      value:this.shosuu(s.deffence,1)            },
            { name:`🌀${T("movementspeed")}`,     value:this.shosuu(s.MaxSpeed,2)            },

            { name:`🏹${T("MagicPierce")}`,        value:this.shosuu(s.attackPierceCount,1)   },
            { name:`🎯${T("Inductionrange")}`,     value:s.HomingRadius                      },
            { name:`🧲${T("Inductioncorrection")}`,value:this.shosuu(s.HomingPower,1)        },
            { name:`📡${T("Range")}`,             value:s.AddLifeTime                       },
            { name:`📒${T("MagicCount")}`,        value:s.FireCnt1                           },

            { name:`🚀${T("magicspeed")}`,        value:this.shosuu(s.AddMaxSpeed,1)         },
            { name:`🔋${T("Magicpowerused")}`,    value:s.UseMP                              },

            { name:`🔥${T("Resistance")}`, value:this.shosuu(s.RegistFIREBALL,2)     },
            { name:`❄️${T("Resistance")}`, value:this.shosuu(s.RegistICE,2)          },
            { name:`⚡${T("Resistance")}`, value:this.shosuu(s.RegistLIGHTNING,2)     },
            { name:`🌪️${T("Resistance")}`, value:this.shosuu(s.RegistTORNADO,2)      },
            { name:`☄️${T("Resistance")}`, value:this.shosuu(s.RegistMETEOR,2)       },
            { name:`💥${T("Resistance")}`, value:this.shosuu(s.RegistEXPLOSION,2)    },
            { name:`💨${T("Resistance")}`, value:this.shosuu(s.RegistGUST,2)         },
            { name:`🫧${T("Resistance")}`, value:this.shosuu(s.RegistBUBBLE,2)       },
            { name:`🌈${T("Resistance")}`, value:this.shosuu(s.RegistRAINBOW,2)      },
            { name:`🕸️${T("Resistance")}`, value:this.shosuu(s.RegistWEB,2)         },
            { name:`🦂${T("Resistance")}`, value:this.shosuu(s.RegistPOISONSTING,2)  },
            { name:`🗡️${T("Resistance")}`, value:this.shosuu(s.RegistSWORDSLASH,2)  },
            { name:`🪓${T("Resistance")}`, value:this.shosuu(s.RegistGREATAxe,2)     },
            { name:`🔨${T("Resistance")}`, value:this.shosuu(s.RegistHAMMERCRUSH,2) },
            { name:`🔱${T("Resistance")}`, value:this.shosuu(s.RegistTRIDENTTHRUST,2)},
            { name:`🛡️${T("Resistance")}`, value:this.shosuu(s.RegistSHIELDBASH,2)  },
        ];

        /* ---------- 2 つずつ 1 行にまとめて描画 ---------- */
        for (let i = 0; i < statusData.length; i += 2) {
            const row = document.createElement("tr");
            row.style.borderBottom = "1px solid rgba(255,255,255,0.2)";

            /* 内部ヘルパー – 片側セルを生成 */
            const addCellPair = (item) => {
                const nameTd  = document.createElement("td");
                const valueTd = document.createElement("td");

                /* --- 空セル処理 --- */
                if (!item) {
                    nameTd.style.padding  =
                        valueTd.style.padding = "8px 10px";
                    row.append(nameTd, valueTd);
                    return;
                }

                nameTd.textContent  = item.name;
                nameTd.style.fontWeight = "bold";
                nameTd.style.textAlign  = "left";

                /* === 変化検出 & アニメ付与 === */
                const curVal  = String(item.value);
                const prevVal = this._prevValues[item.name];

                if (prevVal !== undefined && prevVal !== curVal) {
                    /* 両方数値なら大小比較、そうでなければ単純差分 */
                    const numCur  = parseFloat(curVal);
                    const numPrev = parseFloat(prevVal);
                    const isUp =
                        !isNaN(numCur) && !isNaN(numPrev)
                            ? numCur > numPrev
                            : curVal > prevVal;

                    valueTd.classList.add(
                        isUp ? "value-flash-up" : "value-flash-down"
                    );
                    /* アニメ終了後にクラスを外す */
                    setTimeout(
                        () =>
                            valueTd.classList.remove(
                                "value-flash-up",
                                "value-flash-down"
                            ),
                        600
                    );
                }

                valueTd.textContent = curVal;
                this._prevValues[item.name] = curVal;    // キャッシュ更新

                /* --- 共通スタイル --- */
                [nameTd, valueTd].forEach((td) => {
                    td.style.padding = "8px 10px";
                });
                valueTd.style.textAlign = "right";
                valueTd.style.color     = item.color ?? "inherit";

                row.append(nameTd, valueTd);
            };

            addCellPair(statusData[i]);       // 左側
            addCellPair(statusData[i + 1]);   // 右側（無い場合は空セル）
            this.statusTable.appendChild(row);
        }
    }
}
