#!/usr/bin/env python3
"""
list_files.py

指定ディレクトリ以下のすべてのファイルを列挙し、
サブフォルダも含む相対パスの一覧を text に保存するスクリプト。
使い方:
    python list_files.py <folder_path> [-o OUTPUT] [-a]
引数:
    <folder_path> : 走査対象のフォルダ
オプション:
    -o, --output  : 出力するテキストファイル名（既定: file_list.txt）
    -a, --absolute: すべて絶対パスで書き出す（既定はフォルダからの相対パス）
"""
import argparse
import os
from pathlib import Path

def main():
    parser = argparse.ArgumentParser(description="フォルダ内ファイル一覧をテキスト出力")
    parser.add_argument("folder", type=Path, help="走査するフォルダパス")
    parser.add_argument("-o", "--output", type=Path, default=Path("file_list.txt"),
                        help="出力テキストファイル")
    parser.add_argument("-a", "--absolute", action="store_true",
                        help="絶対パスで書き出す")
    args = parser.parse_args()

    root = args.folder.resolve()
    if not root.is_dir():
        parser.error(f"{root} はフォルダではありません")

    # ファイルパスを収集
    paths = []
    for path in root.rglob("*"):
        if path.is_file():
            paths.append(path if args.absolute else path.relative_to(root))

    # ソートして書き出し
    paths.sort()
    with args.output.open("w", encoding="utf-8") as f:
        for p in paths:
            f.write(f"{p}\n")

    print(f"✅ {len(paths)} 件のファイルを {args.output} に書き出しました")

if __name__ == "__main__":
    main()
