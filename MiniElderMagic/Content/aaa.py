#!/usr/bin/env python3
"""
patch_wizard_mouse.py

Wizard.js の mouseMoveHandler を「ビューポート → ワールド座標補正付きバージョン」
に差し替えるワンショット・パッチスクリプト。

● 使い方
$ python patch_wizard_mouse.py

● 挙動
1. Script/Character/Wizard.js を読み込み
2. 旧 mouseMoveHandler ブロックを正規表現で検出
3. 新しいブロックに置換（ idempotent：既に新コードなら変更しない ）
4. Wizard.js.bak にバックアップを作成してから上書き保存
"""

import pathlib
import re
import shutil
import sys
import textwrap

# --------------------------------------------------------
#  1) ファイルパス設定
# --------------------------------------------------------
FILE_PATH   = pathlib.Path("Script/Character/Wizard.js")
BACKUP_PATH = FILE_PATH.with_suffix(".bak")

# --------------------------------------------------------
#  2) 新しい mouseMoveHandler 実装
#    （textwrap.dedent で先頭の余分なインデントを削除）
# --------------------------------------------------------
NEW_BLOCK = textwrap.dedent("""\
        /* ===== ビューポート → ワールド座標へ変換 ===== */
        this.mouseMoveHandler = (evt) => {
            // #game-area（＝this.element.parentElement）のスクリーン位置
            const containerRect = this.element.parentElement.getBoundingClientRect();

            // 補正後マウス座標（ワールド基準）
            const mouseXWorld = evt.clientX - containerRect.left;
            const mouseYWorld = evt.clientY - containerRect.top;

            const playerCenter = this.getPlayerCenter();   // こちらもワールド座標

            // マウス方向に向けて回転
            const dx = mouseXWorld - playerCenter.x;
            const dy = mouseYWorld - playerCenter.y;

            // 次フレーム用に保持
            this.mouseX = mouseXWorld;
            this.mouseY = mouseYWorld;

            this.radian = Math.atan2(dy, dx);
            this.setDir(this.radian);
            this.updateStaffPosition();
        };
""")

# --------------------------------------------------------
#  3) 旧ブロックを検出するための正規表現
#     - evt.clientX/evt.clientY を直接保持している実装をターゲット
# --------------------------------------------------------
OLD_BLOCK_REGEX = re.compile(
    r"""
        this\.mouseMoveHandler\s*=\s*\(evt\)\s*=>\s*\{\s*
        [\s\S]*?          # 任意文字（最小マッチ）
        const\s+playerCenter\s*=\s*this\.getPlayerCenter\(\);\s*
        [\s\S]*?
        this\.mouseY\s*=\s*evt\.clientY\s*;
        [\s\S]*?
        \};               # 閉じ波かっこ
    """,
    re.VERBOSE,
)

def main() -> None:
    if not FILE_PATH.exists():
        sys.exit(f"[ERROR] {FILE_PATH} が見つかりません。実行場所を確認してください。")

    src = FILE_PATH.read_text(encoding="utf-8")

    # すでに新ブロックが入っている場合は何もしない
    if NEW_BLOCK.strip() in src:
        print("[INFO] すでに新しい mouseMoveHandler が適用済みです。処理を終了します。")
        return

    # 旧ブロックを検索
    match = OLD_BLOCK_REGEX.search(src)
    if not match:
        sys.exit("[ERROR] 旧 mouseMoveHandler ブロックが見つかりません。手動でご確認ください。")

    # 置換
    patched_src = OLD_BLOCK_REGEX.sub(NEW_BLOCK, src, count=1)

    # バックアップを保存
    shutil.copy2(FILE_PATH, BACKUP_PATH)
    print(f"[INFO] バックアップを {BACKUP_PATH} に作成しました。")

    # ファイルを上書き
    FILE_PATH.write_text(patched_src, encoding="utf-8")
    print(f"[SUCCESS] {FILE_PATH} をパッチ適用しました。")

if __name__ == "__main__":
    main()
