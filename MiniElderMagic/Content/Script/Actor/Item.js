import {Actor} from '../Base/Actor.js';
import {CollisionType} from "../Base/Pawn.js";
import {itemDataTable} from "../Utils/DataTable.js";
import {gameMainScene} from "../Scene/GameMainScene.js";

export class Item extends Actor {
    /**
     * @param {number} x - 初期x位置
     * @param {number} y - 初期y位置
     * @param {HTMLElement} parentElement - 親要素
     * @param {string} specifyDropID - ドロップ指定
     */
    constructor(x, y, parentElement, specifyDropID = null) {
        const LIFE_TIME = 60000;       // 15 秒

        let DropItemData = null;

        for (const item of itemDataTable.table) {
            const randomValue = Math.random();
            if (item[1].drop >= randomValue) {
                DropItemData = item[1];

                //console.log(DropItemData.emoji);
                //console.log("drop",DropItemData.emoji,item[1].drop," >= ",randomValue)
                break; // ← これでループを抜けられる
            }
        }

        // 指定ドロップ
        if (specifyDropID !== null) {
            DropItemData = itemDataTable.get(specifyDropID);
        }


        if (DropItemData === null) {
            DropItemData = itemDataTable.get("DropCOIN");
        }

        super(x, y, DropItemData.emoji, parentElement);

        this.DropItemData = DropItemData;
        //console.log(DropItemData.emoji);
        this.setCollisionType(CollisionType.TRIGGER);


        this._lifeRemain = LIFE_TIME;   // ms
        this._expired = false;            // 二重 Exit 防止

        // ここで丸背景用のクラスを足す
        this.element.classList.add('item-round');

        // （必要なら）円形サイズに合わせてヒットボックスを更新
        this.width = this.element.offsetWidth;
        this.height = this.element.offsetHeight;
    }

    /**
     * @desc コインはHP管理不要なのでupdateを最小限に
     */
    update(delta) {
        super.update(delta);

        if (this._expired) return;          // 既に消滅処理済み

        this._lifeRemain -= delta;
        if (this._lifeRemain <= 0) {
            this._expired = true;
            this.ExitStart();               // 時間切れで削除
        }
    }

    TriggerBegin(other) {
        super.TriggerBegin(other);
        if (other.emoji === gameMainScene.wizard.emoji) {

            other.addItem(this.DropItemData);


            this.ExitStart();
        }
    }

}