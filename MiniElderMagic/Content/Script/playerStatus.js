export class PlayerStatus {
  /**
   * @param {number} coins - 初期コイン数
   * @param {number} stage - 初期ステージ番号
   */
  constructor(coins = 0, stage = 1) {
    this.coins = coins;
    this.stage = stage;
  }

  /**
   * @desc コインを追加する
   * @param {number} amount - 追加するコイン数
   */
  addCoins(amount = 1) {
    this.coins += amount;
  }

  /**
   * @desc ステージを進める
   */
  nextStage() {
    this.stage++;
  }

  /**
   * @desc ステージを指定の番号に設定
   * @param {number} stageNumber - 設定するステージ番号
   */
  setStage(stageNumber) {
    this.stage = stageNumber;
  }
}