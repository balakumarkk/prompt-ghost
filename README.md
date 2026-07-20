# Prompt Ghost 👻

Prompt Ghost is a premium, developer-focused Chrome MV3 browser extension that brings inline ghost-text autocomplete suggestions directly to your favorite LLM chat interfaces (such as ChatGPT, Claude, and Gemini). 

Powered by **Plasmo**, **React**, and **Material-UI**, it connects seamlessly to LLM completion APIs (Groq, OpenAI, Anthropic, and Custom OpenAI-compatible endpoints) to complete your thoughts as you type.

---

## ✨ Features

- **Multi-Provider Autocompletion**: Out-of-the-box support for Groq, OpenAI, Anthropic (Claude), and any custom OpenAI-compatible API endpoints.
- **Smart Request Aborting**: Uses an abort controller mapped to the active tab ID. If you type a new character before the previous suggestion resolves, the pending network request is aborted instantly, preventing lag or overlapping suggestion overlays.
- **Global Event Delegation**: Catches events like `input`, `keydown`, `focus`, and `blur` globally on the document to avoid re-rendering bugs or listeners dropping on complex Single Page Applications (SPAs).
- **Dual Element Injectors**:
  - **Textarea Mirror Overlay**: Creates a synchronized absolute overlay on top of standard `<textarea>` boxes. Dynamically replicates dimensions, fonts, line-heights, scrolls, and margins, updating via `ResizeObserver`.
  - **Contenteditable Caret Overlay**: Measures precise cursor caret coordinates dynamically using standard Selection & Range APIs to position an absolute floating suggestion overlay. This keeps suggestions external to the editor DOM, preventing rich text frameworks (like ProseMirror, Lexical, Slate) from intercepting and auto-filling the input fields.
- **Premium dark-themed popup UI**: A Material-UI (MUI) options panel featuring interactive provider configuration, masked API key inputs, custom base URL overrides, and live extension status checking.

---

## 🛠️ Tech Stack & Configuration

- **Extension Framework**: [Plasmo v0.90.5](https://docs.plasmo.com/) (Chrome MV3)
- **UI Library**: [Material-UI (MUI)](https://mui.com/) (`@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`)
- **State & Storage**: `@plasmohq/storage` (synchronized extension storage between UI elements and background scripts)
- **Language**: TypeScript + React 18 (TSX)

---

## 📂 Directory Structure

All source code is isolated inside the `src/` directory to maintain a clean project structure:

```
prompt-ghost
├── package.json
├── tsconfig.json              # Configured to resolve ~* to "./src/*"
├── assets/                    # Extension icons and assets
└── src/
    ├── popup.tsx              # React dark-themed options popup UI using MUI
    ├── background.ts          # Service Worker routing completions & handling abort requests
    ├── content.ts             # 16-line entry content script matching chat domains
    ├── content.css            # Autocomplete suggestion styling
    └── utils/
        ├── textareaOverlay.ts      # Logic to mirror textareas & sync scrolls/resize
        ├── contenteditableGhost.ts # Absolute floating suggestion overlays at caret coordinates
        ├── ghostController.ts      # Global event listeners & storage sync orchestrator
        └── llm/                    # Provider-agnostic API adapters
            ├── llmClient.ts         # Dynamic LLM routing client
            └── providers/
                ├── groq.ts          # Groq completion adapter
                ├── openai.ts        # OpenAI completion adapter
                ├── anthropic.ts     # Anthropic completion adapter
                └── custom.ts        # Custom OpenAI-compatible adapter
```

---

## 🚀 Getting Started

### 1. Install Dependencies

Use your preferred package manager (e.g., `npm` or `pnpm`):

```bash
pnpm install
# or
npm install
```

### 2. Start the Development Server

To start local development and hot-reloading:

```bash
pnpm dev
# or
npm run dev
```

### 3. Load the Extension in Chrome

1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked** and select the build folder:
   - Path: `prompt-ghost/build/chrome-mv3-dev`
4. Open the extension popup from your toolbar, input your preferred API key, select a model, and head to [ChatGPT](https://chatgpt.com), [Claude](https://claude.ai), or [Gemini](https://gemini.google.com) to see the suggestions in action!

---

## 📦 Production Builds & Deployment

### Make a Production Bundle

To build a minimized production-ready bundle:

```bash
pnpm build
# or
npm run build
```

This creates a production zip/bundle in `build/chrome-mv3-prod`, ready to be uploaded to the Chrome Web Store.

### Automated Submission

The extension is set up to easily integrate with the [bpp (Browser Extension Publisher)](https://bpp.browser.market) GitHub action. Simply publish a first draft manually, then follow [Plasmo's Submit Guidelines](https://docs.plasmo.com/framework/workflows/submit) to automate deployments.

---

## 📜 License

MIT License. See local files for details.
