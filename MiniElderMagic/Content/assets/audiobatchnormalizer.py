#!/usr/bin/env python3
"""AudioBatchNormalizer.py – Mini Elder Magic utility
-----------------------------------------------------
GUI ツールでフォルダを選択し、含まれる WAV/MP3/OGG ファイルを
ffmpeg の loudnorm フィルタで一括ラウドネス正規化します。

• 依存: ffmpeg (PATH に存在すること) / Python 3.8+
• 出力: <選択フォルダ>/normalized/ へ同名ファイルを書き出し
• UI : Tkinter + ttk.Progressbar + scrolled text log

Copyright © 2025 Tatsuo Miyoshi
"""

import os
import sys
import subprocess
import threading
from pathlib import Path
from tkinter import Tk, filedialog, messagebox, scrolledtext, ttk, Button, END, StringVar, Label
import shutil

AUDIO_EXTS = {'.wav', '.mp3', '.ogg', '.flac', '.m4a'}
TARGET_LUFS = -16  # 目標ラウドネス (LUFS)


def find_ffmpeg() -> str | None:
    """ffmpeg 実行ファイルのパスを返す (見つからなければ None)"""
    exe = 'ffmpeg.exe' if os.name == 'nt' else 'ffmpeg'
    return shutil.which(exe)


def loudnorm_cmd(input_path: Path, output_path: Path, lufs: int = TARGET_LUFS) -> list[str]:
    """ffmpeg loudnorm コマンドラインを生成"""
    return [
        'ffmpeg', '-y', '-hide_banner', '-loglevel', 'error',
        '-i', str(input_path),
        '-af', f'loudnorm=I={lufs}:TP=-1.5:LRA=11',
        '-ar', '48000',  # resample for consistency
        str(output_path)
    ]


class NormalizerGUI:
    def __init__(self):
        self.root = Tk()
        self.root.title('Audio Batch Normalizer')
        self.root.geometry('640x400')

        self.folder_var = StringVar()
        self.progress = ttk.Progressbar(self.root, length=580, mode='determinate')
        self.log = scrolledtext.ScrolledText(self.root, height=15, state='disabled')

        Button(self.root, text='フォルダ選択', command=self.select_folder).pack(pady=8)
        Label(self.root, textvariable=self.folder_var).pack()
        Button(self.root, text='正規化開始', command=self.start_normalize).pack(pady=8)
        self.progress.pack(pady=4)
        self.log.pack(fill='both', expand=True, padx=4, pady=4)

    def select_folder(self):
        path = filedialog.askdirectory(title='音声フォルダを選択')
        if path:
            self.folder_var.set(path)

    def start_normalize(self):
        folder = self.folder_var.get()
        if not folder:
            messagebox.showwarning('未選択', 'フォルダを選択してください')
            return
        ffmpeg_path = find_ffmpeg()
        if not ffmpeg_path:
            messagebox.showerror('ffmpeg 未検出', 'ffmpeg が PATH に見つかりません')
            return
        threading.Thread(target=self._normalize_thread, args=(Path(folder),), daemon=True).start()

    def _normalize_thread(self, in_dir: Path):
        audio_files = [p for p in in_dir.rglob('*') if p.suffix.lower() in AUDIO_EXTS]
        if not audio_files:
            self._log('対象ファイルが見つかりません')
            return

        out_dir = in_dir / 'normalized'
        out_dir.mkdir(exist_ok=True)
        self.progress['maximum'] = len(audio_files)
        self.progress['value'] = 0

        for idx, src in enumerate(audio_files, 1):
            dst = out_dir / src.with_suffix('.wav').name  # すべて WAV で出力
            cmd = loudnorm_cmd(src, dst)
            self._log(f'[{idx}/{len(audio_files)}] {src.name} → {dst.name}')
            try:
                subprocess.run(cmd, check=True)
            except subprocess.CalledProcessError as e:
                self._log(f'  失敗: {e}')
            self.progress['value'] = idx

        self._log('\n=== 完了 ===')
        messagebox.showinfo('完了', '正規化が完了しました')

    def _log(self, text: str):
        self.log.configure(state='normal')
        self.log.insert(END, text + '\n')
        self.log.configure(state='disabled')
        self.log.yview(END)

    def run(self):
        self.root.mainloop()


if __name__ == '__main__':
    NormalizerGUI().run()
