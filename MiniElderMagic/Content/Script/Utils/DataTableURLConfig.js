/* =====================================================================
 *  DataTableURLConfig.js – MiniElderMagic
 * ---------------------------------------------------------------------
 *  • “remote / local / custom” 3 モードの URL マップを一元管理
 *  • custom マップは任意のプロファイルとして複数保持可能
 *  • 選択状態とカスタムマップを localStorage に永続化 / 起動時に復元
 * ==================================================================== */

export class DataTableURLConfig {
    /** 現在のモード ("remote" | "local" | "custom") */
    static MODE = 'local';

    /* -- デフォルト URL マップ ------------------------------------- */
    static #remote = {
        magic      : 'https://docs.google.com/spreadsheets/d/14KPqmm0KQ-wlcgV-WMGqlqIwCCoz94hI8InyBMPmJdA/export?format=csv',
        item       : 'https://docs.google.com/spreadsheets/d/174mPJFw8fMOP5DAzL70FcuW549VnZK6FeVDcCkvfYfU/export?format=csv',
        enemy      : 'https://docs.google.com/spreadsheets/d/1v_q-56Nb_CtzkIZBThYEuBWScLzRIBaiQlI5mtugv9w/export?format=csv',
        wizard     : 'https://docs.google.com/spreadsheets/d/1CRTX72AUu4QXko0QUUq6X7LaNLxfy0YausEIx9zFBJA/export?format=csv',
        enemyai    : 'https://docs.google.com/spreadsheets/d/16F7ksDu0R-01dE1ik7vZOADMWYiyqbCecUDhTVzOO5c/export?format=csv',
        mapChip    : 'https://docs.google.com/spreadsheets/d/178l4JKlUGkUFAUFfU6Dt0yAyUwkOeCNQLc5tkn2BUSg/export?format=csv',
        mapColor   : 'https://docs.google.com/spreadsheets/d/1fa4ZvsC3VE6mrOywsCM2H_3H8dGRoskF0LHAEz8-_VY/export?format=csv',
        mapEnemyPop: 'https://docs.google.com/spreadsheets/d/1tKr0LiD74U8PhFlnU6alooSWucwTK0qY6xmm6PnZ6Zc/export?format=csv',
        mapEvent   : 'https://docs.google.com/spreadsheets/d/1O08oReBUjC22NyOL-902NcZaZdeGtxj3FNRsBYbkDCY/export?format=csv',
        mapDropPopItem: 'https://docs.google.com/spreadsheets/d/1vrdjApsk2xD-IaNrskusJPwARl7x0KazGLBTy7LTV3o/export?format=csv',
        eventTile  : 'https://docs.google.com/spreadsheets/d/1knfjOwpXSkw6HYBdZn7Ugkk73sc88cPSsGLuv1EeMx8/export?format=csv',
        event      : 'https://docs.google.com/spreadsheets/d/1Yz0RJs4WuimcoH2Af6c1JclQL46bgGOGj1QUqAnfXPc/export?format=csv',
        text       : 'https://docs.google.com/spreadsheets/d/1GzKK2-oFpGMc3kr1TYE6U-7_DeLjDN81zdQUGumimxo/export?format=csv',
    };

    static #local = {
        magic      : 'data/magic.csv',
        item       : 'data/item.csv',
        enemy      : 'data/enemy.csv',
        wizard     : 'data/wizard.csv',
        enemyai    : 'data/enemyai.csv',
        mapChip    : 'data/mapChip.csv',
        mapColor   : 'data/mapColor.csv',
        mapEnemyPop: 'data/mapEnemyPop.csv',
        mapEvent   : 'data/mapEvent.csv',
        mapDropPopItem: 'data/mapDropPopItem.csv',
        eventTile  : 'data/eventTile.csv',
        event      : 'data/event.csv',
        text       : 'data/text.csv',
    };

    /* ユーザが編集できるカスタムマップ（プロファイル単位で切替） */
    static #customRemote = {};

    /* --------------------- public API ----------------------------- */

    /**
     * カスタム URL マップを設定
     * @param {Record<string,string>} map  key → URL
     * @param {boolean} autoSwitch         true: MODE を custom にする
     */
    static setCustomRemote(map, autoSwitch = true) {
        this.#customRemote = { ...map };
        if (autoSwitch) this.MODE = 'custom';
    }

    /**
     * 現在の URL マップ、または特定キーの URL を取得
     * @param {string=} key   省略時は全マップ
     * @returns {string|Object<string,string>}
     */
    static get(key) {
        this.#ensureInit();
        const src = this.#srcByMode();
        return key ? src[key] : src;
    }

    /* -------------------- private helpers ------------------------- */

    /** 起動時に一度だけ localStorage から状態を復元 */
    static #initialized = false;
    static #ensureInit() {
        if (this.#initialized) return;
        this.#initialized = true;

        try {
            /* MODE / customMap を直接保存するキー */
            const raw = localStorage.getItem('MEM_DataTableSource');
            if (raw) {
                const { mode, custom } = JSON.parse(raw);
                if (custom) this.setCustomRemote(custom, false);
                if (mode)   this.MODE = mode;
            }
        } catch (err) {
            console.warn('[DataTableURLConfig] init failed:', err);
        }
    }

    /** MODE に応じたマップを返す */
    static #srcByMode() {
        switch (this.MODE) {
            case 'local':  return this.#local;
            case 'custom': return this.#customRemote;
            case 'remote':
            default:       return this.#remote;
        }
    }
}
