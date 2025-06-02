/* -------------------------------------------------
 *  汎用ユーティリティ
 * ------------------------------------------------- */
export const isColor = v => typeof v === "string" && v.startsWith("#");

export function randomEmoji(selected) {
    return selected[Math.floor(Math.random() * selected.length)] || "";
}

export function parseCSV(text) {
    return text.trim().split(/\r?\n/).map(row => row.split(","));
}

export function cloneGrid(grid) {
    return grid.map(r => r.slice());
}
