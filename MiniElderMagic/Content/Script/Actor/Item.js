import {Actor} from '../Base/Actor.js';
import {CollisionType} from "../Base/Pawn.js";
import {itemDataTable} from "../Utils/DataTable.js";


export class Item extends Actor {
    /**
     * @param {number} x - 初期x位置
     * @param {number} y - 初期y位置
     * @param {HTMLElement} parentElement - 親要素
     * @param {string} specifyDropID - ドロップ指定
     */
    constructor(x, y, parentElement, specifyDropID = null) {


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

    }

    /**
     * @desc コインはHP管理不要なのでupdateを最小限に
     */
    update(delta) {
        super.update(delta);
    }

    TriggerBegin(other) {
        super.TriggerBegin(other);
        if (other.emoji === "🧙") {

            other.addItem(this.DropItemData);


            this.ExitStart();
        }
    }

}