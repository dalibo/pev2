export default class Dragscroll {
  private element: Element
  private listener: boolean
  private start: boolean
  private startMousePositionX: number
  private startMousePositionY: number
  private startScrollPositionX: number
  private startScrollPositionY: number

  constructor(element: Element) {
    this.element = element
    this.listener = true

    this.start = false
    this.startMousePositionX = 0
    this.startMousePositionY = 0
    this.startScrollPositionX = 0
    this.startScrollPositionY = 0

    this.element.addEventListener("mousedown", (e: Event) => {
      const event = e as MouseEvent
      const target = e.target as Element
      if (target.closest(".plan-node-body")) {
        return
      }
      event.preventDefault()
      this.clearSelection()

      this.startMousePositionX = event.screenX
      this.startMousePositionY = event.screenY
      this.startScrollPositionX = this.element.scrollLeft
      this.startScrollPositionY = this.element.scrollTop

      this.start = true
    })

    document.documentElement.addEventListener("mouseup", (e: Event) => {
      e.preventDefault()

      this.startMousePositionX = 0
      this.startMousePositionY = 0
      this.startScrollPositionX = 0
      this.startScrollPositionY = 0

      this.start = false
    })

    this.element.addEventListener("mousemove", (e: Event) => {
      const event = e as MouseEvent
      if (this.listener && this.start) {
        event.preventDefault()

        this.element.scrollTo(
          this.startScrollPositionX +
            (this.startMousePositionX - event.screenX),
          this.startScrollPositionY +
            (this.startMousePositionY - event.screenY),
        )
      }
    })
  }

  private clearSelection() {
    if (window.getSelection) {
      const sel = window.getSelection()
      if (sel) {
        sel.removeAllRanges()
      }
    }
  }
}
