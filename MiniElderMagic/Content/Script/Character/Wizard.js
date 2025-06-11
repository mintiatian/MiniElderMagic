import {PlayerStatus} from "./playerStatus.js";
import {STAFF_SIZE} from '../GameData.js';
import {CharacterBase} from "./CharacterBase.js";
import {RangeCircleMixin} from "../Base/RangeCircleMixin.js";
import {gameMain} from "../GameMain.js";

export class Wizard extends RangeCircleMixin(CharacterBase) {
    constructor(x, y, parentElement, charaData) {
        super(x, y, parentElement, charaData);


        // 攻撃用の配列を追加
        this.attacks = [];
        this.lastPressedMagicIndex = 0;


        if (!this.playerstatus) {
            this.playerstatus = new PlayerStatus(0, 0);
        }


        // 杖の要素を作成する関数
        this.createStaffElement = () => {
            // 既存の杖要素があれば削除
            if (this.staffElement && this.staffElement.parentNode) {
                this.staffElement.parentNode.removeChild(this.staffElement);
            }

            // 新しい杖要素を作成
            this.staffElement = document.createElement('div');
            this.staffElement.id = `staff-${Date.now()}`; // ユニークIDを設定
            this.staffElement.classList.add('character', 'player-staff');
            this.staffElement.textContent = '🪄';  // 杖の絵文字
            this.staffElement.style.zIndex = '1';  // キャラクターの後ろに表示
            this.staffElement.style.transform = 'translate(-50%, -50%)'; // 中心を基準に配置
            this.staffElement.style.fontSize = STAFF_SIZE + 'px';

            // 親要素に追加
            if (parentElement && document.body.contains(parentElement)) {
                parentElement.appendChild(this.staffElement);
            }

            return this.staffElement;
        };


        // 杖要素を初期作成
        this.createStaffElement();

        // 初期方向に杖を配置
        this.updateStaffPosition();

        // 杖要素の健全性を定期的にチェック (3秒ごと)
        this.staffCheckInterval = setInterval(() => {
            if (!this.staffElement || !document.body.contains(this.staffElement)) {
                this.createStaffElement();
                this.updateStaffPosition();
            }
        }, 3000);

        // クリックイベントハンドラ参照を保持
        this.clickHandler = this.onPlayerClick.bind(this);
        this.mouseWheelHandler = this.onMouseWheel.bind(this);
        this.contextMenuHandler = this.onRightClick.bind(this);
        this.middleClickHandler = this.onMouseDown.bind(this);


        // 左クリック時、新しい弾を生成して発射する
        document.addEventListener('click', this.clickHandler);
        document.addEventListener('wheel', this.mouseWheelHandler);
        document.addEventListener('contextmenu', this.contextMenuHandler);  // 右クリック
        document.addEventListener('mousedown', this.middleClickHandler);


        this.isMouseDown = false;
        this.isRightMouseDown = false;
        this.mouseX = 0;
        this.mouseY = 0;

        this.mouseDownHandler = (e) => {
            if (e.button === 0) this.isMouseDown = true;
            if (e.button === 2) this.isRightMouseDown = true;
        };
        this.mouseUpHandler = (e) => {
            if (e.button === 0) this.isMouseDown = false;
            if (e.button === 2) this.isRightMouseDown = false;
        };

        document.addEventListener('mousedown', this.mouseDownHandler);
        document.addEventListener('mouseup', this.mouseUpHandler);

        this.clientX = 0;
        this.clientY = 0;
        /* ===== ビューポート → ワールド座標へ変換 ===== */
        this.mouseMoveHandler = (evt) => {

            this.clientX = evt.clientX;
            this.clientY = evt.clientY;

            this.UpdateMove();

        };
        document.addEventListener('mousemove', this.mouseMoveHandler);

        this.SetupHPGage();
        this.SetupMPGage();

        this.IsActive = false;
        this.SettingMagicData();

        this.CircleCreate(gameMain.background.MinPopRadius, '2px dashed rgba(0,255,255,0.5)');
        this.CircleCreate(gameMain.background.MaxPopRadius, '2px dashed rgba(0,255,255,0.5)');

        //this.changeShip();
    }

    UpdateMove() {
        const containerRect = this.element.parentElement.getBoundingClientRect();

        // 補正後マウス座標（ワールド基準）
        const mouseXWorld = this.clientX - containerRect.left;
        const mouseYWorld = this.clientY - containerRect.top;
        const playerCenter = this.getPlayerCenter();   // こちらもワールド座標
        // マウス方向に向けて回転
        const dx = mouseXWorld - playerCenter.x;
        const dy = mouseYWorld - playerCenter.y;
        // 次フレーム用に保持
        this.mouseX = mouseXWorld;
        this.mouseY = mouseYWorld;


        this.radian = Math.atan2(dy, dx);
        this.setDir(this.radian);
    }

    SettingMagicData() {
        // 起動時に 1 度だけ
//        this.SetMagic("FIREBALL");
        /*
        this.SetMagic("ICE");
        this.SetMagic("LIGHTNING");
        this.SetMagic("TORNADO");
        this.SetMagic("GREATAxe");
        */

        super.SettingMagicData();
    }


    SetMagic(MagicName) {

        super.SetMagic(MagicName);

        if (!this.playerstatus) {
            this.playerstatus = new PlayerStatus(0, 0);
        }
        this.playerstatus.MagicName = MagicName;

        if (!this.playerstatus.HasMagics.includes(MagicName)) {
            this.playerstatus.HasMagics.push(MagicName);

            // 選択をリセット
            this.lastPressedMagicIndex = -1
        }
    }


    changeStage() {
        this.status.heal(15);
        this.status.recoverMP(30);
    }

// PlayerBase.js   ── 完全版 update メソッド ──
    update(delta) {

        if (!this.IsActive) {
            super.update(delta);
            return;
        }


        {
            /* ───────── 2. 入力ベクトル作成 ───────── */
            let dx = (this.pressedKeys['d'] ? 1 : 0) - (this.pressedKeys['a'] ? 1 : 0);
            let dy = (this.pressedKeys['s'] ? 1 : 0) - (this.pressedKeys['w'] ? 1 : 0);

            /* ───────── 3. 斜め移動を等速化 ───────── */
            if (dx && dy) {                // 斜め入力なら √2 で割る
                const invLen = 1 / Math.SQRT2;
                dx *= invLen;
                dy *= invLen;
            }


            let acceleration = 0;
            /* ───────── 4. 入力があるときだけ向きを更新 ───────── */
            if (dx !== 0 || dy !== 0) {

                const playerCenter = this.getPlayerCenter();
                const dx = this.mouseX - playerCenter.x;
                const dy = this.mouseY - playerCenter.y;
                this.radian = Math.atan2(dy, dx);
                this.setDir(this.radian);


                let forward = 0;
                let strafe = 0;

                if (this.pressedKeys['w']) forward += 1;
                if (this.pressedKeys['s']) forward -= 1;
                if (this.pressedKeys['d']) strafe += 1;
                if (this.pressedKeys['a']) strafe -= 1;

                if (this.pressedKeys['s']) {
                    forward *= 0.5;
                }
                if (this.pressedKeys['run']) {

                    forward *= 3;
                }
                this.acceleration = forward;
                this.strafe = strafe;
            } else {

                this.acceleration = 0;
                this.strafe = 0;
            }
            this.setAcceleration(this.acceleration);


            // 各スロットのキー名
            const keyBindings = ['magic1', 'magic2', 'magic3', 'magic4',
                'magic5', 'magic6', 'magic7', 'magic8', 'magic9', 'magic0'];

            // 最大スロット数
            const maxSlots = keyBindings.length;

            // 各スロットごとに処理を分ける
            for (let i = 0; i < maxSlots; i++) {
                if (this.pressedKeys[keyBindings[i]] && this.lastPressedMagicIndex !== i) {
                    if (this.playerstatus.HasMagics.length > i) {
                        this.SetMagic(this.playerstatus.HasMagics[i]);
                        this.lastPressedMagicIndex = i; // 押した記録を保存
                    }
                }
            }

        }

        if (this.isMouseDown) {
            // 左クリック押しっぱなし時の処理
        }
        if (this.isRightMouseDown) {
            // 右クリック押しっぱなし時の処理

            if (!this.BarrierId) {
                this.AddBarrier();
            }
        } else {
            if (this.BarrierId) {
                this.RemoveBarrier();
            }
        }
        
        this.changeShip();

        this.UpdateMove();
        /* ───────── 8. 描画など親クラス処理 ───────── */
        super.update(delta);

        /* ───────── 9. HP ゲージ・杖など更新 ───────── */
        this.updateStaffPosition();

        //this.background.popDoEnemy(this.x,this.y);
        this.CircleUpdate();     // ← 必ず最後に呼んで追従
    }

    changeShip() {

        const ch = gameMain.background.getMapValue("tile", this.x, this.y);

        if (gameMain.background.DECOR_TILES_VOLCANO.has(ch)) {
            if(gameMain.Inventory.hasItem("🐦",1)) {
                this.emoji = '🐦';
                this.element.textContent = this.emoji;
            }
        }
        else if (gameMain.background.DECOR_TILES_DESERT.has(ch)) {
            if(gameMain.Inventory.hasItem("🐫",1)) {
                this.emoji = '🐫';
                this.element.textContent = this.emoji;
            }
        }
        else if (gameMain.background.DECOR_TILES_ICE.has(ch)) {
            if(gameMain.Inventory.hasItem("🛷",1)) {
                this.emoji = '🛷';
                this.element.textContent = this.emoji;
            }
        }
        else if (gameMain.background.DECOR_TILES_SEA.has(ch)) {
            if(gameMain.Inventory.hasItem("⛵",1)) {
                this.emoji = '⛵';
                this.element.textContent = this.emoji;
            }
        }
        else if (gameMain.background.DECOR_TILES_SKY.has(ch)) {
            if(gameMain.Inventory.hasItem("🦅",1)) {
                this.emoji = '🦅';
                this.element.textContent = this.emoji;
            }
        }
        else{
            this.emoji = this.charaData.emoji;
            this.element.textContent = this.emoji;
        }
    }

    hitsWall(px, py) {
        return super.hitsWall(px, py);
    }


    // 杖の位置を更新するメソッド
    updateStaffPosition() {
        // 杖要素の存在チェック
        if (!this.staffElement) {
            // 杖が未定義の場合は再作成
            this.createStaffElement();
        } else if (!document.body.contains(this.staffElement)) {
            // DOMに存在しない場合も再作成
            this.createStaffElement();
        }

        // 再作成後も杖が無い場合は処理を中止
        if (!this.staffElement) {
            return;
        }

        const offset = 30; // 杖のオフセット距離

        // 方向ベクトルを使用して杖の位置を計算
        // 方向ベクトルはすでに正規化されている（長さが1）
        const staffX = this.x + Math.cos(this.radian) * offset;
        const staffY = this.y + Math.sin(this.radian) * offset;

        try {
            // 杖の要素の位置を更新
            this.staffElement.style.left = staffX + 'px';
            this.staffElement.style.top = staffY + 'px';

            const angle = Math.atan2(this.dirY, this.dirX) * (180 / Math.PI);

            // 左を向いている（dx < 0）ときだけ上下反転
            const flipY = this.dirY < 0 ? -1 : 1;

            // 回転 + 必要なら反転
            this.staffElement.style.transform =
                `translate(-50%, -50%) scaleY(${flipY}) rotate(${angle}deg)`;
        } catch (error) {
            // エラーが発生した場合は杖を再作成
            this.createStaffElement();

            // 再試行
            try {
                this.staffElement.style.left = staffX + 'px';
                this.staffElement.style.top = staffY + 'px';
                const angle = Math.atan2(this.dirY, this.dirX) * (180 / Math.PI);
                this.staffElement.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
            } catch (retryError) {
                // 再試行失敗時も静かに続行
            }
        }
    }

    // 杖の現在位置を取得するメソッド
    getStaffPosition() {
        // 安全チェック - 要素が存在するか確認
        if (!this.staffElement) {
            this.createStaffElement();
            this.updateStaffPosition();

            // それでも杖がなければプレイヤー位置からの相対位置を返す（フォールバック）
            if (!this.staffElement) {
                return {
                    x: this.x + this.dirX * 30,
                    y: this.y + this.dirY * 30
                };
            }
        }

        if (!document.body.contains(this.staffElement)) {
            this.createStaffElement();
            this.updateStaffPosition();

            // それでも杖がDOMにない場合はフォールバック
            if (!document.body.contains(this.staffElement)) {
                return {
                    x: this.x + this.dirX * 30,
                    y: this.y + this.dirY * 30
                };
            }
        }

        try {
            // まず直接座標を試みる（より信頼性が高い）
            if (this.staffElement.style.left && this.staffElement.style.top) {
                const left = parseFloat(this.staffElement.style.left);
                const top = parseFloat(this.staffElement.style.top);

                if (!isNaN(left) && !isNaN(top)) {
                    return {x: left, y: top};
                }
            }

            // 上記が失敗した場合はBoundingClientRectを試みる
            const rect = this.staffElement.getBoundingClientRect();
            if (!rect.width || !rect.height) {
                return {
                    x: this.x + this.dirX * 30,
                    y: this.y + this.dirY * 30
                };
            }

            const containerRect = this.staffElement.parentElement.getBoundingClientRect();

            // ゲームエリア内の相対座標に変換
            return {
                x: rect.left - containerRect.left + rect.width / 2,
                y: rect.top - containerRect.top + rect.height / 2
            };
        } catch (error) {
            // エラーが発生した場合はゲーム座標をそのまま返す（フォールバック）
            return {
                x: this.x + this.dirX * 30,
                y: this.y + this.dirY * 30
            };
        }
    }

    // プレイヤーの中心位置を取得するメソッド（攻撃発射位置用）
    getPlayerCenter() {
        // 安全チェック - 要素が存在するか確認
        if (!this.element || !this.element.parentElement) {
            return {x: this.x, y: this.y}; // フォールバック
        }

        try {
            const rect = this.element.getBoundingClientRect();
            const containerRect = this.element.parentElement.getBoundingClientRect();

            // ゲームエリア内の相対座標に変換
            return {
                x: rect.left - containerRect.left + rect.width / 2,
                y: rect.top - containerRect.top + rect.height / 2
            };
        } catch (error) {
            return {x: this.x, y: this.y}; // 内部座標をフォールバックとして使用
        }
    }

    getPlayerPosition() {
        return {x: this.x, y: this.y}; // 内部座標をフォールバックとして使用
    }


    // キャラクターが削除されるときに杖も削除
    ExitStart() {


        // クリックイベントリスナーを削除
        document.removeEventListener('click', this.clickHandler);
        document.removeEventListener('wheel', this.mouseWheelHandler);
        document.removeEventListener('contextmenu', this.contextMenuHandler);  // 右クリック
        document.removeEventListener('mousedown', this.middleClickHandler);
        document.removeEventListener('mousedown', this.mouseDownHandler);
        document.removeEventListener('mouseup', this.mouseUpHandler);
        document.removeEventListener('mousemove', this.mouseMoveHandler);


        // 杖チェックインターバルをクリア
        if (this.staffCheckInterval) {
            clearInterval(this.staffCheckInterval);
            this.staffCheckInterval = null;
        }

        // 杖要素の存在チェック
        if (this.staffElement) {
            try {
                this.staffElement.style.transition = 'opacity 1s ease';
                this.staffElement.style.opacity = '0';

                setTimeout(() => {
                    try {
                        if (this.staffElement && document.body.contains(this.staffElement)) {
                            this.staffElement.parentNode.removeChild(this.staffElement);
                        }
                    } catch (error) {
                        // エラー時は静かに続行
                    } finally {
                        this.staffElement = null;  // 明示的に参照を解放
                    }
                }, 1000);
            } catch (error) {
                // エラーが発生した場合は直接削除を試みる
                if (this.staffElement && document.body.contains(this.staffElement)) {
                    try {
                        this.staffElement.parentNode.removeChild(this.staffElement);
                    } catch (removeErr) {
                        // 静かに失敗
                    } finally {
                        this.staffElement = null;
                    }
                }
            }
        }

        // 攻撃オブジェクトをすべて非アクティブ化
        this.attacks.forEach(attack => {
            if (attack && typeof attack.deactivate === 'function') {
                attack.deactivate();
            }
        });
        this.attacks = [];  // 攻撃配列をクリア

        // HPゲージも非表示にする
        if (this.playerHPGage) {
            this.playerHPGage.hide();
        }

        super.ExitStart();
    }

    /**
     * @desc 火球発射時の杖のエフェクトを生成
     * @param {Object} position - エフェクトを表示する位置 {x, y}
     */
    createCastEffect(position) {
        // 安全チェック - 親要素が存在しない場合は処理しない
        if (!this.element) {
            return;
        }

        if (!document.body.contains(this.element)) {
            return;
        }

        const parentElement = this.element.parentElement;
        if (!parentElement) {
            return;
        }

        try {
            const effect = document.createElement('div');
            effect.textContent = '✨';
            effect.style.position = 'absolute';
            effect.style.left = `${position.x}px`;
            effect.style.top = `${position.y}px`;
            effect.style.fontSize = '25px';
            effect.style.transform = 'translate(-50%, -50%)';
            effect.style.zIndex = '4';
            effect.style.opacity = '0';
            effect.classList.add('cast-effect');   // ★追加

            // ユニークIDを付与して追跡可能にする
            effect.id = `effect-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            parentElement.appendChild(effect);

            // エフェクトアニメーション
            setTimeout(() => {
                // 要素が存在するか確認
                if (!document.getElementById(effect.id)) return;

                effect.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-in-out';
                effect.style.opacity = '1';
                effect.style.transform = 'translate(-50%, -50%) scale(1.3)';

                setTimeout(() => {
                    // 要素が存在するか確認
                    if (!document.getElementById(effect.id)) return;

                    effect.style.opacity = '0';
                    effect.style.transform = 'translate(-50%, -50%) scale(0.5)';

                    setTimeout(() => {
                        const effectElement = document.getElementById(effect.id);
                        if (effectElement && effectElement.parentNode) {
                            effectElement.parentNode.removeChild(effectElement);
                        }
                    }, 300);
                }, 200);
            }, 10);
        } catch (error) {
            // エラー発生時は静かに続行
        }
    }

    addItem(DropItemData) {
        switch (DropItemData.type) {
            case "item":
                gameMain.Inventory.addItem(DropItemData.emoji);
                break;
            case "coin":
                this.playerstatus.coins += parseInt(DropItemData.value);
                break;
            case "hp": {
                let damage = parseInt(DropItemData.value);
                if (damage > 0) {
                    this.status.takeDamage(damage);
                } else {
                    this.status.heal(damage * -1);
                }
            }
                break;
            case "mp":
                this.status.mp += parseInt(DropItemData.value);
                break;


            case "maxHP":
                this.status.maxHP += parseInt(DropItemData.value);
                break;
            case "maxMP":
                this.status.maxMP += parseInt(DropItemData.value);
                break;
            case "mpregene":
                this.status.mpregene += parseFloat(DropItemData.value);
                break;
            case "difficulty":
                this.status.shopBuyCount += parseFloat(DropItemData.value);
                this.status.shopBuyCount = Math.max(0, this.status.shopBuyCount);
                break;

            case "attack":
                this.status.attack += parseInt(DropItemData.value);
                break;
            case "deffence":
                this.status.deffence += parseFloat(DropItemData.value);
                break;
            case "MaxSpeed":
                this.status.MaxSpeed += parseFloat(DropItemData.value);
                this.MaxSpeed = this.status.MaxSpeed;
                break;


            case "attackPierceCount":
                this.status.attackPierceCount += parseInt(DropItemData.value);
                break;
            case "HomingRadius":
                this.status.HomingRadius += parseInt(DropItemData.value);
                break;
            case "HomingPower":
                this.status.HomingPower += parseInt(DropItemData.value);
                break;
            case "AddLifeTime":
                this.status.AddLifeTime += parseInt(DropItemData.value);
                break;

            case "FireCnt":
                for (let i = 0; i < parseInt(DropItemData.value); i++) {
                    this.status.addMagicLevelUp();
                }
                break;


            case "AddMaxSpeed":
                this.status.AddMaxSpeed += parseInt(DropItemData.value);
                break;
            case "UseMP":
                this.status.UseMP += parseInt(DropItemData.value);
                break;

            case "MagicName":
                this.SetMagic(DropItemData.value);
                break;

            case "shoplevel":
                this.playerstatus.shoplevel = parseInt(DropItemData.value);
                break;
            case "shopcost":
                this.playerstatus.shopcost += parseInt(DropItemData.value);
                break;


            case "RegistFIREBALL":
                this.status.RegistFIREBALL += parseFloat(DropItemData.value);
                break;
            case "RegistICE":
                this.status.RegistICE += parseFloat(DropItemData.value);
                break;
            case "RegistLIGHTNING":
                this.status.RegistLIGHTNING += parseFloat(DropItemData.value);
                break;
            case "RegistTORNADO":
                this.status.RegistTORNADO += parseFloat(DropItemData.value);
                break;
            case "RegistMETEOR":
                this.status.RegistMETEOR += parseFloat(DropItemData.value);
                break;
            case "RegistEXPLOSION":
                this.status.RegistEXPLOSION += parseFloat(DropItemData.value);
                break;
            case "RegistGUST":
                this.status.RegistGUST += parseFloat(DropItemData.value);
                break;
            case "RegistBUBBLE":
                this.status.RegistBUBBLE += parseFloat(DropItemData.value);
                break;
            case "RegistRAINBOW":
                this.status.RegistRAINBOW += parseFloat(DropItemData.value);
                break;
            case "RegistWEB":
                this.status.RegistWEB += parseFloat(DropItemData.value);
                break;
            case "RegistPOISONSTING":
                this.status.RegistPOISONSTING += parseFloat(DropItemData.value);
                break;
            case "RegistSWORDSLASH":
                this.status.RegistSWORDSLASH += parseFloat(DropItemData.value);
                break;
            case "RegistGREATAxe":
                this.status.RegistGREATAxe += parseFloat(DropItemData.value);
                break;
            case "RegistHAMMERCRUSH":
                this.status.RegistHAMMERCRUSH += parseFloat(DropItemData.value);
                break;
            case "RegistTRIDENTTHRUST":
                this.status.RegistTRIDENTTHRUST += parseFloat(DropItemData.value);
                break;
            case "RegistSHIELDBASH":
                this.status.RegistSHIELDBASH += parseFloat(DropItemData.value);
                break;

        }
    }


    /**
     * プレイヤークリックイベント処理
     * @param {MouseEvent} evt - クリックイベント
     */
    onPlayerClick(evt) {
        // プレイヤーのHPが0以下なら攻撃できない


        //console.log("Fire!! 00");
        if (!this.IsActive) {
            return;
        }


        //console.log("Fire!! 01");
        if (this.status.hp <= 0) {
            return;
        }

        //console.log("Fire!! 02");

        // 発射処理…
        try {
            // 杖の位置から FireBall を生成
            // より堅牢な杖の存在チェック
            if (!this.staffElement) {
                this.createStaffElement();
                this.updateStaffPosition();
            }

            if (!document.body.contains(this.staffElement)) {
                this.createStaffElement();
                this.updateStaffPosition();
            }

            //console.log("Fire!! 04");
            const staffPos = this.getStaffPosition();
            if (!staffPos) {
                return;
            }

            //console.log("Fire!! 05");
            // マウスの向いている方に撃つ
            // 発射方向を解放


            this.Fire(this.status.FireCnt1, this.status.FireCnt2, staffPos);


            this.createCastEffect(staffPos);
        } catch (error) {
        }
    }


    onMouseWheel(evt) {
        if (!this.IsActive) return;


        if (this.pressedKeys['run']) {
            if (evt.deltaY < 0) {
                this.status.AttackdirRatio += 0.1;

            } else {
                this.status.AttackdirRatio -= 0.1;
            }
            this.status.AttackdirRatio = Math.max(0, Math.min(2, this.status.AttackdirRatio));
        } else {


            if (evt.deltaY < 0) {
                // 上スクロール（マジックインデックスを1つ前へ）
                this.lastPressedMagicIndex--;
            } else {
                // 下スクロール（マジックインデックスを1つ後へ）
                this.lastPressedMagicIndex++;
            }

            // 配列サイズに応じてインデックスを循環
            const len = this.playerstatus.HasMagics.length;
            if (len > 0) {
                this.lastPressedMagicIndex = (this.lastPressedMagicIndex + len) % len;
                this.SetMagic(this.playerstatus.HasMagics[this.lastPressedMagicIndex]);
            }

        }
    }

    onRightClick(evt) {
        evt.preventDefault(); // ブラウザの右クリックメニューを防ぐ

        if (!this.IsActive) return;

        console.log('Right Clicked');
        // 例：防御行動や魔法キャンセル処理など
    }

    onMouseDown(evt) {
        if (!this.IsActive) return;

        if (evt.button === 1) { // 中クリック
            console.log('Middle Clicked');
            // 例：全魔法の中からランダム選択とか
        }
    }

    getItemCount(emoji) {
        return gameMain.Inventory.getItemCount(emoji);
    }

    changeItemCount(emoji, delta) {
        if (emoji === "🪙") {
            this.playerstatus.addCoins(delta);
        } else {
            gameMain.Inventory.changeItemCount(emoji, delta);
        }
    }
}