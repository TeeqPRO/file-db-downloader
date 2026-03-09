
"use client";
import Script from "next/script";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    Gradient: any;
  }
}

export default function GradientBackground() {
  const gradientInitialized = useRef(false);
  const gradientRef = useRef<any>(null);

  const destroyGradient = () => {
    if (gradientRef.current?.disconnect) {
      gradientRef.current.disconnect();
    }
    gradientRef.current = null;
    gradientInitialized.current = false;
  };

  const initGradient = () => {
    if (gradientInitialized.current) return;
    
    // @ts-ignore
    if (!window.Gradient && typeof Gradient !== "undefined") {
      // @ts-ignore
      window.Gradient = Gradient;
    }

    if (window.Gradient) {
      const gradient = new window.Gradient();
      gradient.initGradient("#gradient-canvas");
      gradientRef.current = gradient;
      gradientInitialized.current = true;
    }
  };

  const restartGradient = () => {
    destroyGradient();
    requestAnimationFrame(() => {
      initGradient();
    });
  };

  useEffect(() => {
    const themeObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "attributes" && mutation.attributeName === "data-theme") {
          restartGradient();
          break;
        }
      }
    });

    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      themeObserver.disconnect();
      destroyGradient();
    };
  }, []);

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/gh/videsigns/webflow-tools@main/webgl-gradient.js"
        strategy="afterInteractive"
        onReady={() => initGradient()}
      />
      <canvas
        id="gradient-canvas"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full pointer-events-none"
      />
    </>
  );
}
