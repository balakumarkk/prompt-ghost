import type { PlasmoCSConfig } from "plasmo"
import { initGhostController } from "./utils/ghostController"
import "./content.css"

export const config: PlasmoCSConfig = {
  matches: [
    "https://chatgpt.com/*",
    "https://claude.ai/*",
    "https://gemini.google.com/*",
    "http://localhost/*",
    "http://127.0.0.1/*"
  ]
}

// Bootstrap the ghost controller
initGhostController()
