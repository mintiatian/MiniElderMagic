export class BaseAnime {

    constructor(emoji, parentElement) {

        this.parentElement = parentElement;
        this.emoji = emoji;
        this.element = document.createElement('div');
        this.element.style.zIndex   = '100';
    }

    OnExitAnime(Tag, Type) {
        //console.log("OnExitAnime : "+Type);
    }

    AnimationFade(Tag, Time) {
        this.element.style.transition = 'opacity ' + Time + 's ease, transform ' + Time + 's ease';
        this.element.style.opacity = '0';
        this.element.style.transform = 'scale(0)';
        setTimeout(() => this.OnExitAnime(Tag, 'Fade'), Time * 1000);
    }

    AnimationJelly(Tag, Time) {
        this.element.style.transition = 'transform ' + Time + 's cubic-bezier(.25,1.7,.7,1.3)';
        this.element.style.transform = 'scale(.8,1.1)';
        setTimeout(() => this.OnExitAnime(Tag, 'Jelly'), Time * 1000);
    }

    AnimationSpin(Tag, Time) {
        this.element.style.transition = 'transform ' + Time + 's linear';
        this.element.style.transform = 'rotate(360deg)';
        setTimeout(() => this.OnExitAnime(Tag, 'Spin'), Time * 1000);
    }

    AnimationPulse(Tag, Time) {
        const el = this.element;

        // keyframes を 1 回だけ注入
        if (!document.getElementById('pulse-keyframes')) {
            const style = document.createElement('style');
            style.id = 'pulse-keyframes';
            style.textContent = `
      @keyframes pulse {
        0%   { filter: brightness(1); }
        45%  { filter: brightness(2); }
        100% { filter: brightness(1); }
      }
    `;
            document.head.appendChild(style);
        }

        // アニメーション付与 – forwards で最後の 100% 状態を維持
        el.style.animation = `pulse ${Time}s ease forwards`;

        // 終了時に後始末＆コールバック
        const onEnd = () => {
            el.style.animation = '';              // スタイルをクリア（任意）
            this.OnExitAnime?.(Tag, 'Pulse');     // 既存のハンドラ呼び出し
            el.removeEventListener('animationend', onEnd);
        };
        el.addEventListener('animationend', onEnd, {once: true});
    }

    AnimationBounce(Tag, Time) {
        this.element.style.transition = 'transform ' + Time + 's cubic-bezier(.34,1.56,.64,1)';
        this.element.style.transform = 'translateY(-40px)';
        setTimeout(() => this.OnExitAnime(Tag, 'Bounce'), Time * 1000);
    }

    AnimationShake(Tag, Time) {
        this.element.style.transition = 'transform ' + Time + 's ease';
        this.element.style.transform = 'translateX(10px)';
        setTimeout(() => this.OnExitAnime(Tag, 'Shake'), Time * 1000);
    }

    AnimationFlipX(Tag, Time) {
        this.element.style.transition = 'transform ' + Time + 's ease';
        this.element.style.transform = 'rotateX(180deg)';
        setTimeout(() => this.OnExitAnime(Tag, 'FlipX'), Time * 1000);
    }

    AnimationFlipY(Tag, Time) {
        this.element.style.transition = 'transform ' + Time + 's ease';
        this.element.style.transform = 'rotateY(180deg)';
        setTimeout(() => this.OnExitAnime(Tag, 'FlipY'), Time * 1000);
    }

    AnimationZoomIn(Tag, Time) {
        this.element.style.transition = 'transform ' + Time + 's ease';
        this.element.style.transform = 'scale(1.6)';
        setTimeout(() => this.OnExitAnime(Tag, 'ZoomIn'), Time * 1000);
    }

    AnimationZoomOut(Tag, Time) {
        this.element.style.transition = 'transform ' + Time + 's ease';
        this.element.style.transform = 'scale(0.4)';
        setTimeout(() => this.OnExitAnime(Tag, 'ZoomOut'), Time * 1000);
    }

    AnimationSlideLeft(Tag, Time) {
        this.element.style.transition = 'transform ' + Time + 's ease-out';
        this.element.style.transform = 'translateX(-150%)';
        setTimeout(() => this.OnExitAnime(Tag, 'SlideLeft'), Time * 1000);
    }

    AnimationSlideRight(Tag, Time) {
        this.element.style.transition = 'transform ' + Time + 's ease-out';
        this.element.style.transform = 'translateX(150%)';
        setTimeout(() => this.OnExitAnime(Tag, 'SlideRight'), Time * 1000);
    }

    AnimationBlur(Tag, Time) {
        this.element.style.transition = 'filter ' + Time + 's ease';
        this.element.style.filter = 'blur(6px)';
        setTimeout(() => this.OnExitAnime(Tag, 'Blur'), Time * 1000);
    }

    AnimationGlow(Tag, Time) {
        this.element.style.transition = 'filter ' + Time + 's ease';
        this.element.style.filter = 'drop-shadow(0 0 15px #fff)';
        setTimeout(() => this.OnExitAnime(Tag, 'Glow'), Time * 1000);
    }

    showFloatingText(
        text,
        color = "white",
        durationMs = 1000,
        xOffset = 0,
        yOffset = -50,
        targetEl = this.element
    ) {
        // Lazy‑inject base style once
        if (!document.getElementById("floating-text-style")) {
            const style = document.createElement("style");
            style.id = "floating-text-style";
            style.textContent = `
      .floating-text {
        position: absolute;
        pointer-events: none;
        font-weight: 700;
        font-size: 20px;
        text-shadow: 0 0 4px rgba(0,0,0,.6);
        will-change: transform, opacity;
      }
    `;
            document.head.appendChild(style);
        }

        // Resolve the anchor element
        if (!targetEl) {
            // Common pattern inside classes: this.element (e.g., Character)
            if (this && this.element instanceof HTMLElement) {
                targetEl = this.element;
            } else if (this instanceof HTMLElement) {
                targetEl = this;
            }
        }

        // If still nothing, fall back to body centre
        const fallbackToScreenCentre = !targetEl;
        if (!targetEl) targetEl = document.body;

        // Measure anchor position in viewport
        const rect = targetEl.getBoundingClientRect();
        let anchorX = rect.left + rect.width / 2;
        let anchorY = rect.top + (fallbackToScreenCentre ? window.innerHeight / 2 : 0);

        // Create the floating node
        const node = document.createElement("span");
        node.className = "floating-text";
        node.textContent = text;
        node.style.color = color;

        // Initial position & state
        node.style.left = `${anchorX + xOffset}px`;
        node.style.top = `${anchorY + yOffset}px`;
        node.style.transform = "translate(-50%, 0)";
        node.style.opacity = "1";
        node.style.transition = `transform ${durationMs}ms ease-out, opacity ${durationMs}ms ease-out`;

        document.body.appendChild(node);

        // Trigger the animation on next frame
        requestAnimationFrame(() => {
            node.style.transform = "translate(-50%, -40px)"; // float up ~40px
            node.style.opacity = "0";
        });

        // Clean‑up after animation completes
        setTimeout(() => node.remove(), durationMs);
    }

}