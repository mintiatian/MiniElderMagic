// Base/EventEmitterMixin.js
export const EventEmitterMixin = Super => class extends Super {
    #events = new Map();          // { eventName → Set<listener> }

    /** 監視開始 */
    on(evt, fn) {
        if (!this.#events.has(evt)) this.#events.set(evt, new Set());
        this.#events.get(evt).add(fn);
    }
    /** 監視解除 */
    off(evt, fn) { this.#events.get(evt)?.delete(fn); }

    /** 全削除（リーク防止用） */
    clearAllEvents() { this.#events.clear(); }

    /** 発火 */
    emit(evt, ...args) { this.#events.get(evt)?.forEach(fn => fn(...args)); }
};
