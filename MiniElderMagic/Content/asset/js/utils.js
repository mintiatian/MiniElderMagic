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


export function padGrid(grid, minRows, minCols) {
    const rows = Math.max(grid.length,        minRows);
    const cols = Math.max(grid[0]?.length||0, minCols);

    // 行を追加
    while (grid.length < rows) grid.push(Array(cols).fill(""));

    // 列を追加／既存行も右側を埋める
    for (const row of grid) {
        while (row.length < cols) row.push("");
    }
    return { grid, rows, cols };
}