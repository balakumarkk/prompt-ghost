let activeCeOverlay: HTMLElement | null = null

export function showContentEditableSuggestion(element: HTMLElement, suggestion: string) {
  // Clear any existing suggestions
  clearContentEditableSuggestion(element)

  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return

  const range = selection.getRangeAt(0)
  
  // Save range parameters to restore them after any potential marker insertions
  const startContainer = range.startContainer
  const startOffset = range.startOffset
  const endContainer = range.endContainer
  const endOffset = range.endOffset

  let x = 0
  let y = 0

  // 1. Try standard getBoundingClientRect
  const rect = range.getBoundingClientRect()
  if (rect && (rect.left !== 0 || rect.top !== 0)) {
    x = rect.left
    y = rect.top
  } else {
    // 2. Try getClientRects
    const rects = range.getClientRects()
    if (rects && rects.length > 0) {
      x = rects[0].left
      y = rects[0].top
    } else {
      // 3. Fallback: temporary marker span (minimizes rich text editor mutations)
      const marker = document.createElement("span")
      marker.appendChild(document.createTextNode("\u200b")) // Zero-width space
      try {
        range.insertNode(marker)
        const mRect = marker.getBoundingClientRect()
        x = mRect.left
        y = mRect.top
        marker.remove()
      } catch (err) {
        console.warn("[ContentEditableGhost] Failed to insert coordinates marker:", err)
      }
    }
  }

  // Restore selection precisely
  try {
    const restoredRange = document.createRange()
    restoredRange.setStart(startContainer, startOffset)
    restoredRange.setEnd(endContainer, endOffset)
    selection.removeAllRanges()
    selection.addRange(restoredRange)
  } catch (err) {
    console.warn("[ContentEditableGhost] Failed to restore selection range:", err)
  }

  if (x === 0 && y === 0) {
    console.log("[ContentEditableGhost] Could not calculate caret coordinates, skipping display.");
    return
  }

  // Create an absolute-positioned floating suggestion overlay
  const overlay = document.createElement("span")
  overlay.id = "prompt-ghost-ce-overlay"
  overlay.className = "prompt-ghost-suggestion-inline"
  overlay.innerText = suggestion
  
  overlay.style.position = "absolute"
  overlay.style.pointerEvents = "none"
  overlay.style.userSelect = "none"
  overlay.style.webkitUserSelect = "none"
  overlay.style.zIndex = "2147483647"
  overlay.style.color = "#8e8e8e"
  overlay.style.opacity = "0.85"
  overlay.style.backgroundColor = "transparent"

  // Copy font styles from the editor container to match perfectly
  const computed = window.getComputedStyle(element)
  overlay.style.fontFamily = computed.fontFamily
  overlay.style.fontSize = computed.fontSize
  overlay.style.fontWeight = computed.fontWeight
  overlay.style.lineHeight = computed.lineHeight
  overlay.style.fontStyle = computed.fontStyle
  overlay.style.fontVariant = computed.fontVariant
  overlay.style.letterSpacing = computed.letterSpacing

  // Align with the caret
  overlay.style.left = `${x + window.scrollX}px`
  overlay.style.top = `${y + window.scrollY}px`

  document.body.appendChild(overlay)
  activeCeOverlay = overlay
  console.log("[ContentEditableGhost] Suggestion overlay drawn at:", x, y)
}

export function clearContentEditableSuggestion(element: HTMLElement) {
  if (activeCeOverlay) {
    activeCeOverlay.remove()
    activeCeOverlay = null
  }
  const legacy = document.getElementById("prompt-ghost-ce-overlay")
  if (legacy) {
    legacy.remove()
  }
}

export function acceptContentEditableSuggestion(element: HTMLElement, suggestion: string) {
  clearContentEditableSuggestion(element)

  // Focus the input to target command correctly
  element.focus()

  try {
    // Standard command to insert text at cursor (updates modern SPA rich-text frameworks natively)
    const success = document.execCommand("insertText", false, suggestion)
    if (!success) {
      throw new Error("execCommand returned false")
    }
    console.log("[ContentEditableGhost] Suggestion accepted via execCommand")
  } catch (err) {
    console.warn("[ContentEditableGhost] execCommand failed, falling back to range injection:", err)
    
    // Fallback: direct range manipulation if browser restricts execCommand
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      range.deleteContents()
      const textNode = document.createTextNode(suggestion)
      range.insertNode(textNode)
      range.setStartAfter(textNode)
      range.collapse(true)
      selection.removeAllRanges()
      selection.addRange(range)
    }
  }

  // Fire input event for modern reactive UI states (e.g. React/Vue)
  element.dispatchEvent(new Event("input", { bubbles: true }))
}

export function getContentEditableTextUpToCaret(element: HTMLElement): string {
  let text = ""
  const selection = window.getSelection()
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0)
    const preCaretRange = range.cloneRange()
    preCaretRange.selectNodeContents(element)
    preCaretRange.setEnd(range.endContainer, range.endOffset)
    text = preCaretRange.toString()
  } else {
    text = element.innerText || ""
  }
  return text
}
