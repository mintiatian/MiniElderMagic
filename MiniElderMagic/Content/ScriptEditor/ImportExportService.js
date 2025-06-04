/* ============================================================
 *  EventDataTable → CSV エクスポート
 * ========================================================== */

import {EventDataTable} from "../Script/Utils/DataTable.js";

const CSV_HEADERS = ['id', 'titleEmoji', 'text', 'mode']; // 必要に応じて列を追加


function tidyJson(str){
    try {                // パース成功なら完全ミニファイ
        return JSON.stringify(JSON.parse(str));
    } catch {
        return str.replace(/\r?\n/g, '');  // 不正 JSON は改行だけ除去
    }
}


/**
 * EventDataTable.table を CSV 文字列に変換
 */
function buildEventCsv() {
    const rows = [];
    rows.push(CSV_HEADERS);          // ヘッダ行

    for (const [id, evt] of EventDataTable.table) {
        rows.push([id, evt.titleEmoji??'', tidyJson(evt.text??''), evt.mode??'']);
    }
    // Excel 読み取りを考慮し BOM 付き UTF-8
    const csv = rows
        .map(cols => cols
            .map(c => `"${String(c).replace(/"/g, '""')}"`)
            .join(','))
        .join('\r\n');
    return '\uFEFF' + csv;           // BOM 付与
}

/**
 * フォルダを選んで eventDataTable.csv を書き出す
 */
export async function saveEventCsvToFolder() {
    try {
        // ユーザーにフォルダ選択ダイアログを表示
        const dirHandle = await window.showDirectoryPicker({mode: 'readwrite'}); // Chrome86+
        const fileHandle = await dirHandle.getFileHandle('eventDataTable.csv', { create: true });

        // 書き込みストリームを取得
        const writable = await fileHandle.createWritable();              // 書き込み権限確認 :contentReference[oaicite:0]{index=0}
        await writable.write(buildEventCsv());
        await writable.close();

        alert('CSV を保存しました');
    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error(err);
            alert(`保存に失敗しました: ${err.message}`);
        }
    }
}
