#!/usr/bin/env python3
"""csv_downloader_gui.py – Bulk‑download Google Sheets as CSV
----------------------------------------------------------------
GUI utility that downloads a fixed set of CSV exports from Google
Sheets and saves them into a user‑selected folder using predefined
filenames (e.g. magic.csv, item.csv …).

Dependencies
------------
• Python 3.8+
• requests  (pip install requests)

Usage
-----
Run the script, click [Browse…] to choose a destination folder, then
press [Download CSVs]. A log pane shows progress and errors.
"""

import os
import threading
import tkinter as tk
from tkinter import filedialog, messagebox, scrolledtext

try:
    import requests
except ImportError as exc:  # graceful fallback with a clear message
    raise SystemExit("The 'requests' package is required.\n$ pip install requests") from exc

# ------------------------------------------------------------------
# Google Sheets CSV export URLs mapped to desired local filenames
# ------------------------------------------------------------------
URLS = {
    "magic": "https://docs.google.com/spreadsheets/d/14KPqmm0KQ-wlcgV-WMGqlqIwCCoz94hI8InyBMPmJdA/export?format=csv",
    "item": "https://docs.google.com/spreadsheets/d/174mPJFw8fMOP5DAzL70FcuW549VnZK6FeVDcCkvfYfU/export?format=csv",
    "enemy": "https://docs.google.com/spreadsheets/d/1v_q-56Nb_CtzkIZBThYEuBWScLzRIBaiQlI5mtugv9w/export?format=csv",
    "wizard": "https://docs.google.com/spreadsheets/d/1CRTX72AUu4QXko0QUUq6X7LaNLxfy0YausEIx9zFBJA/export?format=csv",
    "enemyai": "https://docs.google.com/spreadsheets/d/16F7ksDu0R-01dE1ik7vZOADMWYiyqbCecUDhTVzOO5c/export?format=csv",
    "mapChip": "https://docs.google.com/spreadsheets/d/178l4JKlUGkUFAUFfU6Dt0yAyUwkOeCNQLc5tkn2BUSg/export?format=csv",
    "mapColor": "https://docs.google.com/spreadsheets/d/1fa4ZvsC3VE6mrOywsCM2H_3H8dGRoskF0LHAEz8-_VY/export?format=csv",
    "mapEnemyPop": "https://docs.google.com/spreadsheets/d/1tKr0LiD74U8PhFlnU6alooSWucwTK0qY6xmm6PnZ6Zc/export?format=csv",
    "mapEvent": "https://docs.google.com/spreadsheets/d/1O08oReBUjC22NyOL-902NcZaZdeGtxj3FNRsBYbkDCY/export?format=csv",
    "mapDropPopItem": "https://docs.google.com/spreadsheets/d/1vrdjApsk2xD-IaNrskusJPwARl7x0KazGLBTy7LTV3o/export?format=csv",
    "eventTile": "https://docs.google.com/spreadsheets/d/1knfjOwpXSkw6HYBdZn7Ugkk73sc88cPSsGLuv1EeMx8/export?format=csv",
    "event": "https://docs.google.com/spreadsheets/d/1Yz0RJs4WuimcoH2Af6c1JclQL46bgGOGj1QUqAnfXPc/export?format=csv",
    "text": "https://docs.google.com/spreadsheets/d/1GzKK2-oFpGMc3kr1TYE6U-7_DeLjDN81zdQUGumimxo/export?format=csv",
}

# ------------------------------------------------------------------
# GUI application                                                   
# ------------------------------------------------------------------
class CSVDownloaderApp:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("Google Sheets → CSV Downloader")
        self.folder_var = tk.StringVar()

        # ---------- Layout ----------------------------------------
        frame = tk.Frame(root, padx=12, pady=12)
        frame.pack(fill="both", expand=True)

        tk.Label(frame, text="Save folder:").grid(row=0, column=0, sticky="w")
        entry = tk.Entry(frame, textvariable=self.folder_var, width=48)
        entry.grid(row=0, column=1, sticky="we")
        tk.Button(frame, text="Browse…", command=self.select_folder).grid(row=0, column=2, padx=5)

        tk.Button(frame, text="Download CSVs", command=self.start_download).grid(row=1, column=0, columnspan=3, pady=8)

        self.log = scrolledtext.ScrolledText(frame, height=12, state="disabled", wrap="none")
        self.log.grid(row=2, column=0, columnspan=3, sticky="nsew")

        # Responsive resizing
        frame.columnconfigure(1, weight=1)
        frame.rowconfigure(2, weight=1)

    # ---------- Folder selection ---------------------------------
    def select_folder(self):
        path = filedialog.askdirectory()
        if path:
            self.folder_var.set(path)

    # ---------- Download orchestration ---------------------------
    def start_download(self):
        folder = self.folder_var.get()
        if not folder:
            messagebox.showwarning("Select folder", "Please choose a destination folder first.")
            return
        # Run in background thread to keep UI responsive
        threading.Thread(target=self.download_all, args=(folder,), daemon=True).start()

    def download_all(self, folder: str):
        self.log_msg(f"Starting download → {folder}\n")
        os.makedirs(folder, exist_ok=True)
        session = requests.Session()
        for name, url in URLS.items():
            filename = f"{name}.csv"
            filepath = os.path.join(folder, filename)
            try:
                resp = session.get(url, timeout=30)
                resp.raise_for_status()
                with open(filepath, "wb") as f:
                    f.write(resp.content)
                self.log_msg(f"✔ saved {filename}\n")
            except Exception as e:
                self.log_msg(f"✖ failed {filename}: {e}\n")
        self.log_msg("Done.\n")

    # ---------- Logging helper -----------------------------------
    def log_msg(self, msg: str):
        self.log.configure(state="normal")
        self.log.insert("end", msg)
        self.log.see("end")
        self.log.configure(state="disabled")

# ------------------------------------------------------------------
# Entrypoint                                                        
# ------------------------------------------------------------------
if __name__ == "__main__":
    root = tk.Tk()
    app = CSVDownloaderApp(root)
    root.mainloop()
