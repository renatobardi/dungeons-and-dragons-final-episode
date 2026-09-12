import { Engine } from "@babylonjs/core/Engines/engine";
import { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
// Engine capabilities are opt-in with ES module imports; both backends need the same set.
import "@babylonjs/core/Engines/WebGPU/Extensions/engine.alpha";
import "@babylonjs/core/Engines/WebGPU/Extensions/engine.dynamicTexture";
import "@babylonjs/core/Engines/WebGPU/Extensions/engine.multiRender";
import "@babylonjs/core/Engines/WebGPU/Extensions/engine.rawTexture";
import "@babylonjs/core/Engines/WebGPU/Extensions/engine.readTexture";
import "@babylonjs/core/Engines/WebGPU/Extensions/engine.renderTarget";
import "@babylonjs/core/Engines/WebGPU/Extensions/engine.renderTargetTexture";
import "@babylonjs/core/Engines/WebGPU/Extensions/engine.query";
import "@babylonjs/core/Engines/Extensions/engine.alpha";
import "@babylonjs/core/Engines/Extensions/engine.dynamicTexture";
import "@babylonjs/core/Engines/Extensions/engine.multiRender";
import "@babylonjs/core/Engines/Extensions/engine.rawTexture";
import "@babylonjs/core/Engines/Extensions/engine.readTexture";
import "@babylonjs/core/Engines/Extensions/engine.renderTarget";
import "@babylonjs/core/Engines/Extensions/engine.renderTargetTexture";
import "@babylonjs/core/Engines/Extensions/engine.query";

export type Backend = "webgpu" | "webgl2";

export interface CreatedEngine {
  engine: AbstractEngine;
  backend: Backend;
}

/** WebGPU when the browser offers it, WebGL2 otherwise. The fallback is logged so measurements record the real backend. */
export async function createEngine(canvas: HTMLCanvasElement): Promise<CreatedEngine> {
  if (await WebGPUEngine.IsSupportedAsync) {
    try {
      const engine = new WebGPUEngine(canvas, { antialias: true, adaptToDeviceRatio: false });
      await engine.initAsync();
      return { engine, backend: "webgpu" };
    } catch (err) {
      console.warn("[engine] WebGPU init failed, falling back to WebGL2", err);
    }
  }
  const engine = new Engine(canvas, true, { adaptToDeviceRatio: false, powerPreference: "high-performance" });
  console.info("[engine] backend: webgl2");
  return { engine, backend: "webgl2" };
}
