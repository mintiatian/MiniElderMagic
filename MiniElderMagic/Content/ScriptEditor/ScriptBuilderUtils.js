/* ------------------------------------------------------------------
 *  ScriptBuilderUtils.js – v1.0 (full implementation)
 *  共通ユーティリティ＋定数定義
 * ------------------------------------------------------------------ */

/**
 * Shorthand for `document.querySelector`.
 * @param {string} sel
 * @returns {HTMLElement|null}
 */
export const $ = sel => document.querySelector(sel);

/**
 * コマンドごとの入力フィールド定義。
 * View 側でこの情報を使って動的にフォームを構築します。
 */
export const FIELD_DEFS = {
    page: [
        { key: "pageId", label: "pageId", required: false },
        { key: "text",   label: "text",   type: "textarea" }
    ],
    dialog: [
        { key: "dialogMode", label: "dialogMode", placeholder: "yesno / ok" }
    ],
    answer: [
        { key: "answerValue", label: "answerValue" }
    ],
    condition: [
        { key: "checkItem",     label: "checkItem" },
        { key: "requiredCount", label: "requiredCount", type: "number" },
        { key: "successPage",   label: "successPage" },
        { key: "failurePage",   label: "failurePage" }
    ],
    jump: [
        { key: "targetPage", label: "targetPage" }
    ],
    changeItemCount: [
        { key: "item",  label: "item" },
        { key: "delta", label: "delta", type: "number" }
    ],
    exit: [
        { key: "pageId", label: "pageId" }
    ]
};

/**
 * `<select>` を生成する小ヘルパ。
 * @param {string[]} values – option 値 / 表示テキスト
 * @param {string=}  current – デフォルト選択値
 * @returns {HTMLSelectElement}
 */
export function createSelect(values, current) {
    const sel = document.createElement("select");
    values.forEach(v => {
        const opt = document.createElement("option");
        opt.value = v;
        opt.textContent = v;
        sel.append(opt);
    });
    sel.value = current ?? values[0];
    return sel;
}

/* ── items で使う絵文字一覧 ───────────────── */
export const ITEM_OPTIONS = [
    '🍄','🍞','🍗','🍎','🧀','🥛','🥘','🧿','🔮','🌟','🕯️','💎','📿','🏺',
    '🗝️','🪣','🧵','🪶','📜','🖋️','💍','⌚','💀'
];