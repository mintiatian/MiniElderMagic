/* ------------------------------------------------------------------
 *  ScriptBuilder.js  –  v3.2  (condition multi‑items support)
 * ------------------------------------------------------------------ */

import {$, FIELD_DEFS, createSelect} from './ScriptBuilderUtils.js';

(() => {
    /* ──────────────────────────────────────────
     *  メインクラス
     * ──────────────────────────────────────── */
    class ScriptBuilder {
        constructor() {
            /* ---- DOM 取得 ---- */
            this.cmdTypeEl = $('#cmdType');
            this.fieldZone = $('#fieldZone');
            this.actionBtn = $('#actionBtn');
            this.deleteBtn = $('#deleteBtn');        // ★追加
            this.listEl = $('#cmdList');
            this.detailZone = $('#detailZone');
            this.outputEl = $('#output');
            this.suggestListEl = $('#suggestList');
            this.importBtn = $('#importBtn');

            /* ---- 状態 ---- */
            this.commands = [];
            this.editingIndex = null;
            this.autoPageSerial = 1;

            /* ---- イベント登録 ---- */
            this._bindEvents();
            this._renderFields();
            this._renderSuggestions();
        }

        /* --------------------------------------------------
         *  ↑↓ 移動: dir = -1 (↑) / +1 (↓)
         * -------------------------------------------------- */
        _moveSelection(dir) {
            if (!this.commands.length) return; // nothing

            if (this.editingIndex == null) {
                const idx = dir < 0 ? 0 : this.commands.length - 1;
                this._startEdit(idx);
                return;
            }

            let idx = this.editingIndex + dir;
            if (idx < 0 || idx >= this.commands.length) return;
            this._startEdit(idx);

            const li = this.listEl.children[idx];
            if (li) li.scrollIntoView({block: 'nearest'});
        }


        /* --------------------------------------------------
     *  削除
     * -------------------------------------------------- */
        _handleDelete() {
            if (this.editingIndex == null) return;
            if (!confirm('このノードを削除しますか？')) return;

            this.commands.splice(this.editingIndex, 1);
            this._resetEditMode();
            this._renderList();
            this._renderSuggestions();
        }


        /*
         * =========================================================
         *  ヘルパ
         * ======================================================= */
        _resetEditMode() {
            this.editingIndex = null;
            this.actionBtn.textContent = 'Add';
            this.deleteBtn.disabled = true;     // ★追加
        }

        _clearForm() {
            this.fieldZone.querySelectorAll('input,textarea')
                .forEach(el => (el.value = ''));
        }

        /*
         * =========================================================
         *  イベント
         * ======================================================= */
        _bindEvents() {
            /* コマンド種別変更 */
            this.cmdTypeEl.addEventListener('change', () => {
                this._renderFields();
                this._resetEditMode();
            });

            /* 追加 / 更新 */
            this.actionBtn.addEventListener('click', () => this._handleAddOrUpdate());
            this.deleteBtn.addEventListener('click', () => this._handleDelete());

            /* Export */
            $('#exportBtn').addEventListener('click', () => {
                const payload = {
                    commands: this.commands,
                    labelTable: this._buildLabelTable(),
                    entryPage: this._getFirstPageId()
                };
                this.outputEl.value = JSON.stringify(payload, null, 2);
            });

            /* Import JSON  (textarea) */
            this.importBtn.addEventListener('click', () => this._importJson(this.outputEl.value));

            /* ▲▼ キーで選択ノード移動 */
            window.addEventListener('keydown', e => {
                if (['ArrowUp', 'ArrowDown'].includes(e.key)) {
                    if (document.activeElement.tagName.match(/^(INPUT|TEXTAREA)$/)) return; // ignore if typing
                    e.preventDefault();
                    const dir = e.key === 'ArrowUp' ? -1 : +1;
                    this._moveSelection(dir);
                }
            });
        }

        /*
         * =========================================================
         *  フィールド描画
         * ======================================================= */
        _renderFields(values = {}) {
            this.fieldZone.innerHTML = '';
            const defs = FIELD_DEFS[this.cmdTypeEl.value];

            if (this.cmdTypeEl.value === 'jump') this._buildPageIdDatalist();

            defs.forEach(def => {
                const wrap = document.createElement('div');
                wrap.className = 'field';

                const label = document.createElement('span');
                label.textContent = def.label;

                let el;
                if (this.cmdTypeEl.value === 'jump' && def.key === 'targetPage') {
                    el = document.createElement('input');
                    el.setAttribute('list', 'pageIds');
                } else if (this.cmdTypeEl.value === 'dialog' && def.key === 'dialogMode') {
                    el = createSelect(['yesno', 'ok'], values[def.key]);
                } else {
                    el = def.type === 'textarea'
                        ? document.createElement('textarea')
                        : document.createElement('input');
                    if (def.type && def.type !== 'textarea') el.type = def.type;
                }

                if (def.placeholder) el.placeholder = def.placeholder;
                el.id = def.key;
                el.value = values[def.key] ?? '';

                wrap.append(label, el);
                this.fieldZone.append(wrap);
            });

            /* -------- condition 用: items(JSON) 追加 -------- */
            if (this.cmdTypeEl.value === 'condition') {
                const wrap = document.createElement('div');
                wrap.className = 'field';

                const label = document.createElement('span');
                label.textContent = 'items(JSON)';

                const el = document.createElement('textarea');
                el.id = 'items';
                el.placeholder = '[{"item":"🍄","count":5},{"item":"🗺️","count":1}]';
                if (values.items) {
                    // pretty compact – no spaces
                    el.value = JSON.stringify(values.items);
                }

                wrap.append(label, el);
                this.fieldZone.append(wrap);
            }
        }

        /*
         * =========================================================
         *  追加 / 更新
         * ======================================================= */
        _handleAddOrUpdate() {
            const type = this.cmdTypeEl.value;
            const defs = FIELD_DEFS[type];

            const obj = {operation: type};
            let valid = true;

            /* 標準フィールド取得 */
            defs.forEach(def => {
                const raw = $(`#${def.key}`).value.trim();
                const val = def.type === 'number' ? Number(raw) : raw;

                /* 自動 pageId */
                if (type === 'page' && def.key === 'pageId' && val === '') {
                    obj.pageId = `page${this.autoPageSerial++}`;
                    $(`#${def.key}`).value = obj.pageId;
                } else {
                    obj[def.key] = val;
                }

                /* 必須チェック (condition の checkItem / requiredCount は items[] がある時は免除) */
                if (def.required !== false && (val === '' || val === undefined)) {
                    if (!(type === 'condition' && ['checkItem', 'requiredCount'].includes(def.key))) {
                        valid = false;
                    }
                }
            });

            /* ----- condition: items(JSON) 解析 ----- */
            if (type === 'condition') {
                const itemsRaw = $('#items')?.value.trim();
                if (itemsRaw) {
                    try {
                        obj.items = JSON.parse(itemsRaw);
                    } catch (e) {
                        alert('items(JSON) の形式が正しくありません');
                        return;
                    }
                    if (!Array.isArray(obj.items) || obj.items.length === 0) {
                        alert('items(JSON) が空です');
                        return;
                    }
                    // items を使う場合は旧単一フィールドを除去し、必須チェックも合格扱い
                    delete obj.checkItem;
                    delete obj.requiredCount;
                    valid = true;
                }
            }

            if (!valid) {
                alert('未入力のフィールドがあります');
                return;
            }

            /* 追加 or 更新 */
            let idx;
            if (this.editingIndex === null) {
                this.commands.push(obj);
                idx = this.commands.length - 1;
            } else {
                this.commands[this.editingIndex] = obj;
                idx = this.editingIndex;
                this._resetEditMode();
            }

            /* yesno dialog の answer 自動補完 */
            if (obj.operation === 'dialog' && obj.dialogMode === 'yesno') {
                this._ensureYesNoAnswers(idx);
            }

            this._clearForm();
            this._renderList();
            this._renderSuggestions();
        }

        /*
         * =========================================================
         *  リスト描画・編集
         * ======================================================= */
        _renderList() {
            this.listEl.innerHTML = '';
            const related = this._calcRelatedIndices(this.editingIndex);

            this.commands.forEach((cmd, i) => {
                const li = document.createElement('li');
                li.dataset.index = i;
                li.textContent = `${i}: ${cmd.operation} ${this._describe(cmd)}`;
                if (i === this.editingIndex) li.classList.add('active');
                if (related.has(i)) li.classList.add('related');

                li.draggable = true;
                li.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', i));
                li.addEventListener('dragover', e => e.preventDefault());
                li.addEventListener('drop', e => {
                    const from = Number(e.dataTransfer.getData('text/plain'));
                    const to = i;
                    if (from === to) return;
                    const moved = this.commands.splice(from, 1)[0];
                    this.commands.splice(to, 0, moved);
                    this._resetEditMode();
                    this._renderList();
                });

                li.addEventListener('click', () => this._startEdit(i));
                this.listEl.append(li);
            });
        }

        _describe(cmd) {
            switch (cmd.operation) {
                case 'page': {
                    // pageId を先頭に、テキスト 30 文字程度を付ける
                    const idPart = cmd.pageId ? `(${cmd.pageId})` : '';
                    const textPart = cmd.text
                        ? ' ' + cmd.text.replace(/\n/g, ' ').slice(0, 30) + (cmd.text.length > 30 ? '…' : '')
                        : '';
                    return `${idPart}${textPart}`;
                }
                case 'answer' :
                    return `(${cmd.answerValue})`;
                case 'jump'   :
                    return `→${cmd.targetPage}`;
                case 'changeItemCount':
                    return `${cmd.item} ${cmd.delta}`;
                case 'condition': {
                    if (Array.isArray(cmd.items)) return `[items×${cmd.items.length}]`;
                    if (cmd.checkItem) return `${cmd.checkItem} ≥ ${cmd.requiredCount}`;
                    return '';
                }
                default :
                    return '';
            }
        }

        _startEdit(i) {
            if (this.editingIndex === i) {
                this._resetEditMode();
                this._clearForm();
                this._renderList();
                this.detailZone.textContent = '';
                return;
            }
            this.editingIndex = i;
            const cmd = this.commands[i];
            this.cmdTypeEl.value = cmd.operation;
            this._renderFields(cmd);
            this.actionBtn.textContent = 'Update';
            this.deleteBtn.disabled    = false;    // ★追加
            this._renderList();
            this.detailZone.textContent = JSON.stringify(cmd, null, 2);
        }

        /* ----------------------------------------------------------
         * yes/no dialog → answer 自動補完
         * ------------------------------------------------------- */
        _ensureYesNoAnswers(dialogIdx) {
            ['yes', 'no'].forEach((v, off) => {
                const exists = this.commands.some(c => c.operation === 'answer' && c.answerValue === v);
                if (!exists) this.commands.splice(dialogIdx + 1 + off, 0, {operation: 'answer', answerValue: v});
            });
        }

        /* ----------------------------------------------------------
         * JSON 文字列 → commands[]
         * ------------------------------------------------------- */
        _importJson(jsonStr) {
            jsonStr = jsonStr.trim();
            if (!jsonStr) {
                alert('JSON が空です');
                return;
            }
            let data;
            try {
                data = JSON.parse(jsonStr);
            } catch (e) {
                alert('JSON の解析に失敗しました');
                return;
            }
            const cmds = Array.isArray(data) ? data : Array.isArray(data.commands) ? data.commands : null;
            if (!cmds) {
                alert('commands 配列が見つかりません');
                return;
            }
            this.commands = structuredClone(cmds);
            this.autoPageSerial = this._calcNextAutoSerial();
            this._resetEditMode();
            this._renderList();
            this._renderSuggestions();
            this._renderFields();
        }

        _calcNextAutoSerial() {
            let max = 0;
            this.commands.forEach(c => {
                if ((c.operation === 'page' || c.operation === 'exit') && c.pageId?.startsWith('page')) {
                    const n = Number(c.pageId.slice(4));
                    if (!Number.isNaN(n) && n > max) max = n;
                }
            });
            return max + 1;
        }

        /* ----------------------------------------------------------
         * datalist
         * ------------------------------------------------------- */
        _buildPageIdDatalist() {
            let dl = document.getElementById('pageIds');
            if (dl) dl.remove();
            dl = document.createElement('datalist');
            dl.id = 'pageIds';
            this.commands.filter(c => (c.operation === 'page' || c.operation === 'exit') && c.pageId)
                .forEach(cmd => {
                    const opt = document.createElement('option');
                    opt.value = cmd.pageId;
                    dl.append(opt);
                });
            document.body.append(dl);
        }

        /* ----------------------------------------------------------
         *  選択ノードに関連するノード (index)
         * ------------------------------------------------------- */
        _calcRelatedIndices(selectedIdx) {
            const related = new Set();
            if (selectedIdx == null) return related;

            const cmd = this.commands[selectedIdx];
            if (!cmd) return related;

            if (cmd.operation === 'dialog') {
                for (let i = selectedIdx + 1; i < this.commands.length; i++) {
                    const c = this.commands[i];
                    if (c.operation === 'answer') {
                        related.add(i);
                        continue;
                    }
                    const isBlockEnd = c.operation === 'dialog' || c.operation === 'exit' || (c.operation === 'page' && c.pageId);
                    if (isBlockEnd) break;
                }
            } else if (cmd.operation === 'jump') {
                const idx = this.commands.findIndex(c => (c.operation === 'page' || c.operation === 'exit') && c.pageId === cmd.targetPage);
                if (idx !== -1) related.add(idx);
            } else if (cmd.operation === 'condition') {
                const pages = [cmd.successPage, cmd.failurePage];
                this.commands.forEach((c, i) => {
                    if ((c.operation === 'page' || c.operation === 'exit') && pages.includes(c.pageId)) related.add(i);
                });
            }
            return related;
        }

        /* ----------------------------------------------------------
         *  Export 補助
         * ------------------------------------------------------- */
        _buildLabelTable() {
            const t = {};
            this.commands.forEach((c, i) => {
                if ((c.operation === 'page' || c.operation === 'exit') && c.pageId) t[c.pageId] = i;
            });
            return t;
        }

        _getFirstPageId() {
            const p = this.commands.find(c => c.operation === 'page');
            return p?.pageId ?? '';
        }

        /* ----------------------------------------------------------
         *  サジェスト
         * ------------------------------------------------------- */
        _buildSuggestions() {
            const list = [];
            if (!this.commands.some(c => c.operation === 'exit'))
                list.push({label: 'exit ノード (pageId=end)', template: {operation: 'exit', pageId: 'end'}});

            this.commands.filter(c => c.operation === 'dialog' && c.dialogMode === 'yesno')
                .forEach(() => {
                    ['yes', 'no'].forEach(v => {
                        if (!this.commands.some(c => c.operation === 'answer' && c.answerValue === v))
                            list.push({label: `answer "${v}"`, template: {operation: 'answer', answerValue: v}});
                    });
                });
            return list;
        }

        _renderSuggestions() {
            this.suggestListEl.innerHTML = '';
            this._buildSuggestions().forEach(s => {
                const li = document.createElement('li');
                li.textContent = s.label;
                li.addEventListener('click', () => {
                    this.commands.push({...s.template});
                    this._renderList();
                    this._renderSuggestions();
                });
                this.suggestListEl.append(li);
            });
        }
    }

    /* ---------- 起動 ---------- */
    window.addEventListener('DOMContentLoaded', () => new ScriptBuilder());

    /* ==========  テスト実行ボタン ========= */
    $('#runBtn').addEventListener('click', async () => {
        const json = $('#output').value.trim();
        if (!json) {
            alert('先に Export JSON を生成してください');
            return;
        }
        const {UIEventDialog} = await import('../Script/UI/UIEventDialog.js');
        document.querySelectorAll('.ui-event-dialog').forEach(e => e.remove());
        const dlg = new UIEventDialog(document.body, {
            titleEmoji: '🧙',
            getItemCount: () => 99,
            changeItemCount: () => {
            },
            onExit: () => console.log('dialog closed')
        });
        dlg.run(json);
    });
})();
