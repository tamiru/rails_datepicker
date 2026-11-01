const MS_PER_DAY = 86_400_000
const ETHIOPIAN_ANCHOR_YEAR = 2015
const ETHIOPIAN_ANCHOR_DATE = utcDate(2022, 9, 11)

export const MONTHS = {
  gregorian: {
    en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    am: ["ጃንዩወሪ", "ፌብሩወሪ", "ማርች", "ኤፕሪል", "ሜይ", "ጁን", "ጁላይ", "ኦገስት", "ሴፕቴምበር", "ኦክቶበር", "ኖቬምበር", "ዲሴምበር"]
  },
  ethiopian: {
    en: ["Meskerem", "Tikimt", "Hidar", "Tahsas", "Tir", "Yekatit", "Megabit", "Miazia", "Ginbot", "Sene", "Hamle", "Nehase", "Pagume"],
    am: ["መስከረም", "ጥቅምት", "ኅዳር", "ታኅሣሥ", "ጥር", "የካቲት", "መጋቢት", "ሚያዝያ", "ግንቦት", "ሰኔ", "ሐምሌ", "ነሐሴ", "ጳጉሜን"]
  }
}

export const WEEKDAYS = {
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  am: ["እሑድ", "ሰኞ", "ማክሰኞ", "ረቡዕ", "ሐሙስ", "ዓርብ", "ቅዳሜ"]
}

export const WEEKDAYS_LONG = {
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  am: WEEKDAYS.am
}

const LABELS = {
  en: {
    open_calendar: "Open calendar", choose_date: "Choose date",
    previous_year: "Previous year", previous_month: "Previous month", next_month: "Next month", next_year: "Next year",
    month: "Month", year: "Year", calendar: "Calendar", today: "Today", clear: "Clear", switchLanguage: "Switch to Amharic",
    ethiopian: "Ethiopian", gregorian: "Gregorian", invalid: "Enter a valid date",
    unavailable: "This date is unavailable", switchToEthiopian: "Switch to Ethiopian calendar",
    switchToGregorian: "Switch to Gregorian calendar", today_marker: "today", unavailable_marker: "unavailable"
  },
  am: {
    open_calendar: "ቀን መቁጠሪያ ክፈት", choose_date: "ቀን ይምረጡ",
    previous_year: "ያለፈው ዓመት", previous_month: "ያለፈው ወር", next_month: "ቀጣይ ወር", next_year: "ቀጣይ ዓመት",
    month: "ወር", year: "ዓመት", calendar: "የቀን መቁጠሪያ", today: "ዛሬ", clear: "አጽዳ", switchLanguage: "ወደ እንግሊዝኛ ቀይር",
    ethiopian: "የኢትዮጵያ", gregorian: "ጎርጎርዮሳዊ", invalid: "ትክክለኛ ቀን ያስገቡ",
    unavailable: "ይህ ቀን አይገኝም", switchToEthiopian: "ወደ ኢትዮጵያ የቀን መቁጠሪያ ቀይር",
    switchToGregorian: "ወደ ጎርጎርዮሳዊ የቀን መቁጠሪያ ቀይር", today_marker: "ዛሬ", unavailable_marker: "አይገኝም"
  }
}

export function labels(locale = "en") {
  return LABELS[locale] || LABELS.en
}

export function monthName(month, calendar, locale = "en") {
  const names = MONTHS[calendar][locale] || MONTHS[calendar].en
  return names[month - 1]
}

// "Tuesday, Meskerem 15, 2017" / "ማክሰኞ፣ መስከረም 15 ቀን 2017"
export function longDateLabel(value, calendar, locale = "en") {
  const date = normalizedDate(value)
  const { year, month, day } = calendarParts(date, calendar)
  const weekday = (WEEKDAYS_LONG[locale] || WEEKDAYS_LONG.en)[date.getUTCDay()]
  const name = monthName(month, calendar, locale)
  return locale === "am" ? `${weekday}፣ ${name} ${day} ቀን ${year}` : `${weekday}, ${name} ${day}, ${year}`
}

export function monthYearLabel(parts, calendar, locale = "en") {
  return `${monthName(parts.month, calendar, locale)} ${parts.year}`
}

// Walks from `start` in `step`-day increments and returns the first date for
// which `isRestricted` is false, or null when none is found within `limit` steps.
export function nextAvailableDate(start, step, isRestricted, limit = 366) {
  let date = normalizedDate(start)
  for (let index = 0; index < limit; index += 1) {
    date = addDays(date, step)
    if (!isRestricted(date)) return date
  }
  return null
}

// Year options that stay stable while the user navigates: anchored to the
// supplied years (today, the selection, the visible year), widened by
// before/after, and clamped to the min/max years when present.
export function yearRange({ anchors, before, after, minYear = null, maxYear = null }) {
  const valid = anchors.filter(Number.isInteger)
  let first = Math.min(...valid) - before
  let last = Math.max(...valid) + after
  if (Number.isInteger(minYear)) first = Math.max(first, minYear)
  if (Number.isInteger(maxYear)) last = Math.min(last, maxYear)
  first = Math.max(first, 1)
  return { first, last: Math.max(first, last) }
}

export function gregorianLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}

export function ethiopianLeapYear(year) {
  return year % 4 === 3
}

export function ethiopianMonthLength(year, month) {
  if (!Number.isInteger(year) || year < 1 || !Number.isInteger(month) || month < 1 || month > 13) return 0
  return month <= 12 ? 30 : (ethiopianLeapYear(year) ? 6 : 5)
}

export function gregorianMonthLength(year, month) {
  if (!Number.isInteger(year) || year < 1 || !Number.isInteger(month) || month < 1 || month > 12) return 0
  if (month === 2) return gregorianLeapYear(year) ? 29 : 28
  return [4, 6, 9, 11].includes(month) ? 30 : 31
}

export function validEthiopianDate(year, month, day) {
  return Number.isInteger(day) && day >= 1 && day <= ethiopianMonthLength(year, month)
}

export function validGregorianDate(year, month, day) {
  return Number.isInteger(day) && day >= 1 && day <= gregorianMonthLength(year, month)
}

export function ethiopianNewYear(year) {
  if (!Number.isInteger(year) || year < 1) throw new RangeError("Ethiopian year must be positive")
  return addDays(ETHIOPIAN_ANCHOR_DATE, daysBeforeEthiopianYear(year) - daysBeforeEthiopianYear(ETHIOPIAN_ANCHOR_YEAR))
}

export function ethiopianToGregorian(year, month, day) {
  if (!validEthiopianDate(year, month, day)) throw new RangeError("Invalid Ethiopian date")
  return addDays(ethiopianNewYear(year), ((month - 1) * 30) + day - 1)
}

export function gregorianToEthiopian(value) {
  const date = typeof value === "string" ? parseIso(value) : normalizedDate(value)
  if (date < ethiopianNewYear(1)) throw new RangeError("Date predates the Ethiopian calendar")
  let year = Math.max(date.getUTCFullYear() - 7, 1)
  while (date < ethiopianNewYear(year)) year -= 1
  while (date >= ethiopianNewYear(year + 1)) year += 1
  const offset = daysBetween(ethiopianNewYear(year), date)
  return { year, month: Math.floor(offset / 30) + 1, day: (offset % 30) + 1 }
}

export function parseIso(value) {
  const match = /^(\d{4,})-(\d{2})-(\d{2})$/.exec(String(value || ""))
  if (!match) throw new RangeError("Date must use YYYY-MM-DD")
  const [year, month, day] = match.slice(1).map(Number)
  if (!validGregorianDate(year, month, day)) throw new RangeError("Invalid Gregorian date")
  return utcDate(year, month, day)
}

export function toIso(value) {
  const date = normalizedDate(value)
  return `${String(date.getUTCFullYear()).padStart(4, "0")}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`
}

export function calendarParts(date, calendar) {
  if (calendar === "ethiopian") return gregorianToEthiopian(date)
  const normalized = normalizedDate(date)
  return { year: normalized.getUTCFullYear(), month: normalized.getUTCMonth() + 1, day: normalized.getUTCDate() }
}

export function partsToGregorian(parts, calendar) {
  const { year, month, day } = parts
  if (calendar === "ethiopian") return ethiopianToGregorian(year, month, day)
  if (!validGregorianDate(year, month, day)) throw new RangeError("Invalid Gregorian date")
  return utcDate(year, month, day)
}

export function monthLength(year, month, calendar) {
  return calendar === "ethiopian" ? ethiopianMonthLength(year, month) : gregorianMonthLength(year, month)
}

export function shiftMonth(parts, amount, calendar) {
  const count = calendar === "ethiopian" ? 13 : 12
  const index = (parts.year * count) + parts.month - 1 + amount
  const year = Math.floor(index / count)
  const month = ((index % count) + count) % count + 1
  return { year, month, day: Math.min(parts.day || 1, monthLength(year, month, calendar)) }
}

export function parseFormatted(value, format, calendar) {
  const raw = String(value || "").trim()
  const containsEthiopicNumerals = /[፩-፺፻፼]/u.test(raw)
  const normalized = normalizeEthiopicNumerals(raw)
  const tokens = []
  const configuredFormat = String(format || "YYYY-MM-DD")
  let pattern = ""
  let lastIndex = 0
  for (const match of configuredFormat.matchAll(/YYYY|MM|DD/g)) {
    pattern += escapeRegex(configuredFormat.slice(lastIndex, match.index))
    const token = match[0]
    tokens.push(token)
    pattern += token === "YYYY" ? "(\\d{4,})" : (containsEthiopicNumerals ? "(\\d{1,2})" : "(\\d{2})")
    lastIndex = match.index + token.length
  }
  pattern += escapeRegex(configuredFormat.slice(lastIndex))
  const parsed = new RegExp(`^${pattern}$`).exec(normalized)
  if (!parsed || tokens.length !== 3 || new Set(tokens).size !== 3) throw new RangeError("Invalid date format")
  const values = {}
  tokens.forEach((token, index) => { values[token] = Number(parsed[index + 1]) })
  return partsToGregorian({ year: values.YYYY, month: values.MM, day: values.DD }, calendar)
}

export function formatDate(value, format, calendar, useEthiopicNumerals = false) {
  const { year, month, day } = calendarParts(value, calendar)
  const result = String(format || "YYYY-MM-DD")
    .replace("YYYY", String(year).padStart(4, "0"))
    .replace("MM", String(month).padStart(2, "0"))
    .replace("DD", String(day).padStart(2, "0"))
  return useEthiopicNumerals ? result.replace(/\d+/g, number => encodeEthiopicInteger(Number(number))) : result
}

export function encodeEthiopicInteger(number) {
  if (number === 0) return "0"
  if (!Number.isSafeInteger(number) || number < 0) throw new RangeError("Expected a positive integer")
  if (number >= 10000) {
    const high = Math.floor(number / 10000)
    const low = number % 10000
    return `${high === 1 ? "" : encodeEthiopicInteger(high)}፼${low ? encodeEthiopicInteger(low) : ""}`
  }
  const hundreds = Math.floor(number / 100)
  const remainder = number % 100
  const prefix = hundreds ? `${hundreds === 1 ? "" : encodeBelowHundred(hundreds)}፻` : ""
  return `${prefix}${encodeBelowHundred(remainder)}`
}

export function normalizeEthiopicNumerals(value) {
  return value.replace(/[፩-፺፻፼]+/gu, token => String(decodeEthiopicInteger(token)))
}

export function decodeEthiopicInteger(value) {
  const text = String(value)
  if (text.includes("፼")) {
    const [left, ...rest] = text.split("፼")
    return (left ? decodeEthiopicInteger(left) : 1) * 10000 + (rest.join("፼") ? decodeEthiopicInteger(rest.join("፼")) : 0)
  }
  const [left, right] = text.split("፻")
  if (right !== undefined) return (left ? decodeBelowHundred(left) : 1) * 100 + decodeBelowHundred(right)
  return decodeBelowHundred(left)
}

export function addDays(value, days) {
  const date = normalizedDate(value)
  return new Date(date.getTime() + (days * MS_PER_DAY))
}

export function daysBetween(from, to) {
  return Math.round((normalizedDate(to).getTime() - normalizedDate(from).getTime()) / MS_PER_DAY)
}

function utcDate(year, month, day) {
  const date = new Date(0)
  date.setUTCHours(0, 0, 0, 0)
  date.setUTCFullYear(year, month - 1, day)
  return date
}

function normalizedDate(value) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) throw new RangeError("Invalid date")
  return utcDate(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate())
}

function daysBeforeEthiopianYear(year) {
  return (365 * (year - 1)) + Math.floor(year / 4)
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

const ONES = ["", "፩", "፪", "፫", "፬", "፭", "፮", "፯", "፰", "፱"]
const TENS = ["", "፲", "፳", "፴", "፵", "፶", "፷", "፸", "፹", "፺"]

function encodeBelowHundred(number) {
  return `${TENS[Math.floor(number / 10)]}${ONES[number % 10]}`
}

function decodeBelowHundred(text = "") {
  let result = 0
  for (const character of text) {
    const one = ONES.indexOf(character)
    const ten = TENS.indexOf(character)
    if (one > 0) result += one
    else if (ten > 0) result += ten * 10
    else throw new RangeError("Invalid Ethiopic numeral")
  }
  return result
}
