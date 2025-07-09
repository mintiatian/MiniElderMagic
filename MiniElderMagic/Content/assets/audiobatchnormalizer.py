#!/usr/bin/env python3
"""AudioBatchOggNormalizer.py – Mini Elder Magic utility
--------------------------------------------------------
選択フォルダ以下の音声をすべて Ogg Vorbis（q4）へ変換しつつ
ffmpeg loudnorm でラウドネスをそろえ、無音をカットします。

• 依存 : ffmpeg (PATH に存在すること) / Python 3.8+
• 出力 : <選択フォルダ>/normalized_ogg/ に .ogg で書き出し
• UI  : Tkinter + ttk.Progressbar + scrolled text log
"""

import os
import subprocess
import threading
import shutil
from pathlib import Path
from tkinter import (
    Tk, filedialog, messagebox, scrolledtext,
    ttk, Button, END, StringVar, Label
)

# -------------------------------------------------- 設定 --------------------------------------------------
AUDIO_EXTS   = {'.wav', '.mp3', '.ogg', '.flac', '.m4a'}
TARGET_LUFS  = -16          # Integrated Loudness (LUFS)
VORBIS_QUAL  = '4'          # -qscale:a <n> で指定する品質 (0–10)
OUT_DIR_NAME = 'normalized_ogg'  # ★ 出力フォルダ名
# ---------------------------------------------------------------------------------------------------------


def find_ffmpeg() -> str | None:
    exe = 'ffmpeg.exe' if os.name == 'nt' else 'ffmpeg'
    return shutil.which(exe)


# ★ 変更: Vorbis 変換 + 前処理フィルタ
def transcode_cmd(inp: Path, out: Path, lufs: int = TARGET_LUFS) -> list[str]:
    return [
        'ffmpeg', '-y', '-hide_banner', '-loglevel', 'error',
        '-i', str(inp),
        # loudnorm → 無音トリム (末尾 0.3 s／-50 dB 未満をカット)
        '-af',
        f'loudnorm=I={lufs}:TP=-1.5:LRA=11,'
        'silenceremove=stop_periods=-1:stop_duration=0.3:stop_threshold=-50dB',
        # サンプルレート / チャンネル
        '-ar', '44100', '-ac', '1',
        # Vorbis エンコード
        '-c:a', 'libvorbis', '-qscale:a', VORBIS_QUAL,
        str(out)
    ]


class NormalizerGUI:
    def __init__(self):
        self.root = Tk()
        self.root.title('Audio Batch Ogg Normalizer')
        self.root.geometry('640x400')

        self.folder_var = StringVar()
        self.progress   = ttk.Progressbar(self.root, length=580, mode='determinate')
        self.log        = scrolledtext.ScrolledText(self.root, height=15, state='disabled')

        Button(self.root, text='フォルダ選択', command=self.select_folder).pack(pady=8)
        Label (self.root, textvariable=self.folder_var).pack()
        Button(self.root, text='変換開始',   command=self.start).pack(pady=8)
        self.progress.pack(pady=4)
        self.log.pack(fill='both', expand=True, padx=4, pady=4)

    # UI --------------------------------------------------------------------------------------------------

    def select_folder(self):
        path = filedialog.askdirectory(title='音声フォルダを選択')
        if path:
            self.folder_var.set(path)

    def start(self):
        in_dir = self.folder_var.get()
        if not in_dir:
            messagebox.showwarning('未選択', 'フォルダを選択してください')
            return
        if not find_ffmpeg():
            messagebox.showerror('ffmpeg 未検出', 'ffmpeg が PATH に見つかりません')
            return
        threading.Thread(target=self._worker, args=(Path(in_dir),), daemon=True).start()

    # バックグラウンド処理 ----------------------------------------------------------------------------------

    def _worker(self, in_dir: Path):
        audio_files = [p for p in in_dir.rglob('*') if p.suffix.lower() in AUDIO_EXTS]
        if not audio_files:
            self._log('対象ファイルが見つかりません')
            return

        out_dir = in_dir / OUT_DIR_NAME
        out_dir.mkdir(exist_ok=True)

        self.progress.config(maximum=len(audio_files), value=0)

        for idx, src in enumerate(audio_files, 1):
            dst = out_dir / src.with_suffix('.ogg').name
            self._log(f'[{idx}/{len(audio_files)}] {src.name} → {dst}')
            try:
                subprocess.run(transcode_cmd(src, dst), check=True)
            except subprocess.CalledProcessError as e:
                self._log(f'  失敗: {e}')
            self.progress['value'] = idx

        self._log('\n=== 完了 ===')
        messagebox.showinfo('完了', 'Ogg 変換が完了しました')

    # ログ出力 ---------------------------------------------------------------------------------------------

    def _log(self, msg: str):
        self.log.configure(state='normal')
        self.log.insert(END, msg + '\n')
        self.log.configure(state='disabled')
        self.log.yview(END)

    def run(self):
        self.root.mainloop()


if __name__ == '__main__':
    NormalizerGUI().run()
