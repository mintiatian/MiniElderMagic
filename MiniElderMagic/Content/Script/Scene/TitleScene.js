/* TitleScene.js — MiniElderMagic (Neo-v3)
 * New Game / Load Game  +  LoadManagerUI 読込対応
 * ------------------------------------------------------------------ */

import {BaseScene} from './BaseScene.js';
import {GameMainScene} from './GameMainScene.js';
import {SceneManagerInstance} from './SceneManager.js';
import {SaveManager} from '../Save/SaveManager.js';
import {LoadManagerUI} from '../Save/LoadManagerUI.js';
import { UILanguageSelector } from '../UI/UILanguageSelector.js';
import {language, setLanguage} from '../Utils/DataTable.js';
export class TitleScene extends BaseScene {

    /* -------------------------------------------------------------- */
    constructor(gameArea, gameUiLayer) {
        super();
        this.gameArea = gameArea;
        this.gameUiLayer = gameUiLayer;

        /* Save / Load ------------------------------------------------ */
        this.saveMgr = new SaveManager();
        this.saveGui = new LoadManagerUI(gameUiLayer, this.saveMgr, {
            applyLoadData: d => this._loadSaveData(d)
        });

        this._injectStyles();                      // 1 度だけ CSS 注入
    }

    /* ==================== Scene Life-Cycle ========================= */
    onEnter() {
        if (!this.saveGui.element.isConnected){ this.gameUiLayer.appendChild(this.saveGui.element); }
        
        /* === 言語選択 UI を追加 === */
        this.langUI = new UILanguageSelector(this.gameUiLayer, newLang => {
            setLanguage(newLang);
            //language = newLang;
            // 翻訳反映処理（未実装ならここに translatePage() など）
            console.log(`言語を切り替えました: ${language}`);
        });
        
        
        
        /* ----- タイトル DOM -------------------------------------- */
        this.titleDiv = document.createElement('div');
        this.titleDiv.id = 'title-screen';
        this.titleDiv.className = 'ts-wrap';
        this.titleDiv.innerHTML = `
            <h1 class="ts-logo">🧙 Mini Elder&nbsp;Magic</h1>
            <button id="btn-new"  class="ts-btn ts-btn--primary">New&nbsp;Game</button>
            <button id="btn-load" class="ts-btn">Load&nbsp;Game</button>
        `;
        this.gameUiLayer.appendChild(this.titleDiv);

        /* ----- ボタン -------------------------------------------- */
        this.titleDiv.querySelector('#btn-new').onclick = () => this._startNewGame();
        this.titleDiv.querySelector('#btn-load').onclick = () => this.saveGui.show();

        /* ----- Esc で LoadGUI を閉じる --------------------------- */
        this._esc = e => {
            if (e.key === 'Escape' && this.saveGui && this.saveGui?.isVisible) {
                this.saveGui.hide();
            }
        };
        
        
        window.addEventListener('keydown', this._esc);
    }

    onExit() {
        /* Esc リスナー解除 */
        window.removeEventListener('keydown', this._esc);

        /* LoadManagerUI は隠すだけにして再利用 */
        this.saveGui?.hide();

        /* DOM クリーンアップ */
        this.titleDiv.remove();
        this.gameArea.innerHTML = '';
        this.gameUiLayer.innerHTML = '';
        //this.langUI?.remove();  // 言語UIも削除
    }

    /* ===================== Helpers ================================ */
    _startNewGame() {
        this._showLoadingOverlay();
        const gm = new GameMainScene(this.gameArea, this.gameUiLayer);
        SceneManagerInstance.change(gm).finally(() => this.loadingDiv?.remove());
    }

    _loadSaveData(data) {
        this._showLoadingOverlay();
        const gm = new GameMainScene(this.gameArea, this.gameUiLayer);

        SceneManagerInstance.changeLoadData(gm, {
            saveData: data,
            loadingEl: this.loadingDiv
        }).then(() => this.saveGui.hide())
            .catch(err => {
                console.error('Load failed', err);
                alert('Load failed');
            })
            .finally(() => this.loadingDiv?.remove());
    }

    /* -------------------- Loading Overlay ------------------------- */
    _showLoadingOverlay() {
        if (this.loadingDiv) return;
        this.loadingDiv = document.createElement('div');
        this.loadingDiv.className = 'ts-loading';
        this.loadingDiv.innerHTML =
            `<div class="ts-spinner"></div><span>Loading…</span>`;
        this.gameUiLayer.appendChild(this.loadingDiv);
    }

    /* ==================== Style Injection ========================= */
    _injectStyles() {
        if (document.getElementById('title-scene-style')) return;
        const css = `
            /* ===== Title Scene (ts-*) ============================== */
            .ts-wrap{
                position:absolute; inset:0; display:flex; flex-direction:column;
                justify-content:center; align-items:center; gap:24px;
                font-family:'Segoe UI',sans-serif; color:#fafafa; text-align:center;
                animation:ts-fade 1s ease-out forwards;
            }
            @keyframes ts-fade{0%{opacity:0;transform:scale(.95);}
                               100%{opacity:1;transform:scale(1);} }
            .ts-logo{
                font-size:72px; margin:0 0 32px;
                background:linear-gradient(135deg,#5ac8fa 10%,#a862ff 90%);
                -webkit-background-clip:text; color:transparent;
                text-shadow:0 4px 12px rgba(0,0,0,.4);
                animation:ts-float 4s ease-in-out infinite;
            }
            @keyframes ts-float{0%,100%{transform:translateY(-4px);}
                                50%     {transform:translateY(4px);} }
            .ts-btn{
                font-size:28px; padding:12px 64px;
                background:rgba(255,255,255,.1); color:#fafafa;
                border:1px solid rgba(255,255,255,.4);
                border-radius:50px; cursor:pointer; transition:all .2s;
                backdrop-filter:blur(4px);
            }
            .ts-btn:hover{
                transform:translateY(-4px);
                box-shadow:0 6px 16px rgba(0,0,0,.35);
            }
            .ts-btn--primary{ background:#5ac8fa; color:#000; }

            /* ===== Loading Overlay ================================= */
            .ts-loading{
                position:absolute; inset:0; display:flex; align-items:center;
                justify-content:center; gap:16px;
                background:rgba(0,0,0,.55); z-index:9998;
                font-size:28px; color:#fff;
            }
            .ts-spinner{
                width:40px; height:40px; border-radius:50%;
                border:5px solid #fff; border-top-color:transparent;
                animation:spin 1s linear infinite;
            }
            @keyframes spin{0%{transform:rotate(0);}
                            100%{transform:rotate(360deg);} }
        `;
        const st = document.createElement('style');
        st.id = 'title-scene-style';
        st.textContent = css;
        document.head.appendChild(st);
    }
}
