import { Controller } from "@hotwired/stimulus"
import {
  MONTHS, WEEKDAYS, addDays, calendarParts, encodeEthiopicInteger,
  ethiopianToGregorian, formatDate, labels, longDateLabel, monthLength,
  monthYearLabel, nextAvailableDate, parseFormatted, parseIso,
  partsToGregorian, shiftMonth, toIso, yearRange
} from "rails-datepicker/calendar"

export default class extends Controller {
  static targets = [
    "input", "canonical", "trigger", "popover", "weekdays", "grid", "monthSelect", "yearSelect",
    "calendarToggle", "localeToggle", "previousButton", "nextButton", "todayButton", "status"
  ]

  static values = {
    calendar: { type: String, default: "ethiopian" },
    displayCalendar: String,
    locale: { type: String, default: "am" },
    format: { type: String, default: "YYYY-MM-DD" },
    theme: { type: String, default: "auto" },
    weekStart: { type: String, default: "sunday" },
    ethiopicNumerals: { type: Boolean, default: false },
    dualDates: { type: Boolean, default: false },
    localeFollowsCalendar: { type: Boolean, default: false },
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

  // Opening / closing

  toggle(event) {
    event.preventDefault()
    this.opened ? this.close() : this.open()
  }

  open() {
    if (this.inlineValue || this.inputTarget.disabled) return
    this.opened = true
    this.viewDate = this.selectedDate || this.todayDate()
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

  inputClick() {
    if (this.inputTarget.readOnly && !this.opened) this.open()
  }

  // Closes the popover when keyboard focus leaves the component (e.g. Tab to
  // the next field). A null relatedTarget is ignored because some browsers
  // report it while a click on a non-focusable button is still in progress.
  focusOut(event) {
    if (!this.opened || this.inlineValue) return
    const next = event.relatedTarget
    if (next && !this.element.contains(next)) this.close()
  }

  handleOutside(event) {
    if (this.opened && !this.inlineValue && !this.element.contains(event.target)) this.close()
  }

  reposition() {
    if (this.opened && !this.inlineValue) this.positionPopover()
  }

  // Selection

  selectDate(event) {
    event.preventDefault()
    const date = this.safeParseIso(event.currentTarget.dataset.iso)
    if (this.inputTarget.disabled || !date || this.restricted(date)) return
    this.commit(date)
    this.close({ restoreFocus: true })
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

    const changed = Boolean(this.selectedDate)
    this.selectedDate = null
    this.selectedValue = ""
    this.canonicalTarget.value = ""
    this.inputTarget.value = ""
    this.setValidity("")
    this.dispatchChanges()
    if (changed) this.dispatchSelection(null)
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

  // Calendar and language switches

  switchCalendar(event) {
    event.preventDefault()
    if (this.inputTarget.disabled) return
    const anchor = partsToGregorian({ ...calendarParts(this.viewDate, this.calendarValue), day: 1 }, this.calendarValue)
    this.calendarValue = this.calendarValue === "ethiopian" ? "gregorian" : "ethiopian"
    if (this.localeFollowsCalendarValue) this.localeValue = this.calendarValue === "ethiopian" ? "am" : "en"
    this.viewDate = anchor
    if (this.selectedDate) this.inputTarget.value = this.formatSelection(this.selectedDate)
    this.render()
    this.announceView()
    if (this.inputTarget.validationMessage) this.validate()
    this.reposition()
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

  // Month / year navigation

  previousMonth() { this.navigateMonths(-1) }
  nextMonth() { this.navigateMonths(1) }
  previousYear() { this.navigateYears(-1) }
  nextYear() { this.navigateYears(1) }

  selectMonth(event) {
    const parts = calendarParts(this.viewDate, this.calendarValue)
    this.showMonth({ year: parts.year, month: Number(event.currentTarget.value) })
  }

  selectYear(event) {
    const parts = calendarParts(this.viewDate, this.calendarValue)
    this.showMonth({ year: Number(event.currentTarget.value), month: parts.month })
  }

  navigateMonths(amount) {
    const parts = shiftMonth({ ...calendarParts(this.viewDate, this.calendarValue), day: 1 }, amount, this.calendarValue)
    this.showMonth(parts)
  }

  navigateYears(amount) {
    const parts = calendarParts(this.viewDate, this.calendarValue)
    this.showMonth({ year: parts.year + amount, month: parts.month })
  }

  showMonth({ year, month }) {
    // Pagume does not exist in every year length, but month 13 always does.
    this.viewDate = partsToGregorian({ year, month, day: 1 }, this.calendarValue)
    this.render()
    this.announceView()
  }

  // Keyboard

  inputKeydown(event) {
    if (event.key === "ArrowDown") {
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

    const current = parseIso(active.dataset.iso)
    const offsetInWeek = (Number(active.dataset.weekday) - this.weekStartIndex() + 7) % 7
    const isRestricted = date => this.restricted(date)
    const moves = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }
    let next

    if (moves[event.key]) {
      // Skip over disabled dates instead of stopping at them.
      next = nextAvailableDate(current, moves[event.key], isRestricted, 400)
    } else if (event.key === "Home") {
      next = nextAvailableDate(addDays(current, -offsetInWeek - 1), 1, isRestricted, 7)
    } else if (event.key === "End") {
      next = nextAvailableDate(addDays(current, 7 - offsetInWeek), -1, isRestricted, 7)
    } else if (event.key === "PageUp" || event.key === "PageDown") {
      const direction = event.key === "PageUp" ? -1 : 1
      const monthsPerYear = this.calendarValue === "ethiopian" ? 13 : 12
      const amount = event.shiftKey ? direction * monthsPerYear : direction
      const target = partsToGregorian(shiftMonth(calendarParts(current, this.calendarValue), amount, this.calendarValue), this.calendarValue)
      next = this.restricted(target) ? this.nearestAvailable(target) : target
      if (!next) {
        event.preventDefault()
        return
      }
    } else return

    event.preventDefault()
    if (next) this.focusDate(next)
  }

  nearestAvailable(date) {
    if (!this.restricted(date)) return date
    const isRestricted = candidate => this.restricted(candidate)
    return nextAvailableDate(date, 1, isRestricted, 31) || nextAvailableDate(date, -1, isRestricted, 31)
  }

  // Rendering

  render() {
    this.clampView()
    this.renderLocale()
    this.renderToggle()
    this.renderSelectors()
    this.renderNavigation()
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
      this.localeToggleTarget.hidden = this.localeFollowsCalendarValue
      this.localeToggleTarget.textContent = this.localeValue === "am" ? "English" : "አማርኛ"
      this.localeToggleTarget.setAttribute("aria-label", copy.switchLanguage)
    }
  }

  renderToggle() {
    const next = this.calendarValue === "ethiopian" ? "gregorian" : "ethiopian"
    const copy = labels(this.localeValue)
    const label = copy[`switchTo${next[0].toUpperCase()}${next.slice(1)}`]
    for (const flag of this.calendarToggleTarget.querySelectorAll("[data-rdp-flag]")) {
      flag.classList.toggle("rdp__flag--active", flag.dataset.rdpFlag === this.calendarValue)
    }
    this.calendarToggleTarget.setAttribute("aria-label", label)
    this.calendarToggleTarget.title = label
  }

  renderSelectors() {
    const calendar = this.calendarValue
    const current = calendarParts(this.viewDate, calendar)
    const names = MONTHS[calendar][this.localeValue] || MONTHS[calendar].en
    this.monthSelectTarget.innerHTML = names.map((name, index) => {
      const month = index + 1
      const available = this.monthAvailable({ year: current.year, month })
      return `<option value="${month}"${month === current.month ? " selected" : ""}${available ? "" : " disabled"}>${name}</option>`
    }).join("")

    // Anchor the range to today and the selection so it does not drift every
    // time the user picks a different year.
    const min = this.minDate()
    const max = this.maxDate()
    const { first, last } = yearRange({
      anchors: [this.todayDate(), this.selectedDate, this.viewDate].filter(Boolean).map(date => calendarParts(date, calendar).year),
      before: this.yearsBeforeValue,
      after: this.yearsAfterValue,
      minYear: min ? calendarParts(min, calendar).year : null,
      maxYear: max ? calendarParts(max, calendar).year : null
    })
    let years = ""
    for (let year = last; year >= first; year -= 1) years += `<option value="${year}"${year === current.year ? " selected" : ""}>${year}</option>`
    this.yearSelectTarget.innerHTML = years
  }

  renderNavigation() {
    const disabled = this.inputTarget.disabled
    const parts = { ...calendarParts(this.viewDate, this.calendarValue), day: 1 }
    if (this.hasPreviousButtonTarget) {
      this.previousButtonTarget.disabled = disabled || !this.monthAvailable(shiftMonth(parts, -1, this.calendarValue))
    }
    if (this.hasNextButtonTarget) {
      this.nextButtonTarget.disabled = disabled || !this.monthAvailable(shiftMonth(parts, 1, this.calendarValue))
    }
    if (this.hasTodayButtonTarget) {
      this.todayButtonTarget.disabled = disabled || this.restricted(this.todayDate())
    }
  }

  renderWeekdays() {
    const days = WEEKDAYS[this.localeValue] || WEEKDAYS.en
    const ordered = [...days.slice(this.weekStartIndex()), ...days.slice(0, this.weekStartIndex())]
    this.weekdaysTarget.innerHTML = ordered.map(day => `<span class="rdp__weekday">${day}</span>`).join("")
  }

  renderDays() {
    const calendar = this.calendarValue
    const otherCalendar = calendar === "ethiopian" ? "gregorian" : "ethiopian"
    const copy = labels(this.localeValue)
    const parts = calendarParts(this.viewDate, calendar)
    const firstDate = partsToGregorian({ year: parts.year, month: parts.month, day: 1 }, calendar)
    const offset = (firstDate.getUTCDay() - this.weekStartIndex() + 7) % 7
    const count = monthLength(parts.year, parts.month, calendar)
    const todayIso = toIso(this.todayDate())
    const selectedIso = this.selectedDate ? toIso(this.selectedDate) : ""
    const tabbableIso = this.tabbableIso(parts, count, selectedIso, todayIso)
    const cells = []

    for (let index = 0; index < Math.ceil((offset + count) / 7) * 7; index += 1) {
      const day = index - offset + 1
      if (day < 1 || day > count) {
        cells.push("<span class=\"rdp__day rdp__day--empty\" role=\"gridcell\"></span>")
        continue
      }
      const date = calendar === "ethiopian" ? ethiopianToGregorian(parts.year, parts.month, day) : partsToGregorian({ ...parts, day }, "gregorian")
      const iso = toIso(date)
      const disabled = this.restricted(date)
      const weekday = date.getUTCDay()
      const classes = ["rdp__day"]
      if (iso === todayIso) classes.push("rdp__day--today")
      if (iso === selectedIso) classes.push("rdp__day--selected")
      if (weekday === 0 || weekday === 6) classes.push("rdp__day--weekend")

      let label = longDateLabel(date, calendar, this.localeValue)
      let secondary = ""
      if (this.dualDatesValue) {
        const otherDay = calendarParts(date, otherCalendar).day
        label += ` (${longDateLabel(date, otherCalendar, this.localeValue)})`
        secondary = `<span class="rdp__day-secondary${otherDay === 1 ? " rdp__day-secondary--first" : ""}" aria-hidden="true">${this.numeral(otherDay)}</span>`
        classes.push("rdp__day--dual")
      }
      if (iso === todayIso) label += `, ${copy.today_marker}`
      if (disabled) label += `, ${copy.unavailable_marker}`

      cells.push(`<button type="button" class="${classes.join(" ")}" role="gridcell" data-rdp-day data-iso="${iso}" data-weekday="${weekday}" tabindex="${iso === tabbableIso ? "0" : "-1"}" aria-label="${label}" aria-selected="${iso === selectedIso}"${iso === todayIso ? " aria-current=\"date\"" : ""}${disabled ? " disabled aria-disabled=\"true\"" : ""} data-action="rails-datepicker#selectDate"><span class="rdp__day-primary">${this.numeral(day)}</span>${secondary}</button>`)
    }

    const rows = []
    for (let index = 0; index < cells.length; index += 7) {
      rows.push(`<div class="rdp__week" role="row">${cells.slice(index, index + 7).join("")}</div>`)
    }
    this.gridTarget.innerHTML = rows.join("")
    this.gridTarget.setAttribute("aria-label", monthYearLabel(parts, calendar, this.localeValue))
  }

  tabbableIso(parts, count, selectedIso, todayIso) {
    const calendar = this.calendarValue
    const visibleMonth = date => {
      const value = calendarParts(date, calendar)
      return value.year === parts.year && value.month === parts.month
    }
    if (this.selectedDate && visibleMonth(this.selectedDate) && !this.restricted(this.selectedDate)) return selectedIso
    const today = this.todayDate()
    if (visibleMonth(today) && !this.restricted(today)) return todayIso
    for (let day = 1; day <= count; day += 1) {
      const date = partsToGregorian({ ...parts, day }, calendar)
      if (!this.restricted(date)) return toIso(date)
    }
    return ""
  }

  numeral(number) {
    return this.ethiopicNumeralsValue ? encodeEthiopicInteger(number) : String(number)
  }

  announceView() {
    if (!this.hasStatusTarget) return
    const parts = calendarParts(this.viewDate, this.calendarValue)
    this.statusTarget.textContent = monthYearLabel(parts, this.calendarValue, this.localeValue)
  }

  // State

  commit(date) {
    const iso = toIso(date)
    const changed = iso !== (this.selectedDate ? toIso(this.selectedDate) : "")
    this.selectedDate = date
    this.viewDate = date
    this.selectedValue = iso
    this.canonicalTarget.value = iso
    this.inputTarget.value = this.formatSelection(date)
    this.setValidity("")
    this.dispatchChanges()
    if (changed) this.dispatchSelection(date)
    this.render()
  }

  dispatchChanges() {
    for (const target of [this.canonicalTarget, this.inputTarget]) {
      target.dispatchEvent(new Event("input", { bubbles: true }))
      target.dispatchEvent(new Event("change", { bubbles: true }))
    }
  }

  // Emits `rails-datepicker:change` with both calendar representations so host
  // controllers do not need to re-implement the conversion.
  dispatchSelection(date) {
    this.dispatch("change", {
      detail: date ? {
        iso: toIso(date),
        date,
        gregorian: calendarParts(date, "gregorian"),
        ethiopian: calendarParts(date, "ethiopian"),
        formatted: this.inputTarget.value
      } : { iso: "", date: null, gregorian: null, ethiopian: null, formatted: "" }
    })
  }

  clearWithoutEvent() {
    const changed = Boolean(this.selectedDate)
    this.selectedDate = null
    this.selectedValue = ""
    this.canonicalTarget.value = ""
    this.setValidity("")
    if (changed) this.dispatchSelection(null)
    this.render()
  }

  restricted(date) {
    const iso = toIso(date)
    return this.inputTarget.disabled ||
      (this.hasMinValue && this.minValue !== "" && iso < this.minValue) ||
      (this.hasMaxValue && this.maxValue !== "" && iso > this.maxValue) ||
      this.disabledSet.has(iso)
  }

  minDate() { return this.hasMinValue ? this.safeParseIso(this.minValue) : null }
  maxDate() { return this.hasMaxValue ? this.safeParseIso(this.maxValue) : null }

  // True when any part of the month falls inside min/max.
  monthAvailable({ year, month }) {
    const calendar = this.calendarValue
    const length = monthLength(year, month, calendar)
    if (!length) return false
    const min = this.minDate()
    const max = this.maxDate()
    if (max && toIso(partsToGregorian({ year, month, day: 1 }, calendar)) > toIso(max)) return false
    if (min && toIso(partsToGregorian({ year, month, day: length }, calendar)) < toIso(min)) return false
    return true
  }

  // Keeps the visible month inside min/max so year/month jumps cannot strand
  // the user on a month with no selectable dates.
  clampView() {
    const min = this.minDate()
    const max = this.maxDate()
    if (min && this.viewDate < min) this.viewDate = min
    if (max && this.viewDate > max) this.viewDate = max
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
      this.announceView()
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
