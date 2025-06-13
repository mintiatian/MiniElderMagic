import {Character} from "../Base/Character.js";
import {Status} from "./Status.js";
import {GAUGE_KIND, UIGage} from "../UI/UIGage.js";
import {magicDataTable} from "../Utils/DataTable.js";
import {MagicBase} from "../Magic/MagicBase.js";

export class CharacterBase extends Character {

    /**
     * @param {number} x - 初期x位置
     * @param {number} y - 初期y位置
     * @param {number} speed - 1フレームごとの移動量
     * @param {string} emoji - キャラクターの絵文字
     * @param {HTMLElement} parentElement - 親要素
     * @param {CharacterDataTable} charaData - 親要素
     * @param {float} ratio - 強さ倍率
     */
    constructor(x, y, parentElement, charaData,ratio = 1) {
        super(x, y, charaData.MaxSpeed, charaData.emoji, parentElement);

        // ステータス管理クラスのインスタンス
        this.status = new Status();
        this.setCharacterData(charaData,ratio);

        this.BarrierId = "";
    }


    Fire(attack1, attack2, staffPos) {

        if (this.status.mp >= this.MagicData.useMP + this.status.UseMP) {
            this.status.useMP(this.MagicData.useMP + this.status.UseMP);
        } else {
            return;
        }


        //console.log("Fire!! 06");
        for (let i = 0; i < attack1; i++) {

            //console.log("Fire!! 07");
            const newMagic = new MagicBase(staffPos.x, staffPos.y, this.MagicData, this.parentElement);

            newMagic.setDir(this.radian + ((i * 0.1) * this.status.AttackdirRatio));
            newMagic.setAcceleration(1);
            newMagic.setOwner(this);

        }
        for (let i = 1; i < (attack2 + 1); i++) {

            const newMagic = new MagicBase(staffPos.x, staffPos.y, this.MagicData, this.parentElement);

            newMagic.setDir(this.radian - ((i * 0.1) * this.status.AttackdirRatio));
            newMagic.setAcceleration(1);
            newMagic.setOwner(this);

        }
    }

    SettingMagicData() {
        this.SetMagic(this.charaData.attackMagic);
        this.IsActive = true;
    }

    SetMagic(MagicName) {
        this.MagicData = magicDataTable.get(MagicName);
    }

    setCharacterData(charaData, ratio = 1) {
        this.charaData = charaData;
        if (charaData) {

            this.charaData = charaData;

            this.status.maxHP = this.status.hp = this.charaData.hp * ratio;
            this.status.maxMP = this.status.mp = this.charaData.mp * ratio;
            this.status.mpregene = this.charaData.mpregene * ratio;

            this.status.deffence = this.charaData.deffence * ratio;

            this.status.MaxSpeed = this.charaData.MaxSpeed * this.mapRangeClamped(ratio, 1, 10, 1.0, 1.5);
            this.MaxSpeed = this.status.MaxSpeed;

            this.status.attackPierceCount = this.charaData.attackPierceCount * ratio;
            this.status.HomingRadius = this.charaData.HomingRadius * ratio;
            this.status.HomingPower = this.charaData.HomingPower * ratio;
            this.status.AddLifeTime = this.charaData.AddLifeTime * ratio;
            this.status.FireCnt1 = this.charaData.FireCnt1 * this.mapRangeClamped(ratio, 1, 10, 1.0, 16);
            this.status.FireCnt2 = this.charaData.FireCnt2 * this.mapRangeClamped(ratio, 1, 10, 1.0, 16);

            this.status.UseMP = this.charaData.UseMP;
            this.status.AddMaxSpeed = this.charaData.AddMaxSpeed * ratio;


            this.status.RegistFIREBALL = this.charaData.RegistFIREBALL;
            this.status.RegistICE = this.charaData.RegistICE;
            this.status.RegistLIGHTNING = this.charaData.RegistLIGHTNING;
            this.status.RegistTORNADO = this.charaData.RegistTORNADO;
            this.status.RegistMETEOR = this.charaData.RegistMETEOR;
            this.status.RegistEXPLOSION = this.charaData.RegistEXPLOSION;
            this.status.RegistGUST = this.charaData.RegistGUST;
            this.status.RegistBUBBLE = this.charaData.RegistBUBBLE;
            this.status.RegistRAINBOW = this.charaData.RegistRAINBOW;
            this.status.RegistWEB = this.charaData.RegistWEB;
            this.status.RegistPOISONSTING = this.charaData.RegistPOISONSTING;
            this.status.RegistSWORDSLASH = this.charaData.RegistSWORDSLASH;
            this.status.RegistGREATAxe = this.charaData.RegistGREATAxe;
            this.status.RegistHAMMERCRUSH = this.charaData.RegistHAMMERCRUSH;
            this.status.RegistTRIDENTTHRUST = this.charaData.RegistTRIDENTTHRUST;
            this.status.RegistSHIELDBASH = this.charaData.RegistSHIELDBASH;
        }

        this.SettingMagicData();
    }

    mapRangeClamped(value, inMin, inMax, outMin, outMax) {
        if (value <= inMin) return outMin;        // 下限でクランプ
        if (value >= inMax) return outMax;        // 上限でクランプ
        return outMin + (value - inMin) * (outMax - outMin) / (inMax - inMin);
    }

    SetupHPGage() {
        this.hpGage = new UIGage(this.element, GAUGE_KIND.HP);
    }

    SetupMPGage() {
        this.mpGage = new UIGage(this.element, GAUGE_KIND.MP);
    }

    update(delta) {

        /* ───────── 1. MP 回復 & MP ゲージ更新 ───────── */
        this.status.regeneMP();

        if (this.status.hp > 0) {
            super.update(delta);
        }
        // HPが0以下になったら、フェードアウト処理
        else if (this.status.hp <= 0 && !this.isFadingOut) {

            if (this.hpGage) {
                this.hpGage.hide();
            }

            this.ExitStart();
        }


        if (this.hpGage) {
            this.hpGage.update(this.status.hp, this.status.maxHP);
        }

        if (this.mpGage) {
            this.mpGage.update(this.status.mp, this.status.maxMP);
        }
    }


    /**
     * @desc ダメージを受けたときの処理
     * @param {MagicDataTable} MagicData - ダメージの元データ
     * @param {Number} addAttack - ダメージの元データ
     */
    takeDamage(MagicData, addAttack) {

        let ratio = 1.0;


        switch (MagicData.id) {
            case "FIREBALL":
                ratio = this.status.RegistFIREBALL;
                break;
            case "ICE":
                ratio = this.status.RegistICE;
                break;
            case "LIGHTNING":
                ratio = this.status.RegistLIGHTNING;
                break;
            case "TORNADO":
                ratio = this.status.RegistTORNADO;
                break;
            case "METEOR":
                ratio = this.status.RegistMETEOR;
                break;
            case "EXPLOSION":
                ratio = this.status.RegistEXPLOSION;
                break;
            case "GUST":
                ratio = this.status.RegistGUST;
                break;
            case "BUBBLE":
                ratio = this.status.RegistBUBBLE;
                break;
            case "RAINBOW":
                ratio = this.status.RegistRAINBOW;
                break;
            case "WEB":
                ratio = this.status.RegistWEB;
                break;
            case "POISONSTING":
                ratio = this.status.RegistPOISONSTING;
                break;
            case "SWORDSLASH":
                ratio = this.status.RegistSWORDSLASH;
                break;
            case "GREATAxe":
                ratio = this.status.RegistGREATAxe;
                break;
            case "HAMMERCRUSH":
                ratio = this.status.RegistHAMMERCRUSH;
                break;
            case "TRIDENTTHRUST":
                ratio = this.status.RegistTRIDENTTHRUST;
                break;
            case "SHIELDBASH":
                ratio = this.status.RegistSHIELDBASH;
                break;

            default:
                ratio = 1; // 既定値（必要に応じて調整）
                break;
        }

        if (this.BarrierId) {
            ratio *= 0.3;
        }


        console.log("ratiocheck : ", (MagicData.damage + addAttack) * ratio, "=", (MagicData.damage + addAttack), "x", ratio);
        // statusオブジェクトにダメージを適用
        let damage = (MagicData.damage + addAttack) * ratio;
        damage = this.status.takeDamage(damage);

        // HPゲージを更新
        this.hpGage.update(this.status.hp, this.status.maxHP);

        // ダメージテキストを表示
        if (damage > 0) {
            this.showFloatingText(`-${damage.toFixed(0)}`, 'red', 3000, Math.floor(Math.random() * 40) - 20, -40 + Math.floor(Math.random() * 20));
            this.AnimationPulse("damage", 0.25);
        }
    }

    getDamageColor(ratio) {
        const clamped = Math.min(Math.max(ratio, 0), 2);        // 0〜3 に丸める
        const hue = 120 - 120 * (clamped / 2);                  // 120→0 に反比例
        return `hsl(${hue}deg 100% 50%)`;                       // 彩度 100%, 輝度 50%
    }

    AddBarrier() {
        this.BarrierId = this.addOverlay("🟡");
        this.MaxSpeed = 0;
    }

    RemoveBarrier() {
        this.removeOverlay(this.BarrierId);
        this.BarrierId = "";
        this.MaxSpeed = this.status.MaxSpeed;
    }

    /**
     * @desc HPを回復する
     * @param {number} amount - 回復量
     */
    heal(amount) {
        // Statusオブジェクトの回復メソッドを呼び出し、実際に回復した量を取得
        const healedAmount = this.status.heal(amount);

        // HPゲージを更新
        this.hpGage.update(this.status.hp, this.status.maxHP);

        // 回復テキストを表示
        if (healedAmount > 0) {
            this.showFloatingText(`+${healedAmount}`, 'lightgreen', 3000, -50);
        }

        return healedAmount;
    }
}