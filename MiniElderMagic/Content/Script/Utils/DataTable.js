// data/MagicDataManager.js
import Papa from 'https://cdn.jsdelivr.net/npm/papaparse@5.4.1/+esm';



export let languageList = ['en', 'zh-Hans', 'es', 'fr', 'de', 'pt-BR', 'ko', 'ja', 'ru'];
export let language = "ja";

export function setLanguage(lang) {
    language = lang;
}

/**
 * ❷ 行（オブジェクト）から “その言語用の列” を取り出す汎用関数
 *     - ja 専用カラムがある場合 → baseKey (例: 'InfoText')
 *     - それ以外の言語       → langCode と同じ列名（例: 'fr', 'ko', …）
 *     - フォールバック        → 'en' → baseKey → ''
 *
 *    使い方:  pickLang(row, 'InfoText')
 */
export function pickLang(row, baseKey) {
    /* 1) 完全一致があればそれ */
    if (language === 'ja' && row[baseKey]) return row[baseKey];
    if (row[language])                    return row[language];

    /* 2) 英語にフォールバック */
    if (row.en) return row.en;

    /* 3) さらに最後の保険 */
    return row[baseKey] ?? '';
}

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


    constructor({ id, emoji, useMP, lifeTime, maxSpeed,damage,InfoText
                    ,en,'zh-Hans': zhHans, es, fr, de, 'pt-BR': ptBR, ko, ru}) {
        this.id        = id;       // SpellID など
        this.emoji     = emoji;
        this.useMP     = +useMP;   // 数値にキャスト
        this.lifeTime  = +lifeTime;
        this.maxSpeed  = +maxSpeed;
        this.damage = +damage;
        
        this.InfoText = pickLang(arguments[0], 'InfoText');
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
    constructor({ id ,emoji ,type,value,shopcost,drop,shop,filtertype,infotext
        ,en,'zh-Hans': zhHans, es, fr, de, 'pt-BR': ptBR, ko, ru}){
        this.emoji = emoji;
        this.type = type;
        this.value = value;
        this.shopcost = shopcost;
        this.drop = drop;
        this.shop = Number(shop);
        this.filtertype = filtertype;


        this.infotext = pickLang(arguments[0], 'infotext');
    }
}


export let enemyDataTable = null;
export let wizardDataTable = null;

export class CharacterDataTable {

    
    constructor({ id ,emoji ,MaxSpeed,hp,mp,mpregene,
                    deffence,
                    attackMagic,attack,
                    attackPierceCount,HomingRadius,HomingPower,AddLifeTime,
                    FireCnt1,UseMP,AddMaxSpeed,
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
    static emojiToId  = new Map();
    static get(id) { return this.table.get(id); }
    static getIdByEmoji(emoji) {
        return this.emojiToId.get(emoji) ?? null;
    }
    static async init(csvUrl = '/assets/magic.csv') {
        const rows = await loadCSV(csvUrl);          // [{id,emoji,useMP,…}, …]
        for (const row of rows) {
            this.table.set(row.id, new CharacterDataTable(row));
            this.emojiToId.set(row.emoji, row.id); // 逆引き
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
    constructor({ id ,emoji,detectionRadius,attackRange,attacknearRange,attackCooldown,coinDropCount,

                    BARRIER_HP_THRESHOLD,
                    BARRIER_PROBABILITY,
                    BARRIER_DURATION_MS,
                    MODE_ORBIT_PROB,
                    MODE_TIMER_MIN_MS,
                    MODE_TIMER_MAX_MS,
                    APPROACH_ANGLE_JITTER,
                    APPROACH_ACCEL,
                    RETREAT_ACCEL,
                    ORBIT_RADIUS,
                    ORBIT_DIFF_THRESHOLD,
                    ORBIT_CORRECT_ACCEL,
                    EXIT_DISTANCE_LIMIT}){
        this.detectionRadius = parseFloat(detectionRadius);
        this.attackRange = parseFloat(attackRange);
        this.attacknearRange = parseFloat(attacknearRange);    
        this.attackCooldown = parseFloat(attackCooldown);
        this.coinDropCount = parseInt(coinDropCount);


        this.BARRIER_HP_THRESHOLD = parseFloat( BARRIER_HP_THRESHOLD);
        this.BARRIER_PROBABILITY = parseFloat(BARRIER_PROBABILITY);
        this.BARRIER_DURATION_MS = parseFloat(BARRIER_DURATION_MS);      
        this.MODE_ORBIT_PROB = parseFloat(MODE_ORBIT_PROB);      
        this.MODE_TIMER_MIN_MS = parseFloat(MODE_TIMER_MIN_MS);      
        this.MODE_TIMER_MAX_MS = parseFloat(MODE_TIMER_MAX_MS);      
        this.APPROACH_ANGLE_JITTER = parseFloat(APPROACH_ANGLE_JITTER);      
        this.APPROACH_ACCEL = parseFloat(APPROACH_ACCEL);      
        this.RETREAT_ACCEL = parseFloat(RETREAT_ACCEL);     
        this.ORBIT_RADIUS = parseFloat(ORBIT_RADIUS);
        this.ORBIT_DIFF_THRESHOLD = parseFloat(ORBIT_DIFF_THRESHOLD);  
        this.ORBIT_CORRECT_ACCEL = parseFloat(ORBIT_CORRECT_ACCEL); 
        this.EXIT_DISTANCE_LIMIT = parseFloat(EXIT_DISTANCE_LIMIT);
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
    constructor({ id ,titleEmoji ,text,type,mode,value
        ,en,'zh-Hans': zhHans, es, fr, de, 'pt-BR': ptBR, ko, ru}){
        this.titleEmoji = titleEmoji;
        this.text = text;
        this.type = type;
        this.mode = mode;
        this.value = parseFloat(value);


    this.text = pickLang(arguments[0], 'text');
    }
}



export let textDataTable = null;

export class TextDataTable {
    static table = new Map();

    static get(id) { return this.table.get(id); }

    static async init(csvUrl = '/assets/magic.csv') {
        const rows = await loadCSV(csvUrl);          // [{id,emoji,useMP,…}, …]
        for (const row of rows) {
            this.table.set(row.id, new TextDataTable(row));

            //console.log(row.id,row);
        }
        textDataTable = this;
    }


    constructor({ id, text
                    ,en,'zh-Hans': zhHans, es, fr, de, 'pt-BR': ptBR, ko, ru}){
        this.id        = id;       // SpellID など


        this.text = pickLang(arguments[0], 'text');
    }
}