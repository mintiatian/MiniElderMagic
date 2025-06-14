export class Status {
    /**
     * @param {number} hp - プレイヤーや敵の体力
     * @param {number} mp - スキルなどに使う魔力
     * @param {number} speed - 移動速度
     * @param {number} attack - 攻撃力
     * @param {number} maxHP - 最大HP（省略時はhpと同じ値）
     * @param {number} maxMP - 最大MP（省略時はmpと同じ値）
     */
    constructor(hp = 100, mp = 50,
                mpregene=0,deffence=0, speed = 3, attack = 10,
                maxHP  = 10, maxMP = 10) {


        this.MaxSpeed = speed;
        this.hp = hp;
        this.mp = mp;
        this.maxHP = maxHP !== null ? maxHP : hp; // maxHPが指定されなければhpと同じ値を設定
        this.maxMP = maxMP !== null ? maxMP : mp; // maxMPが指定されなければmpと同じ値を設定
        
        this.mpregene = mpregene;
        this.deffence = deffence;
        


        
        this.attack = attack;
        this.attackPierceCount = 0;
        
        this.HomingRadius = 0;
        this.HomingPower = 0;
        this.AddLifeTime = 0;
        this.FireCnt1 = 0;
        this.UseMP = 0;
        this.AddMaxSpeed = 0;
        
        
        this.RegistFIREBALL = 0;
        this.RegistICE = 0;
        this.RegistLIGHTNING = 0;
        this.RegistTORNADO = 0;
        this.RegistMETEOR = 0;
        this.RegistEXPLOSION = 0;
        this.RegistGUST = 0;
        this.RegistBUBBLE = 0;
        this.RegistRAINBOW = 0;
        this.RegistWEB = 0;
        this.RegistPOISONSTING = 0;
        this.RegistSWORDSLASH = 0;
        this.RegistGREATAxe = 0;
        this.RegistHAMMERCRUSH = 0;
        this.RegistTRIDENTTHRUST = 0;
        this.RegistSHIELDBASH = 0;

        this.AttackdirRatio = 1;
        
        this.shopBuyCount = 0;
    }    

    addMagicLevelUp() {

        this.FireCnt1++;
    }

    /**
     * @desc 現在のHPを減らす
     * @param {number} damage - 受けるダメージ量
     */
    takeDamage(damage) {
        let finalDamage = Math.max(0, damage - this.deffence);
        this.hp -= finalDamage;

        this.hp = Math.max(0, this.hp);
        return finalDamage;
    }

    /**
     * @desc HPを回復する
     * @param {number} amount - 回復量
     * @returns {number} - 実際に回復した量
     */
    heal(amount) {
        const oldHp = this.hp;
        this.hp += amount;

        // 最大HPを超えないように調整
        if (this.hp > this.maxHP) {
            this.hp = this.maxHP;
        }

        // 実際に回復した量を返す
        return this.hp - oldHp;
    }

    /**
     * @desc MPを消費する
     * @param {number} cost - スキル等に必要なMP消費量
     */
    useMP(cost) {
        this.mp -= cost;
        if (this.mp < 0) {
            this.mp = 0;
            // MP不足時の処理を入れたい場合はここで実装
        }
        //console.log("useMP",this.mp);
    }

    /**
     * @desc MPを回復する
     * @param {number} amount - 回復量
     */
    recoverMP(amount) {
        this.mp += amount;
        // 最大MPを超えないように調整
        if (this.mp > this.maxMP) {
            this.mp = this.maxMP;
        }
        console.log("recoverMP",this.mp);
    }

    regeneMP() {
        this.mp += this.mpregene;
        // 最大MPを超えないように調整
        if (this.mp > this.maxMP) {
            this.mp = this.maxMP;
        }
        //console.log("regeneMP",this.mp);
    }
    

    /**
     * @desc 攻撃力を調整する
     * @param {number} newAttack - 新しい攻撃力
     */
    setAttack(newAttack) {
        this.attack = newAttack;
    }

    /**
     * @desc 最大HPを変更する
     * @param {number} newMaxHP - 新しい最大HP値
     * @param {boolean} adjustCurrentHP - 現在のHPも同時に調整するかどうか（trueなら現在HPも変化、falseなら最大値だけ変更）
     */
    setMaxHP(newMaxHP, adjustCurrentHP = false) {
        // 最大HP値を変更
        this.maxHP = newMaxHP;

        // 現在HPを調整するオプションが有効なら、現在HPも比率に合わせて変更
        if (adjustCurrentHP) {
            // 元の最大HPに対する現在HPの割合を計算
            const ratio = this.hp / this.maxHP;
            // 新しい最大HPに合わせて現在HPを調整
            this.hp = Math.floor(newMaxHP * ratio);
        }

        // 現在HPが最大HPを超えていたら最大値に制限
        if (this.hp > this.maxHP) {
            this.hp = this.maxHP;
        }
    }

    /**
     * @desc 最大MPを変更する
     * @param {number} newMaxMP - 新しい最大MP値
     * @param {boolean} adjustCurrentMP - 現在のMPも同時に調整するかどうか
     */
    setMaxMP(newMaxMP, adjustCurrentMP = false) {
        this.maxMP = newMaxMP;

        if (adjustCurrentMP) {
            const ratio = this.mp / this.maxMP;
            this.mp = Math.floor(newMaxMP * ratio);
        }

        if (this.mp > this.maxMP) {
            this.mp = this.maxMP;
        }
        console.log("setMaxMP",this.mp);
    }


}