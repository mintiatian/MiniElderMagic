// data/MagicDataManager.js
import Papa from 'https://cdn.jsdelivr.net/npm/papaparse@5.4.1/+esm';

/**
 * CSV ファイルを読み込んで配列（1 行 = 1 オブジェクト）を返す
 *   - header: true なので 1 行目の見出しがキーになる
 *   - dynamicTyping: true で "5" → 5 などに自動変換
 * @param  {string} url   CSV ファイルの URL / パス
 * @return {Promise<Object[]>}  パース済みデータ
 */
export async function loadCSV2(url) {
    const csvText = await fetch(url).then(r => {
        if (!r.ok)
            throw new Error(`loadCSV: HTTP ${r.status} – ${url}`);
        return r.text();
    });

    const { data, errors } = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        transformHeader: h => h.trim(),
    });

    if (errors.length) {
        console.warn('loadCSV: CSV parse errors', errors);
    }
    return data;   // 例: [{ id:'Event_01', titleEmoji:'🧑', text:'{...}', ... }, ...]
}



export async function loadCSV(url, { header = true } = {}) {
    const res  = await fetch(url);
    const text = await res.text();

    // ① 行単位に分割
    const rows = text.trim().split(/\r?\n/).map(r => r.split(','));

    // ② ヘッダーありなら 1 行目をキーに
    if (header) {
        const keys = rows.shift();
        return rows.map(r => Object.fromEntries(r.map((v, i) => [keys[i], v])));
    }
    // ③ ヘッダーなしなら単純配列
    return rows;
}


export class DataTable {
    static table = new Map();
    
    static get(id) { return this.table.get(id); }
}

export let magicDataTable = null;

export class MagicDataTable {
    static table = new Map();

    static get(id) { return this.table.get(id); }

    static async init(csvUrl = '/assets/magic.csv') {
        const rows = await loadCSV(csvUrl);          // [{id,emoji,useMP,…}, …]
        for (const row of rows) {
            this.table.set(row.id, new MagicDataTable(row));

            //console.log(row.id,row);
        }
        magicDataTable = this;
    }


    constructor({ id, emoji, useMP, lifeTime, maxSpeed,damage,InfoText }) {
        this.id        = id;       // SpellID など
        this.emoji     = emoji;
        this.useMP     = +useMP;   // 数値にキャスト
        this.lifeTime  = +lifeTime;
        this.maxSpeed  = +maxSpeed;
        this.damage = +damage;
        this.InfoText = +InfoText;
        
    }
}


export let itemDataTable = null;

export class ItemDataTable{
    static table = new Map();
    static emojiToId = new Map();
    static get(id) { return this.table.get(id); }
    /** 追加: emoji から id を取得する */
    static getIdByEmoji(emoji) {
        return this.emojiToId.get(emoji) ?? null;   // 見つからなければ null
    }
    static async init(csvUrl = '/assets/magic.csv') {
        const rows = await loadCSV(csvUrl);          // [{id,emoji,useMP,…}, …]
        for (const row of rows) {
            this.table.set(row.id, new ItemDataTable(row));
            this.emojiToId.set(row.emoji, row.id);   // 逆引きマップを構築
        }
        itemDataTable = this;
    }
    constructor({ id ,emoji ,type,value,shopcost,drop,shop,filtertype,infotext}){
        this.emoji = emoji;
        this.type = type;
        this.value = value;
        this.shopcost = shopcost;
        this.drop = drop;
        this.shop = Number(shop);
        this.filtertype = filtertype;
        this.infotext = infotext;
    }
}


export let enemyDataTable = null;
export let wizardDataTable = null;

export class CharacterDataTable {

    
    constructor({ id ,emoji ,MaxSpeed,hp,mp,mpregene,
                    deffence,
                    attackMagic,attack,
                    attackPierceCount,HomingRadius,HomingPower,AddLifeTime,
                    FireCnt1,FireCnt2,UseMP,AddMaxSpeed,
                    RegistFIREBALL,
                    RegistICE,
                    RegistLIGHTNING,
                    RegistTORNADO,
                    RegistMETEOR,
                    RegistEXPLOSION,
                    RegistGUST,
                    RegistBUBBLE,
                    RegistRAINBOW,
                    RegistWEB,
                    RegistPOISONSTING,
                    RegistSWORDSLASH,
                    RegistGREATAxe,
                    RegistHAMMERCRUSH,
                    RegistTRIDENTTHRUST,
                    RegistSHIELDBASH,
    }){
        this.emoji = emoji;
        this.MaxSpeed = Number(MaxSpeed);
        this.hp = Number(hp);
        this.mp = Number(mp);
        this.deffence = Number(deffence);
        this.mpregene = Number(mpregene);      
        this.attackMagic = attackMagic;
        this.attack = Number(attack);

        this.attackPierceCount = Number(attackPierceCount);
        this.HomingRadius = Number(HomingRadius);
        this.HomingPower = Number(HomingPower);
        this.AddLifeTime = Number(AddLifeTime);

        this.FireCnt1 = Number(FireCnt1);
        this.FireCnt2 = Number(FireCnt2);
        this.UseMP = Number(UseMP);
        this.AddMaxSpeed = Number(AddMaxSpeed);
        
        this.RegistFIREBALL = Number(RegistFIREBALL);
        this.RegistICE = Number(RegistICE);
        this.RegistLIGHTNING = Number(RegistLIGHTNING);
        this.RegistTORNADO = Number(RegistTORNADO);
        this.RegistMETEOR = Number(RegistMETEOR);       
        this.RegistEXPLOSION = Number(RegistEXPLOSION);
        this.RegistGUST = Number(RegistGUST);       
        this.RegistBUBBLE = Number(RegistBUBBLE);      
        this.RegistRAINBOW = Number(RegistRAINBOW);  
        this.RegistWEB = Number(RegistWEB);
        this.RegistPOISONSTING = Number(RegistPOISONSTING);
        this.RegistSWORDSLASH = Number(RegistSWORDSLASH);
        this.RegistGREATAxe = Number(RegistGREATAxe);
        this.RegistHAMMERCRUSH = Number(RegistHAMMERCRUSH);
        this.RegistTRIDENTTHRUST = Number(RegistTRIDENTTHRUST);
        this.RegistSHIELDBASH = Number(RegistSHIELDBASH);
    }
}


export class EnemyDataTable extends CharacterDataTable {
    static table = new Map();
    static get(id) { return this.table.get(id); }

    static async init(csvUrl = '/assets/magic.csv') {
        const rows = await loadCSV(csvUrl);          // [{id,emoji,useMP,…}, …]
        for (const row of rows) {
            this.table.set(row.id, new CharacterDataTable(row));
            //console.log(row.id,row);
        }
        enemyDataTable = this;
    }
}


export class WizardDataTable extends CharacterDataTable{
    static table = new Map();
    static get(id) { return this.table.get(id); }

    static async init(csvUrl = '/assets/magic.csv') {
        const rows = await loadCSV(csvUrl);          // [{id,emoji,useMP,…}, …]
        for (const row of rows) {
            this.table.set(row.id, new CharacterDataTable(row));
            //console.log(row.id,row);
        }
        wizardDataTable = this;
    }
}


export let enemyAIDataTable = null;

export class EnemyAIDataTable{
    static table = new Map();
    static get(id) { return this.table.get(id); }
    static async init(csvUrl = '/assets/magic.csv') {
        const rows = await loadCSV(csvUrl);          // [{id,emoji,useMP,…}, …]
        for (const row of rows) {
            this.table.set(row.id, new EnemyAIDataTable(row));
        }
        enemyAIDataTable = this;
    }
    constructor({ id ,detectionRadius,attackRange,attacknearRange,attackCooldown,coinDropCount,extraDropItem}){
        this.detectionRadius = detectionRadius;
        this.attackRange = attackRange;
        this.attacknearRange = attacknearRange;       
        this.attackCooldown = attackCooldown;
        this.coinDropCount = coinDropCount;
        this.extraDropItem = extraDropItem;
    }
}







/**
 * 使い方:
 *   await MapDataTable.init('/assets/map32x18.csv');
 *   const map = MapDataTable.getMap();   // ← [['🪨','🪨', …], …]
 */
export class MapDataTable {
    /** @type {string[][]} 読み込んだマップ（空文字は空地） */
    static map = [];

    /**
     * CSV からマップをロード（ヘッダー無し）
     * @param {string} csvUrl 例: '/assets/map32x18.csv'
     */
    static async init(csvUrl) {
        // header:false で “そのまま 2D 配列” を取得
        this.map = await loadCSV(csvUrl, { header:false });
    }

    /** 2D 配列をそのまま返す */
    static getMap() { return this.map; }
}

export class MapColorDataTable {
    /** @type {string[][]} 読み込んだマップ（空文字は空地） */
    static map = [];

    /**
     * CSV からマップをロード（ヘッダー無し）
     * @param {string} csvUrl 例: '/assets/map32x18.csv'
     */
    static async init(csvUrl) {
        // header:false で “そのまま 2D 配列” を取得
        this.map = await loadCSV(csvUrl, { header:false });
    }

    /** 2D 配列をそのまま返す */
    static getMap() { return this.map; }
}

export class EnemyPopDataTable {
    /** @type {string[][]} 読み込んだマップ（空文字は空地） */
    static map = [];

    /**
     * CSV からマップをロード（ヘッダー無し）
     * @param {string} csvUrl 例: '/assets/map32x18.csv'
     */
    static async init(csvUrl) {
        // header:false で “そのまま 2D 配列” を取得
        this.map = await loadCSV(csvUrl, { header:false });
    }

    /** 2D 配列をそのまま返す */
    static getMap() { return this.map; }
}
export class MapEventDataTable {
    /** @type {string[][]} 読み込んだマップ（空文字は空地） */
    static map = [];

    /**
     * CSV からマップをロード（ヘッダー無し）
     * @param {string} csvUrl 例: '/assets/map32x18.csv'
     */
    static async init(csvUrl) {
        // header:false で “そのまま 2D 配列” を取得
        this.map = await loadCSV(csvUrl, { header:false });
    }

    /** 2D 配列をそのまま返す */
    static getMap() { return this.map; }
}

export class ItemDropPopDataTable {
    /** @type {string[][]} 読み込んだマップ（空文字は空地） */
    static map = [];

    /**
     * CSV からマップをロード（ヘッダー無し）
     * @param {string} csvUrl 例: '/assets/map32x18.csv'
     */
    static async init(csvUrl) {
        // header:false で “そのまま 2D 配列” を取得
        this.map = await loadCSV(csvUrl, { header:false });
    }

    /** 2D 配列をそのまま返す */
    static getMap() { return this.map; }
}


export let eventTileDataTable = null;

export class EventTileDataTable{
    static table = new Map();
    static get(id) { return this.table.get(id); }
    static async init(csvUrl = '/assets/magic.csv') {
        const rows = await loadCSV(csvUrl);          // [{id,emoji,useMP,…}, …]
        for (const row of rows) {
            this.table.set(row.id, new EventTileDataTable(row));
        }
        eventTileDataTable = this;
    }
    constructor({ id ,emoji ,type,event,title}){
        this.emoji = emoji;
        this.type = type;
        this.event = event;
        this.title = title;
    }
}


export let eventDataTable = null;

export class EventDataTable{
    static table = new Map();
    static get(id) { return this.table.get(id); }
    static async init(csvUrl = '/assets/magic.csv') {
        const rows = await loadCSV2(csvUrl);          // [{id,emoji,useMP,…}, …]
        for (const row of rows) {
            this.table.set(row.id, new EventDataTable(row));
        }
        eventDataTable = this;
    }
    constructor({ id ,titleEmoji ,text,type,mode}){
        this.titleEmoji = titleEmoji;
        this.text = text;
        this.type = type;
        this.mode = mode;
    }
}