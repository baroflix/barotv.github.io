export function initSpatialNavigation() {
  if (typeof window === 'undefined') return () => {}

  const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]:not([disabled])'

  function getFocusableElements(): HTMLElement[] {
    const nodes = document.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    return Array.from(nodes).filter((node) => {
      const rect = node.getBoundingClientRect()
      // Element must have dimensions and be visually visible
      return rect.width > 0 && rect.height > 0 && window.getComputedStyle(node).visibility !== 'hidden' && window.getComputedStyle(node).display !== 'none'
    })
  }

  // Calculate geometric distance prioritizing alignment
  function getDistance(rect1: DOMRect, rect2: DOMRect, dir: 'up' | 'down' | 'left' | 'right') {
    const c1 = { x: rect1.left + rect1.width / 2, y: rect1.top + rect1.height / 2 }
    const c2 = { x: rect2.left + rect2.width / 2, y: rect2.top + rect2.height / 2 }
    
    // Check if rect2 is in the requested direction
    if (dir === 'up' && c2.y >= c1.y - 10) return Infinity
    if (dir === 'down' && c2.y <= c1.y + 10) return Infinity
    if (dir === 'left' && c2.x >= c1.x - 10) return Infinity
    if (dir === 'right' && c2.x <= c1.x + 10) return Infinity

    const dx = c1.x - c2.x
    const dy = c1.y - c2.y

    // Heavily penalize items that are off-axis to prefer straight lines
    if (dir === 'up' || dir === 'down') {
      return Math.abs(dy) + Math.abs(dx) * 4 // Prefer vertical alignment
    } else {
      return Math.abs(dx) + Math.abs(dy) * 4 // Prefer horizontal alignment
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    // Ignore input if user is typing in a text field
    if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
      if (e.key === 'Escape') {
        ;(document.activeElement as HTMLElement).blur()
      }
      return
    }

    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      if (e.key === 'Escape') {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur()
        }
      }
      return
    }

    const dirMap: Record<string, 'up' | 'down' | 'left' | 'right'> = {
      ArrowUp: 'up',
      ArrowDown: 'down',
      ArrowLeft: 'left',
      ArrowRight: 'right'
    }
    
    const dir = dirMap[e.key]
    const focusable = getFocusableElements()

    let current = document.activeElement as HTMLElement
    
    // If nothing focused, focus the first element in the viewport
    if (!current || !focusable.includes(current)) {
      e.preventDefault()
      const first = focusable.find(el => {
        const rect = el.getBoundingClientRect()
        return rect.top >= 0 && rect.left >= 0 && rect.top <= window.innerHeight
      }) || focusable[0]
      
      first?.focus()
      return
    }

    e.preventDefault()
    const currentRect = current.getBoundingClientRect()

    let closest: HTMLElement | null = null
    let minDistance = Infinity

    for (const el of focusable) {
      if (el === current) continue
      const rect = el.getBoundingClientRect()
      const dist = getDistance(currentRect, rect, dir)
      if (dist < minDistance) {
        minDistance = dist
        closest = el
      }
    }

    if (closest) {
      closest.focus()
      // Smoothly scroll the container to keep the element perfectly centered for a 10-foot UI experience
      closest.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
    }
  }

  window.addEventListener('keydown', handleKeyDown)

  return () => {
    window.removeEventListener('keydown', handleKeyDown)
  }
}
