/* SaveManager.js — MiniElderMagic
 * -------------------------------------------------------------
 * Persistent save/load system with multi‑slot & version history.
 * -------------------------------------------------------------
 *  ‣ Storage: window.localStorage  (prefix: "MEM_SAVE")
 *  ‣ Replace _getStorage/_setStorage/_removeStorage for custom back‑end.
 *  ‣ Public API
 *        const mgr = new SaveManager();
 *        mgr.save(slotNameOrId, data)       // returns {slotId, version, ts}
 *        mgr.load(slotId, version?)         // → data | null
 *        mgr.listSlots()                    // → [{id,name,versions:[{version,ts}]}]
 *        mgr.deleteSlot(slotId)
 *        mgr.deleteVersion(slotId, version)
 * -------------------------------------------------------------
 */

export class SaveManager {
    constructor(prefix = 'MEM_SAVE') {
        this.prefix = prefix;
        this._indexKey = `${prefix}:index`;
        this._index = this._loadIndex();   // [{id,name,versions:[{version,ts}]}]
    }

    /* ---------------- public API ---------------- */
    listSlots() {
        // shallow copy to prevent external mutation
        return this._index.map(s => ({ ...s, versions: [...s.versions] }));
    }

    /**
     * Save data into slot (create or append new version)
     * @param {string} slotNameOrId - existing id or new slot name
     * @param {*}      data         - serialisable object
     * @returns {{slotId:string, version:number, ts:number}}
     */
    save(slotNameOrId, data) {
        const now = Date.now();
        let slot = this._index.find(s => s.id === slotNameOrId || s.name === slotNameOrId);

        if (!slot) {
            slot = { id: this._genId(), name: slotNameOrId || '', versions: [] };
            this._index.push(slot);
        }
        const version = (slot.versions.at(-1)?.version ?? 0) + 1;
        const meta = { version, ts: now };

        // persist payload
        this._setStorage(this._key(slot.id, version), JSON.stringify({ meta, data }));

        slot.versions.push(meta);
        this._saveIndex();
        return { slotId: slot.id, version, ts: now };
    }

    /**
     * Load data from slot. If version omitted, loads latest.
     * @param {string} slotId
     * @param {number=} version
     */
    load(slotId, version) {
        const slot = this._index.find(s => s.id === slotId);
        if (!slot) return null;
        if (version === undefined) version = slot.versions.at(-1)?.version;
        if (version == null) return null;
        const raw = this._getStorage(this._key(slot.id, version));
        return raw ? JSON.parse(raw).data : null;
    }

    /** Delete entire slot (all versions) */
    deleteSlot(slotId) {
        const idx = this._index.findIndex(s => s.id === slotId);
        if (idx === -1) return false;
        for (const { version } of this._index[idx].versions) {
            this._removeStorage(this._key(slotId, version));
        }
        this._index.splice(idx, 1);
        this._saveIndex();
        return true;
    }

    /** Delete only a specific version */
    deleteVersion(slotId, version) {
        const slot = this._index.find(s => s.id === slotId);
        if (!slot) return false;
        const vIdx = slot.versions.findIndex(v => v.version === version);
        if (vIdx === -1) return false;
        this._removeStorage(this._key(slotId, version));
        slot.versions.splice(vIdx, 1);
        if (!slot.versions.length) this.deleteSlot(slotId); else this._saveIndex();
        return true;
    }

    /* --------------- internal helpers --------------- */
    _key(id, ver) { return `${this.prefix}:${id}:${ver}`; }

    _loadIndex() {
        try { return JSON.parse(this._getStorage(this._indexKey)) ?? []; }
        catch { return []; }
    }
    _saveIndex() { this._setStorage(this._indexKey, JSON.stringify(this._index)); }

    _genId() { return 'slot' + Math.random().toString(36).slice(2, 10); }

    /* Storage wrappers – override for custom backend */
    _getStorage(k)  { return window.localStorage.getItem(k); }
    _setStorage(k,v){ window.localStorage.setItem(k,v);      }
    _removeStorage(k){ window.localStorage.removeItem(k);    }
}
