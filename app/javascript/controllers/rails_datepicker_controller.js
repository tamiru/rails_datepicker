import { Controller } from "@hotwired/stimulus"
import {
  MONTHS, WEEKDAYS, addDays, calendarParts, ethiopianToGregorian,
  formatDate, labels, monthLength, parseFormatted, parseIso,
  partsToGregorian, shiftMonth, toIso
} from "rails-datepicker/calendar"

export default class extends Controller {
  static targets = ["input", "canonical", "trigger", "popover", "weekdays", "grid", "monthSelect", "yearSelect", "calendarToggle", "localeToggle"]
  static values = {
    calendar: { type: String, default: "ethiopian" },
    displayCalendar: String,
    locale: { type: String, default: "am" },
    format: { type: String, default: "YYYY-MM-DD" },
    theme: { type: String, default: "auto" },
    weekStart: { type: String, default: "sunday" },
    ethiopicNumerals: { type: Boolean, default: false },
    inline: { type: Boolean, default: false },
    min: String,
    max: String,
    disabledDates: { type: Array, default: [] },
    yearsBefore: { type: Number, default: 100 },
    yearsAfter: { type: Number, default: 20 },
    selected: String
  }

  initialize() {
    this.handleOutside = this.handleOutside.bind(this)
    this.reposition = this.reposition.bind(this)
  }

  connect() {
    this.disabledSet = new Set(this.disabledDatesValue)
    this.selectedDate = this.safeParseIso(this.canonicalTarget.value || this.selectedValue)
    this.viewDate = this.selectedDate || this.todayDate()
    this.opened = this.inlineValue
    this.render()
    document.addEventListener("pointerdown", this.handleOutside)
    window.addEventListener("resize", this.reposition)
    window.addEventListener("scroll", this.reposition, true)
  }

  disconnect() {
    document.removeEventListener("pointerdown", this.handleOutside)
    window.removeEventListener("resize", this.reposition)
    window.removeEventListener("scroll", this.reposition, true)
  }

  toggle(event) {
    event.preventDefault()
    this.opened ? this.close() : this.open()
  }

  open() {
    if (this.inlineValue || this.inputTarget.disabled) return
    this.opened = true
    this.popoverTarget.hidden = false
    this.inputTarget.setAttribute("aria-expanded", "true")
    this.render()
    requestAnimationFrame(() => {
      this.positionPopover()
      this.focusPreferredDay()
    })
  }

  close({ restoreFocus = false } = {}) {
    if (this.inlineValue) return
    this.opened = false
    this.popoverTarget.hidden = true
    this.inputTarget.setAttribute("aria-expanded", "false")
    if (restoreFocus) (this.hasTriggerTarget ? this.triggerTarget : this.inputTarget).focus()
  }

  selectDate(event) {
    event.preventDefault()
    const date = this.safeParseIso(event.currentTarget.dataset.iso)
    if (this.inputTarget.disabled || !date || this.restricted(date)) return
    this.commit(date)
    this.close({ restoreFocus: true })
  }

  switchCalendar(event) {
    event.preventDefault()
    if (this.inputTarget.disabled) return
    const anchor = partsToGregorian({ ...calendarParts(this.viewDate, this.calendarValue), day: 1 }, this.calendarValue)
    this.calendarValue = this.calendarValue === "ethiopian" ? "gregorian" : "ethiopian"
    this.viewDate = anchor
    if (this.selectedDate) this.inputTarget.value = this.formatSelection(this.selectedDate)
    this.render()
  }

  switchLocale(event) {
    event.preventDefault()
    if (this.inputTarget.disabled) return
    this.localeValue = this.localeValue === "am" ? "en" : "am"
    this.render()
    if (this.inputTarget.validationMessage) this.validate()
    this.reposition()
  }

  formatSelection(date) {
    return formatDate(date, this.formatValue, this.displayCalendarValue || this.calendarValue, this.ethiopicNumeralsValue)
  }

  previousMonth() { this.navigateMonths(-1) }
  nextMonth() { this.navigateMonths(1) }
  previousYear() { this.navigateYears(-1) }
  nextYear() { this.navigateYears(1) }

  selectMonth(event) {
    const parts = calendarParts(this.viewDate, this.calendarValue)
    parts.month = Number(event.currentTarget.value)
    parts.day = 1
    this.viewDate = partsToGregorian(parts, this.calendarValue)
    this.render()
  }

  selectYear(event) {
    const parts = calendarParts(this.viewDate, this.calendarValue)
    parts.year = Number(event.currentTarget.value)
    parts.day = 1
    this.viewDate = partsToGregorian(parts, this.calendarValue)
    this.render()
  }

  today(event) {
    event.preventDefault()
    if (this.inputTarget.disabled) return
    const date = this.todayDate()
    if (this.restricted(date)) return
    this.commit(date)
    this.close({ restoreFocus: true })
  }

  clear(event) {
    event.preventDefault()
    if (this.inputTarget.disabled) return

    this.selectedDate = null
    this.selectedValue = ""
    this.canonicalTarget.value = ""
    this.inputTarget.value = ""
    this.setValidity("")
    this.dispatchChanges()
    this.render()
    this.close({ restoreFocus: true })
  }

  input() {
    this.setValidity("")
  }

  validate() {
    const value = this.inputTarget.value.trim()
    if (!value) {
      if (this.inputTarget.required) this.setValidity(labels(this.localeValue).invalid)
      else this.clearWithoutEvent()
      return
    }
    try {
      const date = parseFormatted(value, this.formatValue, this.displayCalendarValue || this.calendarValue)
      if (this.restricted(date)) throw new RangeError(labels(this.localeValue).unavailable)
      this.commit(date)
    } catch (error) {
      this.setValidity(error.message === labels(this.localeValue).unavailable ? error.message : labels(this.localeValue).invalid)
    }
  }

  inputKeydown(event) {
    if (event.key === "ArrowDown" || (event.altKey && event.key === "ArrowDown")) {
      event.preventDefault()
      this.open()
    } else if (event.key === "Enter") {
      this.validate()
    } else if (event.key === "Escape") {
      this.close()
    }
  }

  calendarKeydown(event) {
    const active = event.target.closest("[data-rdp-day]")
    if (event.key === "Escape") {
      event.preventDefault()
      this.close({ restoreFocus: true })
      return
    }
    if (!active) return

    const moves = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }
    let next
    if (moves[event.key]) next = addDays(parseIso(active.dataset.iso), moves[event.key])
    else if (event.key === "Home") next = addDays(parseIso(active.dataset.iso), -((active.dataset.weekday - this.weekStartIndex() + 7) % 7))
    else if (event.key === "End") next = addDays(parseIso(active.dataset.iso), 6 - ((active.dataset.weekday - this.weekStartIndex() + 7) % 7))
    else if (event.key === "PageUp" || event.key === "PageDown") {
      const amount = event.key === "PageUp" ? -1 : 1
      event.preventDefault()
      if (event.shiftKey) this.navigateYears(amount)
      else this.navigateMonths(amount)
      this.focusPreferredDay()
      return
    } else return

    event.preventDefault()
    this.focusDate(next)
  }

  handleOutside(event) {
    if (this.opened && !this.inlineValue && !this.element.contains(event.target)) this.close()
  }

  reposition() {
    if (this.opened && !this.inlineValue) this.positionPopover()
  }

  render() {
    this.renderLocale()
    this.renderToggle()
    this.renderSelectors()
    this.renderWeekdays()
    this.renderDays()
  }

  renderLocale() {
    const copy = labels(this.localeValue)
    this.element.lang = this.localeValue
    for (const element of this.element.querySelectorAll("[data-rails-datepicker-label]")) {
      element.setAttribute("aria-label", copy[element.dataset.railsDatepickerLabel])
    }
    for (const element of this.element.querySelectorAll("[data-rails-datepicker-text]")) {
      element.textContent = copy[element.dataset.railsDatepickerText]
    }
    if (this.hasLocaleToggleTarget) {
      this.localeToggleTarget.textContent = this.localeValue === "am" ? "English" : "አማርኛ"
      this.localeToggleTarget.setAttribute("aria-label", copy.switchLanguage)
    }
  }

  renderToggle() {
    const next = this.calendarValue === "ethiopian" ? "gregorian" : "ethiopian"
    const copy = labels(this.localeValue)
    this.calendarToggleTarget.textContent = copy[next]
    this.calendarToggleTarget.setAttribute("aria-label", copy[`switchTo${next[0].toUpperCase()}${next.slice(1)}`])
  }

  renderSelectors() {
    const current = calendarParts(this.viewDate, this.calendarValue)
    const names = MONTHS[this.calendarValue][this.localeValue] || MONTHS[this.calendarValue].en
    this.monthSelectTarget.innerHTML = names.map((name, index) => `<option value="${index + 1}"${index + 1 === current.month ? " selected" : ""}>${name}</option>`).join("")
    const minYear = current.year - this.yearsBeforeValue
    const maxYear = current.year + this.yearsAfterValue
    let years = ""
    for (let year = maxYear; year >= minYear; year -= 1) years += `<option value="${year}"${year === current.year ? " selected" : ""}>${year}</option>`
    this.yearSelectTarget.innerHTML = years
  }

  renderWeekdays() {
    const days = WEEKDAYS[this.localeValue] || WEEKDAYS.en
    const ordered = [...days.slice(this.weekStartIndex()), ...days.slice(0, this.weekStartIndex())]
    this.weekdaysTarget.innerHTML = ordered.map(day => `<span class="rdp__weekday" role="columnheader">${day}</span>`).join("")
  }

  renderDays() {
    const parts = calendarParts(this.viewDate, this.calendarValue)
    const firstDate = partsToGregorian({ year: parts.year, month: parts.month, day: 1 }, this.calendarValue)
    const offset = (firstDate.getUTCDay() - this.weekStartIndex() + 7) % 7
    const count = monthLength(parts.year, parts.month, this.calendarValue)
    const todayIso = toIso(this.todayDate())
    const selectedIso = this.selectedDate ? toIso(this.selectedDate) : ""
    const visibleMonth = date => {
      const value = calendarParts(date, this.calendarValue)
      return value.year === parts.year && value.month === parts.month
    }
    let tabbableIso = ""
    if (this.selectedDate && visibleMonth(this.selectedDate) && !this.restricted(this.selectedDate)) {
      tabbableIso = selectedIso
    } else {
      const today = this.todayDate()
      if (visibleMonth(today) && !this.restricted(today)) tabbableIso = todayIso
    }
    if (!tabbableIso) {
      for (let day = 1; day <= count; day += 1) {
        const date = partsToGregorian({ ...parts, day }, this.calendarValue)
        if (!this.restricted(date)) {
          tabbableIso = toIso(date)
          break
        }
      }
    }
    const cells = []

    for (let index = 0; index < Math.ceil((offset + count) / 7) * 7; index += 1) {
      const day = index - offset + 1
      if (day < 1 || day > count) {
        cells.push("<span class=\"rdp__day rdp__day--empty\" role=\"gridcell\"></span>")
        continue
      }
      const date = this.calendarValue === "ethiopian" ? ethiopianToGregorian(parts.year, parts.month, day) : partsToGregorian({ ...parts, day }, "gregorian")
      const iso = toIso(date)
      const disabled = this.restricted(date)
      const classes = ["rdp__day"]
      if (iso === todayIso) classes.push("rdp__day--today")
      if (iso === selectedIso) classes.push("rdp__day--selected")
      cells.push(`<button type="button" class="${classes.join(" ")}" role="gridcell" data-rdp-day data-iso="${iso}" data-weekday="${date.getUTCDay()}" tabindex="${iso === tabbableIso ? "0" : "-1"}" aria-selected="${iso === selectedIso}"${iso === todayIso ? " aria-current=\"date\"" : ""}${disabled ? " disabled aria-disabled=\"true\"" : ""} data-action="rails-datepicker#selectDate">${this.dayLabel(day)}</button>`)
    }
    this.gridTarget.innerHTML = cells.join("")
  }

  dayLabel(day) {
    if (!this.ethiopicNumeralsValue) return day
    return formatDate(partsToGregorian({ year: 2000, month: 1, day }, "gregorian"), "DD", "gregorian", true).replace(/^0/, "")
  }

  navigateMonths(amount) {
    const parts = shiftMonth({ ...calendarParts(this.viewDate, this.calendarValue), day: 1 }, amount, this.calendarValue)
    this.viewDate = partsToGregorian(parts, this.calendarValue)
    this.render()
  }

  navigateYears(amount) {
    const parts = calendarParts(this.viewDate, this.calendarValue)
    parts.year += amount
    parts.day = 1
    this.viewDate = partsToGregorian(parts, this.calendarValue)
    this.render()
  }

  commit(date) {
    this.selectedDate = date
    this.viewDate = date
    const iso = toIso(date)
    this.selectedValue = iso
    this.canonicalTarget.value = iso
    this.inputTarget.value = this.formatSelection(date)
    this.setValidity("")
    this.dispatchChanges()
    this.render()
  }

  dispatchChanges() {
    for (const target of [this.canonicalTarget, this.inputTarget]) {
      target.dispatchEvent(new Event("input", { bubbles: true }))
      target.dispatchEvent(new Event("change", { bubbles: true }))
    }
  }

  clearWithoutEvent() {
    this.selectedDate = null
    this.selectedValue = ""
    this.canonicalTarget.value = ""
    this.setValidity("")
    this.render()
  }

  restricted(date) {
    const iso = toIso(date)
    return this.inputTarget.disabled ||
      (this.hasMinValue && this.minValue !== "" && iso < this.minValue) ||
      (this.hasMaxValue && this.maxValue !== "" && iso > this.maxValue) ||
      this.disabledSet.has(iso)
  }

  setValidity(message) {
    this.inputTarget.setCustomValidity(message)
    this.inputTarget.setAttribute("aria-invalid", String(Boolean(message)))
  }

  positionPopover() {
    const anchor = this.element.querySelector(".rdp__input-group").getBoundingClientRect()
    const panel = this.popoverTarget
    const margin = 8
    const width = Math.min(288, window.innerWidth - (margin * 2))
    panel.style.width = `${width}px`
    const panelHeight = panel.offsetHeight
    const below = window.innerHeight - anchor.bottom
    const top = below >= panelHeight + margin || below >= anchor.top ? anchor.bottom + margin : anchor.top - panelHeight - margin
    const left = Math.min(Math.max(margin, anchor.left), window.innerWidth - width - margin)
    panel.style.top = `${Math.max(margin, top)}px`
    panel.style.left = `${left}px`
  }

  focusPreferredDay() {
    const preferred = this.selectedDate ? toIso(this.selectedDate) : toIso(this.todayDate())
    const target = this.gridTarget.querySelector(`[data-iso="${preferred}"]:not(:disabled)`) || this.gridTarget.querySelector("[data-rdp-day]:not(:disabled)")
    target?.focus()
  }

  focusDate(date) {
    if (this.restricted(date)) return
    const targetParts = calendarParts(date, this.calendarValue)
    const currentParts = calendarParts(this.viewDate, this.calendarValue)
    if (targetParts.year !== currentParts.year || targetParts.month !== currentParts.month) {
      this.viewDate = date
      this.render()
    }
    const target = this.gridTarget.querySelector(`[data-iso="${toIso(date)}"]:not(:disabled)`)
    target?.focus()
  }

  weekStartIndex() { return this.weekStartValue === "monday" ? 1 : 0 }

  safeParseIso(value) {
    try { return value ? parseIso(value) : null } catch (_) { return null }
  }

  todayDate() {
    const now = new Date()
    const date = new Date(0)
    date.setUTCHours(0, 0, 0, 0)
    date.setUTCFullYear(now.getFullYear(), now.getMonth(), now.getDate())
    return date
  }
}
