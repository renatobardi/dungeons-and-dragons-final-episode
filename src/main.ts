import { Game } from "./game";

declare global {
  interface Window {
    __game?: Game["hooks"];
  }
}

const canvas = document.getElementById("game") as HTMLCanvasElement;
const game = new Game(canvas);
// test/measurement hooks are not part of the shipped experience: dev server or an explicit ?debug flag only
if (import.meta.env.DEV || new URLSearchParams(location.search).has("debug")) window.__game = game.hooks;
void game.init();
