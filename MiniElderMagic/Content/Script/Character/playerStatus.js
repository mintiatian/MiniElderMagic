export class PlayerStatus {
    /**
     * @param {number} coins - 初期コイン数
     * @param {number} stage - 初期ステージ番号
     */
    constructor(coins = 0, stage = 1) {
        this.coins = coins;

        this.MagicName = "FIREBALL";    // 初期
        this.HasMagics = [];
        
        this.shoplevel = 1;
        
        this.shopcost = 0;

        this.lastInnPos = {x:0, y:0};   // 現在位置を初期値にしておく
    }



    /**
     * @desc コインを追加する
     * @param {number} amount - 追加するコイン数
     */
    addCoins(amount = 1) {
        this.coins += amount;
    }

}