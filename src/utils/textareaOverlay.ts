let activeResizeObserver: ResizeObserver | null = null
let activeScrollHandler: (() => void) | null = null
let activeWindowScrollHandler: (() => void) | null = null

const PROPERTIES_TO_COPY = [
  "fontFamily",
  "fontSize",
  "fontWeight",
  "lineHeight",
  "fontStyle",
  "fontVariant",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "borderTopStyle",
  "borderRightStyle",
  "borderBottomStyle",
  "borderLeftStyle",
  "textAlign",
  "textIndent",
  "textTransform",
  "wordSpacing",
  "letterSpacing",
  "wordBreak",
  "whiteSpace",
  "wordWrap",
  "boxSizing"
]

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

export function showTextareaSuggestion(textarea: HTMLTextAreaElement, suggestion: string) {
  // Clear any existing overlay first
  clearTextareaSuggestion(textarea)

  const mirror = document.createElement("div")
  mirror.id = "prompt-ghost-mirror"
  mirror.className = "prompt-ghost-textarea-mirror"

  const computed = window.getComputedStyle(textarea)
  for (const prop of PROPERTIES_TO_COPY) {
    ;(mirror.style as any)[prop] = (computed as any)[prop]
  }

  // Update layout and positions
  const updatePosition = () => {
    const rect = textarea.getBoundingClientRect()
    mirror.style.top = `${rect.top + window.scrollY}px`
    mirror.style.left = `${rect.left + window.scrollX}px`
    mirror.style.width = `${rect.width}px`
    mirror.style.height = `${rect.height}px`
  }

  updatePosition()
  document.body.appendChild(mirror)

  // Set the mirror contents
  const typedText = textarea.value.substring(0, textarea.selectionStart)
  mirror.innerHTML = `
    <span class="prompt-ghost-hidden-text">${escapeHTML(typedText)}</span>
    <span class="prompt-ghost-suggestion">${escapeHTML(suggestion)}</span>
  `

  // Scroll sync
  mirror.scrollTop = textarea.scrollTop
  mirror.scrollLeft = textarea.scrollLeft

  activeScrollHandler = () => {
    mirror.scrollTop = textarea.scrollTop
    mirror.scrollLeft = textarea.scrollLeft
  }
  textarea.addEventListener("scroll", activeScrollHandler)

  // Observer for dimension shifts
  activeResizeObserver = new ResizeObserver(() => {
    updatePosition()
  })
  activeResizeObserver.observe(textarea)

  // Global scroll listener to update positions during page scroll
  activeWindowScrollHandler = () => {
    updatePosition()
  }
  window.addEventListener("scroll", activeWindowScrollHandler, true)
}

export function clearTextareaSuggestion(textarea: HTMLTextAreaElement) {
  const existingMirror = document.getElementById("prompt-ghost-mirror")
  if (existingMirror) {
    existingMirror.remove()
  }

  if (activeResizeObserver) {
    activeResizeObserver.disconnect()
    activeResizeObserver = null
  }
  if (activeScrollHandler) {
    textarea.removeEventListener("scroll", activeScrollHandler)
    activeScrollHandler = null
  }
  if (activeWindowScrollHandler) {
    window.removeEventListener("scroll", activeWindowScrollHandler, true)
    activeWindowScrollHandler = null
  }
}

export function acceptTextareaSuggestion(textarea: HTMLTextAreaElement, suggestion: string) {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const value = textarea.value

  const newValue = value.substring(0, start) + suggestion + value.substring(end)
  textarea.value = newValue
  textarea.selectionStart = textarea.selectionEnd = start + suggestion.length

  // Clear suggestions first
  clearTextareaSuggestion(textarea)

  // Dispatch standard events for input saves
  textarea.dispatchEvent(new Event("input", { bubbles: true }))
  textarea.dispatchEvent(new Event("change", { bubbles: true }))
}
