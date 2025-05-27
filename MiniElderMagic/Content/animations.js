// animations.js
// ------------------------------------------------------------
// Animation library: register animation snippets and runtime functions
// Exports AnimationLib { D, animations }
// ------------------------------------------------------------
(function (global){
    'use strict';

    // 基準アニメ時間 [ms]
    const D = 600;
    const animations = [];

    /* ========================================================================
       Fade
       ======================================================================*/
    const fadeKey   = 'fade';
    const fadeLabel = 'Fade';
    const fadeCode  =
        `FadeAnimation(){
  const Time = 2;
  this.element.style.transition = 'opacity '+Time+'s ease, transform '+Time+'s ease';
  this.element.style.opacity    = '0';
  this.element.style.transform  = 'scale(0)';
  setTimeout(()=>this.OnExitAnime('Fade'), Time*1000);
}`;
    function fade(el, schedule){
        el.style.transition = `opacity ${D}ms ease`;
        el.style.opacity    = '0';
        schedule(fadeKey);
    }
    animations.push({ key: fadeKey, label: fadeLabel, code: fadeCode, func: fade });

    /* ========================================================================
       Jelly
       ======================================================================*/
    const jellyKey   = 'jelly';
    const jellyLabel = 'Jelly';
    const jellyCode  =
        `JellyAnimation(){
  const Time = 2;
  this.element.style.transition = 'transform '+Time+'s cubic-bezier(.25,1.7,.7,1.3)';
  this.element.style.transform  = 'scale(.8,1.1)';
  setTimeout(()=>this.OnExitAnime('Jelly'), Time*1000);
}`;
    function jelly(el, schedule){
        el.style.transition = `transform ${D}ms cubic-bezier(.25,1.7,.7,1.3)`;
        el.style.transform  = 'translate(-50%,-50%) scale(.8,1.1)';
        schedule(jellyKey);
    }
    animations.push({ key: jellyKey, label: jellyLabel, code: jellyCode, func: jelly });

    /* ========================================================================
       Spin
       ======================================================================*/
    const spinKey   = 'spin';
    const spinLabel = 'Spin';
    const spinCode  =
        `SpinAnimation(){
  const Time = 2;
  this.element.style.transition = 'transform '+Time+'s linear';
  this.element.style.transform  = 'rotate(360deg)';
  setTimeout(()=>this.OnExitAnime('Spin'), Time*1000);
}`;
    function spin(el, schedule){
        el.style.transition = `transform ${D}ms linear`;
        el.style.transform  = 'translate(-50%,-50%) rotate(360deg)';
        schedule(spinKey);
    }
    animations.push({ key: spinKey, label: spinLabel, code: spinCode, func: spin });

    /* ========================================================================
       Pulse
       ======================================================================*/
    const pulseKey   = 'pulse';
    const pulseLabel = 'Pulse';
    const pulseCode  =
        `PulseAnimation(){
  const Time = 2;
  this.element.style.transition = 'transform '+Time+'s ease, filter '+Time+'s ease';
  this.element.style.transform  = 'scale(1.3)';
  this.element.style.filter     = 'brightness(2)';
  setTimeout(()=>this.OnExitAnime('Pulse'), Time*1000);
}`;
    function pulse(el, schedule){
        el.style.transition = `transform ${D}ms ease, filter ${D}ms ease`;
        el.style.transform  = 'translate(-50%,-50%) scale(1.3)';
        el.style.filter     = 'brightness(2)';
        schedule(pulseKey);
    }
    animations.push({ key: pulseKey, label: pulseLabel, code: pulseCode, func: pulse });

    /* ========================================================================
       Bounce
       ======================================================================*/
    const bounceKey   = 'bounce';
    const bounceLabel = 'Bounce';
    const bounceCode  =
        `BounceAnimation(){
  const Time = 2;
  this.element.style.transition = 'transform '+Time+'s cubic-bezier(.34,1.56,.64,1)';
  this.element.style.transform  = 'translateY(-40px)';
  setTimeout(()=>this.OnExitAnime('Bounce'), Time*1000);
}`;
    function bounce(el, schedule){
        el.style.transition = `transform ${D}ms cubic-bezier(.34,1.56,.64,1)`;
        el.style.transform  = 'translate(-50%,-90%)';
        schedule(bounceKey);
    }
    animations.push({ key: bounceKey, label: bounceLabel, code: bounceCode, func: bounce });

    /* ========================================================================
       Shake
       ======================================================================*/
    const shakeKey   = 'shake';
    const shakeLabel = 'Shake';
    const shakeCode  =
        `ShakeAnimation(){
  const Time = 0.5;
  this.element.style.transition = 'transform '+Time+'s ease';
  this.element.style.transform  = 'translateX(10px)';
  setTimeout(()=>this.OnExitAnime('Shake'), Time*1000);
}`;
    function shake(el, schedule){
        el.style.transition = `transform ${D/2}ms ease`;
        el.style.transform  = 'translate(-45%,-50%)';
        schedule(shakeKey);
    }
    animations.push({ key: shakeKey, label: shakeLabel, code: shakeCode, func: shake });

    /* ========================================================================
       FlipX
       ======================================================================*/
    const flipXKey   = 'flipX';
    const flipXLabel = 'Flip X';
    const flipXCode  =
        `FlipXAnimation(){
  const Time = 2;
  this.element.style.transition = 'transform '+Time+'s ease';
  this.element.style.transform  = 'rotateX(180deg)';
  setTimeout(()=>this.OnExitAnime('FlipX'), Time*1000);
}`;
    function flipX(el, schedule){
        el.style.transition = `transform ${D}ms ease`;
        el.style.transform  = 'translate(-50%,-50%) rotateX(180deg)';
        schedule(flipXKey);
    }
    animations.push({ key: flipXKey, label: flipXLabel, code: flipXCode, func: flipX });

    /* ========================================================================
       FlipY
       ======================================================================*/
    const flipYKey   = 'flipY';
    const flipYLabel = 'Flip Y';
    const flipYCode  =
        `FlipYAnimation(){
  const Time = 2;
  this.element.style.transition = 'transform '+Time+'s ease';
  this.element.style.transform  = 'rotateY(180deg)';
  setTimeout(()=>this.OnExitAnime('FlipY'), Time*1000);
}`;
    function flipY(el, schedule){
        el.style.transition = `transform ${D}ms ease`;
        el.style.transform  = 'translate(-50%,-50%) rotateY(180deg)';
        schedule(flipYKey);
    }
    animations.push({ key: flipYKey, label: flipYLabel, code: flipYCode, func: flipY });

    /* ========================================================================
       ZoomIn
       ======================================================================*/
    const zoomInKey   = 'zoomIn';
    const zoomInLabel = 'Zoom In';
    const zoomInCode  =
        `ZoomInAnimation(){
  const Time = 2;
  this.element.style.transition = 'transform '+Time+'s ease';
  this.element.style.transform  = 'scale(1.6)';
  setTimeout(()=>this.OnExitAnime('ZoomIn'), Time*1000);
}`;
    function zoomIn(el, schedule){
        el.style.transition = `transform ${D}ms ease`;
        el.style.transform  = 'translate(-50%,-50%) scale(1.6)';
        schedule(zoomInKey);
    }
    animations.push({ key: zoomInKey, label: zoomInLabel, code: zoomInCode, func: zoomIn });

    /* ========================================================================
       ZoomOut
       ======================================================================*/
    const zoomOutKey   = 'zoomOut';
    const zoomOutLabel = 'Zoom Out';
    const zoomOutCode  =
        `ZoomOutAnimation(){
  const Time = 2;
  this.element.style.transition = 'transform '+Time+'s ease';
  this.element.style.transform  = 'scale(0.4)';
  setTimeout(()=>this.OnExitAnime('ZoomOut'), Time*1000);
}`;
    function zoomOut(el, schedule){
        el.style.transition = `transform ${D}ms ease`;
        el.style.transform  = 'translate(-50%,-50%) scale(0.4)';
        schedule(zoomOutKey);
    }
    animations.push({ key: zoomOutKey, label: zoomOutLabel, code: zoomOutCode, func: zoomOut });

    /* ========================================================================
       SlideLeft
       ======================================================================*/
    const slideLKey   = 'slideLeft';
    const slideLLabel = 'Slide Left';
    const slideLCode  =
        `SlideLeftAnimation(){
  const Time = 2;
  this.element.style.transition = 'transform '+Time+'s ease-out';
  this.element.style.transform  = 'translateX(-150%)';
  setTimeout(()=>this.OnExitAnime('SlideLeft'), Time*1000);
}`;
    function slideLeft(el, schedule){
        el.style.transition = `transform ${D}ms ease-out`;
        el.style.transform  = 'translate(-150%,-50%)';
        schedule(slideLKey);
    }
    animations.push({ key: slideLKey, label: slideLLabel, code: slideLCode, func: slideLeft });

    /* ========================================================================
       SlideRight
       ======================================================================*/
    const slideRKey   = 'slideRight';
    const slideRLabel = 'Slide Right';
    const slideRCode  =
        `SlideRightAnimation(){
  const Time = 2;
  this.element.style.transition = 'transform '+Time+'s ease-out';
  this.element.style.transform  = 'translateX(150%)';
  setTimeout(()=>this.OnExitAnime('SlideRight'), Time*1000);
}`;
    function slideRight(el, schedule){
        el.style.transition = `transform ${D}ms ease-out`;
        el.style.transform  = 'translate(50%,-50%)';
        schedule(slideRKey);
    }
    animations.push({ key: slideRKey, label: slideRLabel, code: slideRCode, func: slideRight });

    /* ========================================================================
       Blur
       ======================================================================*/
    const blurKey   = 'blur';
    const blurLabel = 'Blur';
    const blurCode  =
        `BlurAnimation(){
  const Time = 2;
  this.element.style.transition = 'filter '+Time+'s ease';
  this.element.style.filter     = 'blur(6px)';
  setTimeout(()=>this.OnExitAnime('Blur'), Time*1000);
}`;
    function blur(el, schedule){
        el.style.transition = `filter ${D}ms ease`;
        el.style.filter     = 'blur(6px)';
        schedule(blurKey);
    }
    animations.push({ key: blurKey, label: blurLabel, code: blurCode, func: blur });

    /* ========================================================================
       Glow
       ======================================================================*/
    const glowKey   = 'glow';
    const glowLabel = 'Glow';
    const glowCode  =
        `GlowAnimation(){
  const Time = 2;
  this.element.style.transition = 'filter '+Time+'s ease';
  this.element.style.filter     = 'drop-shadow(0 0 15px #fff)';
  setTimeout(()=>this.OnExitAnime('Glow'), Time*1000);
}`;
    function glow(el, schedule){
        el.style.transition = `filter ${D}ms ease`;
        el.style.filter     = 'drop-shadow(0 0 15px #fff)';
        schedule(glowKey);
    }
    animations.push({ key: glowKey, label: glowLabel, code: glowCode, func: glow });

    /* ========================================================================
       Wobble
       ======================================================================*/
    const wobbleKey   = 'wobble';
    const wobbleLabel = 'Wobble';
    const wobbleCode  =
        `WobbleAnimation(){
  const Time = 2;
  this.element.style.transition = 'transform '+Time+'s ease-in-out';
  this.element.style.transform  = 'rotate(10deg)';
  setTimeout(()=>this.OnExitAnime('Wobble'), Time*1000);
}`;
    function wobble(el, schedule){
        el.style.transition = `transform ${D}ms ease-in-out`;
        el.style.transform  = 'translate(-50%,-50%) rotate(10deg)';
        schedule(wobbleKey);
    }
    animations.push({ key: wobbleKey, label: wobbleLabel, code: wobbleCode, func: wobble });

    // ------------------------------------------------------------
    // Export
    // ------------------------------------------------------------
    global.AnimationLib = { D, animations };
})(window);
