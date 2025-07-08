import {Character} from "../Base/Character.js";

import {Wizard} from "../Character/Wizard.js";

import {CollisionType, Pawn} from "../Base/Pawn.js";
import {MoveBase} from "../Base/MoveBase.js";
import { MagicDataTable } from '../Utils/DataTable.js';
import {SceneManagerInstance} from "../Scene/SceneManager.js";


export class MagicBase extends Character {
    
    constructor(x, y, MagicData, parent,caster ) {
        
        super(x, y, 0.5, MagicData.emoji, parent);

        this.setMagicData(MagicData);
        
        this.setCollisionType(CollisionType.TRIGGER);

        this.vx = 0;  // px/s
        this.vy = 0;
        
        this.moveBase = new MoveBase(this);

        this.teamId  = caster?.teamId ?? 'neutral';   // ★追加
        
        this.owner = null;
        this.HomingTarget = []; // ← constructorで初期化しておく
        this.HomingTargetCurrent = null;

        SceneManagerInstance.audio.playSE('fire');
    }
    setOwner(owner) {
        this.owner = owner;

        // Statusから参照
        this.addAttack = this.owner.status.attack;
        this.attackPierceCount = this.owner.status.attackPierceCount;
        this.HomingRadius = this.owner.status.HomingRadius;
        this.HomingPower = this.owner.status.HomingPower;
        this.AddLifeTime = this.owner.status.AddLifeTime;
        this.addMaxSpeed = this.owner.status.AddMaxSpeed;


        
        this.MagicData.lifeTime += this.AddLifeTime;
        this.MaxSpeed +=this.addMaxSpeed;

        if(this.HomingPower>0){
            
            this.HormingHitPawn = new Pawn(this.x,this.y,"",100,this.parentElement);
            this.HormingHitPawn.setPosition(this.x,this.y);
    
            this.HormingHitPawn.setCollisionType(CollisionType.TRIGGER);
            
            this.HormingHitPawn.setSize(this.HomingRadius);
            this.HormingHitPawn.TriggerBegin = (other) => {
    
                if(other === this.owner) return;
                
                // backgroundだったら
                if(!other.status) return;
                if(this.emoji === other.emoji) return;
                if(this.HomingTarget.includes(other)) return;


                if (other instanceof MagicBase) return;

                /*
                {
                    import {EnemyBase} from "../Character/EnemyBase.js";
                    // エネミーだったら
                    if (this.owner instanceof EnemyBase){
                        if (other instanceof EnemyBase) return;
                    }
                }
                */
                
                // プレイヤーだったら
                if (this.owner instanceof Wizard){
                    if (other instanceof Wizard) return;
                }
                
                console.log("Homing!! HomingTargetCurrentに代入 = "+other.emoji +" HomingRadius = "+this.HomingRadius);
                
                
                
                
                
                this.HomingTarget.push(other);
                if(this.HomingTargetCurrent == null){
                    this.HomingTargetCurrent = other;
                }
            }
    

        }
    }

    TriggerBegin(other) {
        super.TriggerBegin(other);
        
        if(other === this.owner) return;
        if(this.emoji === other.emoji) return;

        // キャラクター出ない時除外
        if(!other.status) return;
        // todo : backgroundだったときどうするか…
        
        other.takeDamage?.(this.MagicData,this.addAttack);
        
        
        // 一度当たったらターゲットしない
        this.HomingTargetCurrent = null;

        //　あたっても消えない回数チェック
        this.attackPierceCount-=1;
        
        if(this.attackPierceCount<=0){
            this.MagicData.lifeTime = 0;
        }
    }

    update(delta) {
        super.update(delta);

        if(this.HormingHitPawn){
            this.HormingHitPawn.setPosition(this.x,this.y);
        }
        

        if (!this.MagicData || this.isFadingOut) return;

        this.Homing(delta);
        
        this.MagicData.lifeTime -= delta;
        if (this.MagicData.lifeTime <= 0) {
            this.ExitStart();
            if(this.HormingHitPawn) {
                this.HormingHitPawn.ExitStart()
            }
            return;
        }


        this.moveBase.moveUpdate(delta);
    }


    setMagicData(MagicData) {
        //this.MagicData = MagicData;
        
        if(!this.MagicData){

            this.MagicData = new MagicDataTable(
                MagicData.id,
                MagicData.emoji,
                MagicData.useMP,
                MagicData.maxSpeed,
                MagicData.lifeTime,
                MagicData.damage,
                MagicData.InfoText);
        }

        this.MagicData.id = MagicData.id;
        this.MagicData.emoji = MagicData.emoji;
        this.MagicData.useMP = MagicData.useMP;
        this.MagicData.maxSpeed = MagicData.maxSpeed;
        this.MagicData.lifeTime = MagicData.lifeTime;
        this.MagicData.damage = MagicData.damage;
        this.MagicData.InfoText = MagicData.InfoText;


        this.MaxSpeed = this.MagicData.maxSpeed;
        
    }

    Homing(delta) {
        if (!this.HomingTargetCurrent || this.HomingPower <= 0){
            //console.log("Homing!! HomingTargetCurrent is null");
            return;
        } 

        // 目標の角度
        const dx = this.HomingTargetCurrent.x - this.x;
        const dy = this.HomingTargetCurrent.y - this.y;
        const targetAngle  = Math.atan2(dy, dx);
        const currentAngle = this.radian;

        // 角度差を -π〜π に正規化
        let diff = targetAngle - currentAngle;
        while (diff >  Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;

        // 旋回限界
        const maxTurn = this.HomingPower * delta;
        const newAngle = currentAngle + Math.max(-maxTurn, Math.min(maxTurn, diff));

        //console.log("Homing!! HomingTargetCurrentにほーみんぐしてる　"+newAngle +" "+this.HomingTargetCurrent.emoji);
        this.setDir(newAngle);          // ← ここで一括更新！
    }
}