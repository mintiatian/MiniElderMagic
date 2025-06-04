import {$, FIELD_DEFS, createSelect, ITEM_OPTIONS} from './ScriptBuilderUtils.js';
import {ScriptBuilderModel} from './ScriptBuilderModel.js';
import {EventDataTable} from "../Script/Utils/DataTable.js";
import {saveEventCsvToFolder} from './ImportExportService.js';

(() => {
    class ScriptBuilder {
        constructor() {

            const urls = {
                event: 'https://docs.google.com/spreadsheets/d/1Yz0RJs4WuimcoH2Af6c1JclQL46bgGOGj1QUqAnfXPc/export?format=csv',
            };

            this._loadedCount = 0;            // 進捗カウンター
            this._totalToLoad = Object.keys(urls).length;            // 期待ロード数

            EventDataTable.init(urls.event).then(() => this.initCount());

        }

        initCount() {
            ++this._loadedCount;
            console.log("MasterLoad : ", this._loadedCount, " / ", this._totalToLoad)
            if (this._loadedCount === this._totalToLoad) {
                this.init();                      // ← ここで後続処理
            }
        }

        init() {
            $('#openSheetsCsvToolBtn')?.addEventListener('click', () =>
                window.open('SheetsCSVTool.html', '_blank')
            );
            this.eventIdListEl = $('#eventIdList');   // ★追加
            /* -------------------------------------------------- */
            /*  イベント ID を選択したら JSON を textarea へ     */
            /* -------------------------------------------------- */
            this.eventIdListEl?.addEventListener('change', () => {
                const id = this.eventIdListEl.value;
                const data = EventDataTable.get(id);      // Map から取得
                if (!data) return;

                this.selectedEventId = id;                // ★追加
                // data.text は JSON 文字列なので整形して表示
                try {
                    const obj = typeof data.text === 'string'
                        ? JSON.parse(data.text)
                        : data.text;                      // 既にオブジェクトならそのまま
                    this.outputEl.value = JSON.stringify(obj, null, 2); // 2スペースインデント
                } catch (e) {
                    // パース失敗時はそのまま表示
                    this.outputEl.value = data.text ?? '';
                }
                this.applyJsonBtn.disabled = false;       // 選んだので押せる
            });

            this.applyJsonBtn = $('#applyJsonBtn');
            /* ボタンのクリック先を統合 */
            this.applyJsonBtn.addEventListener('click', () => {
                if (this.selectedEventId) {
                    this._applyJsonToEvent(this.selectedEventId, this.outputEl.value);
                } else {
                    this._applyJsonToSelected(this.outputEl.value); // 既存処理
                }
            });

            //this.applyJsonBtn.disabled = true;        // 初期はオフ
            $('#saveEventCsvBtn').addEventListener('click', saveEventCsvToFolder);

            this.model = new ScriptBuilderModel();
            this.editingIndex = null;

            // DOM
            this.cmdTypeEl = $('#cmdType');
            this.fieldZone = $('#fieldZone');
            this.actionBtn = $('#actionBtn');
            this.deleteBtn = $('#deleteBtn');
            this.listEl = $('#cmdList');
            this.detailZone = $('#detailZone');
            this.outputEl = $('#output');
            this.suggestListEl = $('#suggestList');
            this.importBtn = $('#importBtn');

            // Model -> View
            this.model.onChange(() => {
                this._renderList();
                this._renderSuggestions();
            });

            this._bindEvents();
            this._renderFields();
            this._renderSuggestions();
            this.selectedEventId = null;
            this._populateEventIdList();   // ★追加 (モデル監視登録の後あたり)
        }

        /* --------------------------------------------------
     *  textarea の JSON を選択中イベント ID へ反映
     * -------------------------------------------------*/
        _applyJsonToEvent(id, jsonStr) {
            const js = jsonStr.trim();
            if (!js) {
                alert('JSON が空です');
                return;
            }
            let obj;
            try {
                obj = JSON.parse(js);
            } catch {
                alert('JSON のパースに失敗しました');
                return;
            }

            const evt = EventDataTable.get(id);
            if (!evt) {
                alert(`Event "${id}" が見つかりません`);
                return;
            }

            // 好みで文字列保存にするか、直接オブジェクトで持つか決めてください
            evt.text = JSON.stringify(obj);               // ★ここが本命

            // 確認用に textarea を整形して再表示
            this.outputEl.value = JSON.stringify(obj, null, 2);
            alert(`Event "${id}" の text を更新しました`);
        }

        /* -------------------------------------------------- */
        /*  イベント ID リストボックスを構築                  */

        /* -------------------------------------------------- */
        _populateEventIdList() {
            if (!this.eventIdListEl) return;          // HTML に置かれていない場合は無視
            const sel = this.eventIdListEl;
            sel.innerHTML = '';                       // クリア

            // EventDataTable.table は Map<id , EventDataTable>
            for (const id of EventDataTable.table.keys()) {
                const opt = document.createElement('option');
                opt.value = id;
                opt.textContent = id;
                sel.append(opt);
            }
        }

        /* -------------------------------------------------- */
        _moveSelection(dir) {
            const cmds = this.model.commands;
            if (!cmds.length) return;

            if (this.editingIndex == null) {
                const idx = dir < 0 ? 0 : cmds.length - 1;
                this._startEdit(idx);
                return;
            }

            const idx = this.editingIndex + dir;
            if (idx < 0 || idx >= cmds.length) return;
            this._startEdit(idx);

            const li = this.listEl.children[idx];
            if (li) li.scrollIntoView({block: 'nearest'});
        }

        /* -------------------------------------------------- */
        _handleDelete() {
            if (this.editingIndex == null) return;
            if (!confirm('このノードを削除しますか？')) return;
            this.model.removeCommand(this.editingIndex);
            this._resetEditMode();
        }

        _resetEditMode() {
            this.editingIndex = null;
            this.actionBtn.textContent = 'Add';
            this.deleteBtn.disabled = true;
            //this.applyJsonBtn.disabled = true;    // ★追加
        }

        _clearForm() {
            this.fieldZone.querySelectorAll('input,textarea').forEach((el) => (el.value = ''));
        }

        /* -------------------------------------------------- */
        _bindEvents() {
            this.cmdTypeEl.addEventListener('change', () => {
                this._renderFields();
                this._resetEditMode();
            });

            this.actionBtn.addEventListener('click', () => this._handleAddOrUpdate());
            this.deleteBtn.addEventListener('click', () => this._handleDelete());

            $('#exportBtn').addEventListener('click', () => {
                this.outputEl.value = JSON.stringify(this.model.exportPayload(), null, 2);
            });

            this.importBtn.addEventListener('click', () => this._importJson(this.outputEl.value));

            window.addEventListener('keydown', (e) => {
                if (!['ArrowUp', 'ArrowDown'].includes(e.key)) return;
                if (document.activeElement.tagName.match(/^(INPUT|TEXTAREA)$/)) return;
                e.preventDefault();
                this._moveSelection(e.key === 'ArrowUp' ? -1 : 1);
            });
        }

        /* -------------------------------------------------- */
        _renderFields(values = {}) {
            this.fieldZone.innerHTML = '';
            const defs = FIELD_DEFS[this.cmdTypeEl.value];

            if (this.cmdTypeEl.value === 'jump') this._buildPageIdDatalist();

            defs.forEach((def) => {
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
                    el = def.type === 'textarea' ? document.createElement('textarea') : document.createElement('input');
                    if (def.type && def.type !== 'textarea') el.type = def.type;
                }

                if (def.placeholder) el.placeholder = def.placeholder;
                el.id = def.key;
                el.value = values[def.key] ?? '';

                wrap.append(label, el);
                this.fieldZone.append(wrap);
            });

            if (this.cmdTypeEl.value === 'condition') {
                // 新: items editor
                const wrap = document.createElement('div');
                wrap.className = 'field';
                wrap.innerHTML = '<span>items</span>';

                const zone = document.createElement('div');
                zone.className = 'items-zone';
                wrap.append(zone);

                const addBtn = document.createElement('button');
                addBtn.type = 'button';
                addBtn.textContent = '＋ 行追加';
                addBtn.onclick = () => this._addItemRow(zone);
                wrap.append(addBtn);

                // 既存値を展開
                if (Array.isArray(values.items)) {
                    values.items.forEach(o => this._addItemRow(zone, o.item, o.count));
                } else {
                    this._addItemRow(zone);              // 初期 1 行
                }
                this.fieldZone.append(wrap);
            }
        }

        /* ▼ ① items 行を生成するユーティリティ */
        _addItemRow(zone, item = ITEM_OPTIONS[0], count = '') {
            const row = document.createElement('div');
            row.className = 'item-row';

            /* 絵文字セレクトを生成 */
            const sel = createSelect(ITEM_OPTIONS, item);
            sel.className = 'item';

            /* 個数入力 */
            const num = document.createElement('input');
            num.className = 'count';
            num.type = 'number';
            num.min = 1;
            if (count !== '') num.value = count;

            /* 削除ボタン */
            const rm = document.createElement('button');
            rm.type = 'button';
            rm.textContent = '×';
            rm.className = 'remove';
            rm.onclick = () => row.remove();

            row.append(sel, num, rm);
            zone.append(row);
        }

        /* -------------------------------------------------- */
        _handleAddOrUpdate() {
            const type = this.cmdTypeEl.value;
            const defs = FIELD_DEFS[type];
            const obj = {operation: type};
            let valid = true;

            defs.forEach((def) => {
                const raw = $(`#${def.key}`).value.trim();
                const val = def.type === 'number' ? Number(raw) : raw;

                if (type === 'page' && def.key === 'pageId' && val === '') {
                    obj.pageId = this.model.generateNextPageId();
                    $(`#${def.key}`).value = obj.pageId;
                } else {
                    obj[def.key] = val;
                }

                if (def.required !== false && (val === '' || val === undefined)) {
                    if (!(type === 'condition' && ['checkItem', 'requiredCount'].includes(def.key))) valid = false;
                }
            });

            // condition: items JSON
            if (type === 'condition') {
                ['successPage', 'failurePage'].forEach(k => {
                    if (!obj[k]) {                                   // 空欄なら
                        obj[k] = this.model.generateNextPageId(k);    // 新しい pageId
                        $(`#${k}`).value = obj[k];                   // フォームに書き戻し
                    }
                });

                const rows = this.fieldZone.querySelectorAll('.item-row');
                const items = [...rows].reduce((acc, r) => {
                    const it = r.querySelector('.item').value.trim();
                    const ct = r.querySelector('.count').valueAsNumber;  // NaN なら数値エラー
                    if (it && Number.isFinite(ct) && ct > 0) {
                        acc.push({item: it, count: ct});
                    }
                    return acc;
                }, []);

                if (!items.length) {
                    alert('item または count が未入力、または count が 0 以下です');
                    return;
                }
                obj.items = items;
            }

            if (!valid) {
                alert('未入力のフィールドがあります');
                return;
            }

            let idx;
            if (this.editingIndex === null) {
                idx = this.model.addCommand(obj);
            } else {
                this.model.updateCommand(this.editingIndex, obj);
                idx = this.editingIndex;
                this._resetEditMode();
            }

            if (obj.operation === 'dialog' && obj.dialogMode === 'yesno') this.model.ensureYesNoAnswers(idx);
            if (obj.operation === 'condition')
                this.model.ensureConditionPages(idx);
            this._clearForm();
        }

        /* -------------------------------------------------- */
        _renderList() {
            const cmds = this.model.commands;
            this.listEl.innerHTML = '';
            const related = this._calcRelatedIndices(this.editingIndex);

            cmds.forEach((cmd, i) => {
                const li = document.createElement('li');
                li.dataset.index = i;
                li.textContent = `${i}: ${cmd.operation} ${this._describe(cmd)}`;
                if (i === this.editingIndex) li.classList.add('active');
                if (related.has(i)) li.classList.add('related');

                li.draggable = true;
                li.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/plain', i));
                li.addEventListener('dragover', (e) => e.preventDefault());
                li.addEventListener('drop', (e) => {
                    const from = Number(e.dataTransfer.getData('text/plain'));
                    const to = i;
                    if (from === to) return;
                    this.model.moveCommand(from, to);
                    this._resetEditMode();
                });
                li.addEventListener('click', () => this._startEdit(i));
                this.listEl.append(li);
            });
        }

        _describe(cmd) {
            switch (cmd.operation) {
                case 'page':
                    return `${cmd.pageId ? `(${cmd.pageId})` : ''}${cmd.text ? ' ' + cmd.text.replace(/\n/g, ' ').slice(0, 30) + (cmd.text.length > 30 ? '…' : '') : ''}`;
                case 'answer':
                    return `(${cmd.answerValue})`;
                case 'jump':
                    return `→${cmd.targetPage}`;
                case 'changeItemCount':
                    return `${cmd.item} ${cmd.delta}`;
                case 'condition':
                    if (Array.isArray(cmd.items)) return `[items×${cmd.items.length}]`;
                    if (cmd.checkItem) return `${cmd.checkItem} ≥ ${cmd.requiredCount}`;
                    return '';
                default:
                    return '';
            }
        }

        _startEdit(i) {
            const cmds = this.model.commands;
            if (this.editingIndex === i) {
                this._resetEditMode();
                this._clearForm();
                this._renderList();
                this.detailZone.textContent = '';
                return;
            }

            this.editingIndex = i;
            const cmd = cmds[i];
            this.cmdTypeEl.value = cmd.operation;
            this._renderFields(cmd);
            this.actionBtn.textContent = 'Update';
            this.deleteBtn.disabled = false;
            //this.applyJsonBtn.disabled = false;   // ★追加
            this._renderList();
            this.detailZone.textContent = JSON.stringify(cmd, null, 2);
        }

        /* --------------------------------------------------
         *  textarea の JSON を選択中ノードへ反映
         * -------------------------------------------------*/
        _applyJsonToSelected(jsonStr) {
            if (this.editingIndex == null) {
                alert('まずリストでノードを選択してください');
                return;
            }
            const js = jsonStr.trim();
            if (!js) {
                alert('JSON が空です');
                return;
            }

            let obj;
            try {
                obj = JSON.parse(js);
            } catch {
                alert('JSON のパースに失敗しました');
                return;
            }

            // operation が無いなど最低限のチェック
            if (typeof obj !== 'object' || !obj.operation) {
                alert('有効なコマンドオブジェクトではありません');
                return;
            }

            this.model.updateCommand(this.editingIndex, obj);

            // ビューを同期
            this._renderFields(obj);
            this.detailZone.textContent = JSON.stringify(obj, null, 2);
            this._renderList();
        }

        /* -------------------------------------------------- */
        _importJson(jsonStr) {
            const js = jsonStr.trim();
            if (!js) {
                alert('JSON が空です');
                return;
            }
            try {
                this.model.importJson(js);
                this._resetEditMode();
                this._renderFields();
            } catch (e) {
                alert(e.message);
            }
        }

        /* -------------------------------------------------- */
        _buildPageIdDatalist() {
            let dl = document.getElementById('pageIds');
            if (dl) dl.remove();
            dl = document.createElement('datalist');
            dl.id = 'pageIds';
            this.model.commands
                .filter((c) => (c.operation === 'page' || c.operation === 'exit') && c.pageId)
                .forEach((cmd) => {
                    const opt = document.createElement('option');
                    opt.value = cmd.pageId;
                    dl.append(opt);
                });
            document.body.append(dl);
        }

        /* -------------------------------------------------- */
        _calcRelatedIndices(selectedIdx) {
            const related = new Set();
            const cmds = this.model.commands;
            if (selectedIdx == null) return related;

            const cmd = cmds[selectedIdx];
            if (!cmd) return related;

            if (cmd.operation === 'dialog') {
                for (let i = selectedIdx + 1; i < cmds.length; i++) {
                    const c = cmds[i];
                    if (c.operation === 'answer') {
                        related.add(i);
                        continue;
                    }
                    const end = c.operation === 'dialog' || c.operation === 'exit' || (c.operation === 'page' && c.pageId);
                    if (end) break;
                }
            } else if (cmd.operation === 'jump') {
                const idx = cmds.findIndex((c) => (c.operation === 'page' || c.operation === 'exit') && c.pageId === cmd.targetPage);
                if (idx !== -1) related.add(idx);
            } else if (cmd.operation === 'condition') {
                const pages = [cmd.successPage, cmd.failurePage];
                cmds.forEach((c, i) => {
                    if ((c.operation === 'page' || c.operation === 'exit') && pages.includes(c.pageId)) related.add(i);
                });
            }
            return related;
        }

        /* -------------------------------------------------- */
        _buildSuggestions() {
            const list = [];
            const cmds = this.model.commands;

            if (!cmds.some((c) => c.operation === 'exit')) {
                list.push({label: 'exit ノード (pageId=end)', template: {operation: 'exit', pageId: 'end'}});
            }

            cmds
                .filter((c) => c.operation === 'dialog' && c.dialogMode === 'yesno')
                .forEach(() => {
                    ['yes', 'no'].forEach((v) => {
                        if (!cmds.some((c) => c.operation === 'answer' && c.answerValue === v)) {
                            list.push({label: `answer "${v}"`, template: {operation: 'answer', answerValue: v}});
                        }
                    });
                });

            return list;
        }

        _renderSuggestions() {
            this.suggestListEl.innerHTML = '';
            this._buildSuggestions().forEach((s) => {
                const li = document.createElement('li');
                li.textContent = s.label;
                li.addEventListener('click', () => {
                    this.model.addCommand({...s.template});
                });
                this.suggestListEl.append(li);
            });
        }
    }

    window.addEventListener('DOMContentLoaded', () => new ScriptBuilder());

    $('#runBtn').addEventListener('click', async () => {
        const json = $('#output').value.trim();
        if (!json) {
            alert('先に Export JSON を生成してください');
            return;
        }
        const {UIEventDialog} = await import('../Script/UI/UIEventDialog.js');
        document.querySelectorAll('.ui-event-dialog').forEach((e) => e.remove());
        const dlg = new UIEventDialog(document.body, {
            titleEmoji: '🧙',
            getItemCount: () => 99,
            changeItemCount: () => {
            },
            onExit: () => console.log('dialog closed'),
        });
        dlg.run(json);
    });
})();
