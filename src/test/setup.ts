import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => cleanup());

class TestResizeObserver implements ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = TestResizeObserver;

Object.defineProperty(globalThis, "scrollTo", {
  configurable: true,
  value: () => undefined,
});

if (!globalThis.PointerEvent) {
  globalThis.PointerEvent = MouseEvent as typeof PointerEvent;
}

Object.defineProperties(HTMLElement.prototype, {
  hasPointerCapture: { value: () => false },
  releasePointerCapture: { value: () => undefined },
  scrollIntoView: { value: () => undefined },
});
