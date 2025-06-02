#!/usr/bin/env python3
"""
Google スプレッドシート ↔ CSV の DL / UL GUI ツール

依存:
    pip install requests gspread google-auth

実行:
    python download_and_update_sheets_gui.py
"""

from __future__ import annotations
import csv
import threading
from pathlib import Path
import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext

import requests
import gspread
from google.oauth2.service_account import Credentials

# --- 設定 -------------------------------------------------------------------

URLS = {
#    "magic":      "https://docs.google.com/spreadsheets/d/14KPqmm0KQ-wlcgV-WMGqlqIwCCoz94hI8InyBMPmJdA/export?format=csv",
#    "item":       "https://docs.google.com/spreadsheets/d/174mPJFw8fMOP5DAzL70FcuW549VnZK6FeVDcCkvfYfU/export?format=csv",
#    "enemy":      "https://docs.google.com/spreadsheets/d/1v_q-56Nb_CtzkIZBThYEuBWScLzRIBaiQlI5mtugv9w/export?format=csv",
#    "wizard":     "https://docs.google.com/spreadsheets/d/1CRTX72AUu4QXko0QUUq6X7LaNLxfy0YausEIx9zFBJA/export?format=csv",
#    "enemyai":    "https://docs.google.com/spreadsheets/d/16F7ksDu0R-01dE1ik7vZOADMWYiyqbCecUDhTVzOO5c/export?format=csv",
    "mapChip":    "https://docs.google.com/spreadsheets/d/178l4JKlUGkUFAUFfU6Dt0yAyUwkOeCNQLc5tkn2BUSg/export?format=csv",
    "mapColor":   "https://docs.google.com/spreadsheets/d/1fa4ZvsC3VE6mrOywsCM2H_3H8dGRoskF0LHAEz8-_VY/export?format=csv",
    "mapEnemyPop":"https://docs.google.com/spreadsheets/d/1tKr0LiD74U8PhFlnU6alooSWucwTK0qY6xmm6PnZ6Zc/export?format=csv",
#    "eventTile":  "https://docs.google.com/spreadsheets/d/1knfjOwpXSkw6HYBdZn7Ugkk73sc88cPSsGLuv1EeMx8/export?format=csv",
}

SPREADSHEET_IDS = {
    key: url.split("/d/")[1].split("/")[0] for key, url in URLS.items()
}

DOWNLOAD_DIR = Path("downloads")
SCOPES = ("https://www.googleapis.com/auth/spreadsheets",)

# ---------------------------------------------------------------------------


class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("CSV ダウンロード / アップロード ツール")
        self.geometry("680x540")
        self.resizable(False, False)

        self._build_download_frame()
        self._build_upload_frame()
        self._build_log_frame()

        DOWNLOAD_DIR.mkdir(exist_ok=True, parents=True)
        self._log(f"保存先フォルダ: {DOWNLOAD_DIR.resolve()}")

    # -----------------------------------------------------------------------
    #  UI 構築
    # -----------------------------------------------------------------------
    def _build_download_frame(self):
        frame = ttk.LabelFrame(self, text="1. Google スプレッドシート → CSV をダウンロード")
        frame.pack(fill="x", padx=10, pady=6)

        ttk.Label(frame, text="保存先:").grid(row=0, column=0, sticky="w")
        self.out_var = tk.StringVar(value=str(DOWNLOAD_DIR))
        ttk.Entry(frame, textvariable=self.out_var, width=50).grid(row=0, column=1, padx=4, pady=4)
        ttk.Button(frame, text="参照…", command=self._browse_out).grid(row=0, column=2, padx=4)
        ttk.Button(frame, text="すべてダウンロード", command=self._download_all).grid(row=1, column=1, pady=6)

    def _build_upload_frame(self):
        frame = ttk.LabelFrame(self, text="2. ローカル CSV → Google スプレッドシートへアップロード")
        frame.pack(fill="x", padx=10, pady=6)

        ttk.Label(frame, text="シートキーを選択:").grid(row=0, column=0, sticky="nw")
        self.listbox = tk.Listbox(frame, height=10, exportselection=False)
        for key in URLS.keys():
            self.listbox.insert("end", key)
        self.listbox.grid(row=0, column=1, rowspan=4, sticky="nsew", padx=4, pady=4)

        ttk.Label(frame, text="サービスアカウント JSON:").grid(row=0, column=2, sticky="w")
        self.creds_var = tk.StringVar()
        ttk.Entry(frame, textvariable=self.creds_var, width=30).grid(row=0, column=3, padx=4)
        ttk.Button(frame, text="参照…", command=self._browse_creds).grid(row=0, column=4, padx=4)

        ttk.Label(frame, text="ワークシート番号:").grid(row=1, column=2, sticky="w")
        self.ws_var = tk.StringVar(value="0")
        ttk.Entry(frame, textvariable=self.ws_var, width=6).grid(row=1, column=3, sticky="w", padx=4)

        ttk.Button(frame, text="アップロード", command=self._upload_selected).grid(row=2, column=3, pady=6)

    def _build_log_frame(self):
        frame = ttk.LabelFrame(self, text="ログ")
        frame.pack(fill="both", expand=True, padx=10, pady=6)
        self.log_widget = scrolledtext.ScrolledText(frame, state="disabled", height=10, font=("Consolas", 9))
        self.log_widget.pack(fill="both", expand=True)

    # -----------------------------------------------------------------------
    #  各種コールバック
    # -----------------------------------------------------------------------
    def _browse_out(self):
        path = filedialog.askdirectory(initialdir=self.out_var.get())
        if path:
            self.out_var.set(path)

    def _browse_creds(self):
        path = filedialog.askopenfilename(
            title="サービスアカウント JSON を選択",
            filetypes=[("JSON files", "*.json"), ("すべてのファイル", "*.*")]
        )
        if path:
            self.creds_var.set(path)

    # ------------------------------ ダウンロード -----------------------------

    def _download_all(self):
        dest = Path(self.out_var.get())
        dest.mkdir(exist_ok=True, parents=True)
        threading.Thread(target=self._dl_worker, args=(dest,), daemon=True).start()

    def _dl_worker(self, dest: Path):
        self._log("=== ダウンロード開始 ===")
        for name, url in URLS.items():
            try:
                self._log(f"{name}.csv を取得中 …")
                r = requests.get(url)
                r.raise_for_status()
                out_file = dest / f"{name}.csv"
                out_file.write_bytes(r.content)
                self._log(f"✔ {out_file.name} 保存完了")
            except Exception as e:
                self._log(f"✖ {name}: {e}")
        self._log("=== ダウンロード終了 ===")

    # ------------------------------ アップロード -----------------------------

    def _upload_selected(self):
        sel = self.listbox.curselection()
        if not sel:
            messagebox.showwarning("未選択", "アップロードするシートキーを選択してください。")
            return

        key = self.listbox.get(sel[0])
        creds_path = Path(self.creds_var.get())
        if not creds_path.is_file():
            messagebox.showerror("資格情報エラー", "有効なサービスアカウント JSON を選択してください。")
            return

        try:
            sheet_index = int(self.ws_var.get())
        except ValueError:
            messagebox.showerror("番号エラー", "ワークシート番号は整数で入力してください。")
            return

        csv_file = Path(self.out_var.get()) / f"{key}.csv"
        if not csv_file.exists():
            messagebox.showerror("ファイル未検出", f"{csv_file} が見つかりません。\nまずダウンロードしてください。")
            return

        threading.Thread(
            target=self._upload_worker,
            args=(key, creds_path, csv_file, sheet_index),
            daemon=True
        ).start()

    def _upload_worker(self, key: str, creds_path: Path, csv_file: Path, ws_index: int):
        self._log(f"=== アップロード開始: {csv_file.name} → {key} ===")
        try:
            gc = self._authorize(creds_path)
            spreadsheet_id = SPREADSHEET_IDS[key]
            sh = gc.open_by_key(spreadsheet_id)
            ws = sh.get_worksheet(ws_index)
            self._log(f"'{sh.title}' シート '{ws.title}' にアップロード中 …")

            with csv_file.open(newline="", encoding="utf-8") as f:
                data = list(csv.reader(f))

            ws.clear()
            ws.update("A1", data, value_input_option="RAW")
            self._log("✔ アップロード完了")
        except Exception as e:
            self._log(f"✖ アップロード失敗: {e}")
        self._log("=== アップロード処理終了 ===")

    # ---------------------------- util & auth ------------------------------

    def _log(self, msg: str):
        self.log_widget.config(state="normal")
        self.log_widget.insert("end", msg + "\n")
        self.log_widget.yview_moveto(1.0)
        self.log_widget.config(state="disabled")

    def _authorize(self, creds_json: Path):
        creds = Credentials.from_service_account_file(creds_json, scopes=SCOPES)
        return gspread.authorize(creds)


# ---------------------------------------------------------------------------

if __name__ == "__main__":
    App().mainloop()
