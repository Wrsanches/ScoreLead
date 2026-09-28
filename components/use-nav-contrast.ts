"use client";

import { useEffect, type RefObject } from "react";

type Color = readonly [number, number, number, number];

/** Use the majority of visible controls to choose one color for the toolbar. */
export function useNavContrast(navRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const nav = navRef.current;
    const context = document.createElement("canvas").getContext("2d", {
      willReadFrequently: true,
    });
    if (!nav || !context) return;

    const colors = new Map<string, Color>();
    let frame = 0;

    function parseColor(value: string): Color {
      const cached = colors.get(value);
      if (cached) return cached;
      // Let the browser resolve modern CSS colors (including oklch) to sRGB.
      context!.clearRect(0, 0, 1, 1);
      context!.fillStyle = value;
      context!.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = context!.getImageData(0, 0, 1, 1).data;
      const color: Color = [r, g, b, a / 255];
      colors.set(value, color);
      return color;
    }

    function luminanceAt(x: number, y: number) {
      const rgb = [0, 0, 0];
      let remaining = 1;
      for (const element of document.elementsFromPoint(x, y)) {
        if (nav!.contains(element)) continue;
        const [r, g, b, alpha] = parseColor(
          getComputedStyle(element).backgroundColor,
        );
        rgb[0] += r * alpha * remaining;
        rgb[1] += g * alpha * remaining;
        rgb[2] += b * alpha * remaining;
        remaining *= 1 - alpha;
        if (remaining < 0.01) break;
      }
      const linear = rgb.map((value) => {
        const channel = value / 255;
        return channel <= 0.04045
          ? channel / 12.92
          : ((channel + 0.055) / 1.055) ** 2.4;
      });
      return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    }

    const opaque = window.matchMedia("(prefers-reduced-transparency: reduce)");
    const hasBlur =
      CSS.supports("backdrop-filter", "blur(1px)") ||
      CSS.supports("-webkit-backdrop-filter", "blur(1px)");

    function update() {
      frame = 0;
      if (document.hidden) return;
      // Radix disables page hit-testing while its select is open. Keep the
      // last measured colors until the underlying surfaces are available again.
      if (getComputedStyle(document.body).pointerEvents === "none") return;
      const items = nav!.querySelectorAll<HTMLElement>("[data-nav-contrast]");
      let visibleCount = 0;
      let lightCount = 0;
      items.forEach((item) => {
        const rect = item.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        visibleCount += 1;
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        // Average nearby surfaces to approximate the glass blur, with a small
        // dead band to prevent flicker at a moving light/dark boundary.
        const light =
          hasBlur && !opaque.matches
            ? (luminanceAt(x - 16, y) +
                luminanceAt(x, y) +
                luminanceAt(x + 16, y)) /
              3
            : 0;
        const threshold = item.dataset.navContrast === "light" ? 0.16 : 0.22;
        if (light > threshold) lightCount += 1;
      });

      // A strict majority selects dark ink; ties and empty toolbars use white.
      // Apply the decision together so individual controls never disagree.
      const contrast = lightCount > visibleCount / 2 ? "light" : "dark";
      items.forEach((item) => {
        if (item.dataset.navContrast !== contrast) {
          item.dataset.navContrast = contrast;
        }
      });
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    opaque.addEventListener("change", schedule);
    // The showcase moves even while the page is stationary. No React renders
    // are needed, and hidden tabs skip sampling entirely.
    const timer = window.setInterval(schedule, 200);
    return () => {
      cancelAnimationFrame(frame);
      clearInterval(timer);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      opaque.removeEventListener("change", schedule);
    };
  }, [navRef]);
}
