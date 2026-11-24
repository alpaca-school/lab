"use strict";

(() => {
  const state = {
    muted: false,
    audioContext: null
  };

  function syncVisualViewport() {
    const vv = window.visualViewport;
    if (vv && Math.abs((vv.scale || 1) - 1) > 0.01) return;
    const height = vv ? vv.height : window.innerHeight;
    if (!height) return;
    document.documentElement.style.setProperty("--app-height", Math.round(height) + "px");
  }

  function resetReadingScroll(screen) {
    if (!screen) return;
    const scroller = screen.querySelector("[data-reading-scroll]");
    if (scroller) scroller.scrollTop = 0;
    screen.scrollTop = 0;
  }

  function showScreen(id) {
    const next = document.getElementById(id);
    if (!next) throw new Error("Unknown screen: " + id);

    document.querySelectorAll("[data-screen]").forEach((screen) => {
      screen.classList.toggle("active", screen === next);
    });

    resetReadingScroll(next);

    requestAnimationFrame(() => {
      const heading = next.querySelector("h1,h2,[tabindex='-1']");
      if (heading && typeof heading.focus === "function") {
        heading.focus({ preventScroll: true });
      }
    });
  }

  function appendRubyNodes(parent, text) {
    const pattern = /([\u3040-\u30ff\u3400-\u9fff々〆ヵヶー]+)《([^》\n]+)》/g;
    let cursor = 0;
    let match;

    while ((match = pattern.exec(text)) !== null) {
      if (match.index > cursor) {
        parent.appendChild(document.createTextNode(text.slice(cursor, match.index)));
      }

      const ruby = document.createElement("ruby");
      ruby.appendChild(document.createTextNode(match[1]));
      const rt = document.createElement("rt");
      rt.textContent = match[2];
      ruby.appendChild(rt);
      parent.appendChild(ruby);

      cursor = match.index + match[0].length;
    }

    if (cursor < text.length) {
      parent.appendChild(document.createTextNode(text.slice(cursor)));
    }
  }

  function renderRubyText(element, text, options = {}) {
    if (!element) return;
    element.replaceChildren();

    const container = options.budoux
      ? document.createElement("budoux-ja")
      : document.createDocumentFragment();

    String(text ?? "").split("\n").forEach((line, index) => {
      if (index > 0) container.appendChild(document.createElement("br"));
      appendRubyNodes(container, line);
    });

    element.appendChild(container);
  }

  function getAudioContext() {
    if (state.audioContext) return state.audioContext;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    state.audioContext = new AudioContextClass();
    return state.audioContext;
  }

  function beep(kind = "tap") {
    if (state.muted) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const frequencies = {
      tap: 420,
      start: 520,
      success: 660,
      error: 190
    };

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = kind === "error" ? "sawtooth" : "sine";
    osc.frequency.setValueAtTime(frequencies[kind] || frequencies.tap, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  function toggleMute(button) {
    state.muted = !state.muted;

    if (button) {
      button.setAttribute("aria-pressed", String(state.muted));
      button.setAttribute("aria-label", state.muted ? "音をオンにする" : "音をオフにする");
      const icon = button.querySelector("[aria-hidden='true']");
      if (icon) icon.textContent = state.muted ? "🔇" : "🔊";
    }

    if (!state.muted) beep("tap");
    return state.muted;
  }

  function registerServiceWorker(path = "./sw.js") {
    if (!("serviceWorker" in navigator)) return;
    window.addEventListener("load", () => {
      navigator.serviceWorker.register(path).catch((error) => {
        console.warn("Service worker registration skipped:", error);
      });
    }, { once: true });
  }


  function isFullyVisible(element, padding = 0) {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    const vv = window.visualViewport;
    const width = vv ? vv.width : window.innerWidth;
    const height = vv ? vv.height : window.innerHeight;
    return rect.left >= padding && rect.top >= padding &&
      rect.right <= width - padding && rect.bottom <= height - padding;
  }

  function elementsOverlap(a, b, padding = 0) {
    if (!a || !b) return false;
    const A = a.getBoundingClientRect();
    const B = b.getBoundingClientRect();
    return !(
      A.right + padding <= B.left ||
      B.right + padding <= A.left ||
      A.bottom + padding <= B.top ||
      B.bottom + padding <= A.top
    );
  }

  function watchCollisions(pairs = [], onCollision) {
    const check = () => {
      pairs.forEach(([a, b, padding = 0]) => {
        const left = typeof a === "string" ? document.querySelector(a) : a;
        const right = typeof b === "string" ? document.querySelector(b) : b;
        if (elementsOverlap(left, right, padding) && typeof onCollision === "function") {
          onCollision(left, right);
        }
      });
    };
    const schedule = () => requestAnimationFrame(() => requestAnimationFrame(check));
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true });
    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("orientationchange", schedule, { passive: true });
    schedule();
    return () => observer.disconnect();
  }

  function init() {
    syncVisualViewport();

    window.addEventListener("resize", syncVisualViewport, { passive: true });
    window.addEventListener("orientationchange", () => {
      window.setTimeout(syncVisualViewport, 120);
    }, { passive: true });

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", syncVisualViewport, { passive: true });
    }
  }

  window.LabCore = Object.freeze({
    init,
    showScreen,
    renderRubyText,
    beep,
    toggleMute,
    registerServiceWorker,
    syncVisualViewport,
    isFullyVisible,
    elementsOverlap,
    watchCollisions
  });
})();
