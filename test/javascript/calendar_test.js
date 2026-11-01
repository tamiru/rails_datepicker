import test from "node:test"
import assert from "node:assert/strict"
import {
  decodeEthiopicInteger, encodeEthiopicInteger, ethiopianLeapYear,
  ethiopianMonthLength, ethiopianNewYear, ethiopianToGregorian, formatDate,
  gregorianLeapYear, gregorianToEthiopian, longDateLabel, monthYearLabel,
  nextAvailableDate, normalizeEthiopicNumerals, parseFormatted, parseIso, toIso,
  yearRange
} from "../../app/javascript/rails-datepicker/calendar.js"

test("converts Ethiopian New Year boundaries", () => {
  assert.equal(toIso(ethiopianToGregorian(2015, 1, 1)), "2022-09-11")
  assert.equal(toIso(ethiopianToGregorian(2016, 1, 1)), "2023-09-12")
  assert.deepEqual(gregorianToEthiopian(parseIso("2023-09-11")), { year: 2015, month: 13, day: 6 })
  assert.deepEqual(gregorianToEthiopian(parseIso("2023-09-12")), { year: 2016, month: 1, day: 1 })
})

test("remains accurate across Gregorian century boundaries", () => {
  assert.equal(toIso(ethiopianNewYear(2092)), "2099-09-12")
  assert.deepEqual(gregorianToEthiopian(parseIso("2099-09-11")), { year: 2091, month: 13, day: 6 })
  assert.deepEqual(gregorianToEthiopian(parseIso("2099-09-12")), { year: 2092, month: 1, day: 1 })
  assert.equal(toIso(ethiopianNewYear(2096)), "2103-09-13")
})

test("handles Gregorian and Ethiopian leap years", () => {
  assert.equal(gregorianLeapYear(2000), true)
  assert.equal(gregorianLeapYear(2100), false)
  assert.equal(ethiopianLeapYear(2011), true)
  assert.equal(ethiopianMonthLength(2011, 13), 6)
  assert.equal(ethiopianMonthLength(2012, 13), 5)
  assert.equal(toIso(ethiopianToGregorian(2011, 13, 6)), "2019-09-11")
})

test("round trips dates over a broad reference range", () => {
  for (let year = 1900; year <= 2100; year += 1) {
    for (const month of [1, 3, 6, 9, 12]) {
      const date = parseIso(`${year}-${String(month).padStart(2, "0")}-15`)
      const ethiopian = gregorianToEthiopian(date)
      assert.equal(toIso(ethiopianToGregorian(ethiopian.year, ethiopian.month, ethiopian.day)), toIso(date))
    }
  }
})

test("strictly parses configured formats", () => {
  assert.equal(toIso(parseFormatted("2016-01-01", "YYYY-MM-DD", "ethiopian")), "2023-09-12")
  assert.equal(toIso(parseFormatted("31/12/2024", "DD/MM/YYYY", "gregorian")), "2024-12-31")
  assert.throws(() => parseFormatted("2024-2-01", "YYYY-MM-DD", "gregorian"))
  assert.throws(() => parseFormatted("2024-02-30", "YYYY-MM-DD", "gregorian"))
})

test("formats and accepts Ethiopic numerals", () => {
  assert.equal(encodeEthiopicInteger(2016), "፳፻፲፮")
  assert.equal(decodeEthiopicInteger("፳፻፲፮"), 2016)
  assert.equal(normalizeEthiopicNumerals("፳፻፲፮-፩-፩"), "2016-1-1")
  assert.equal(formatDate(parseIso("2023-09-12"), "YYYY-MM-DD", "ethiopian", true), "፳፻፲፮-፩-፩")
  assert.equal(toIso(parseFormatted("፳፻፲፮-፩-፩", "YYYY-MM-DD", "ethiopian")), "2023-09-12")
})

test("builds full date labels for screen readers in both calendars", () => {
  const date = parseIso("2023-09-12")
  assert.equal(longDateLabel(date, "ethiopian", "en"), "Tuesday, Meskerem 1, 2016")
  assert.equal(longDateLabel(date, "gregorian", "en"), "Tuesday, September 12, 2023")
  assert.equal(longDateLabel(date, "ethiopian", "am"), "ማክሰኞ፣ መስከረም 1 ቀን 2016")
  assert.equal(monthYearLabel({ year: 2015, month: 13 }, "ethiopian", "en"), "Pagume 2015")
})

test("finds the next available date while skipping restricted dates", () => {
  const blocked = new Set(["2024-01-02", "2024-01-03"])
  const restricted = date => blocked.has(toIso(date))
  assert.equal(toIso(nextAvailableDate(parseIso("2024-01-01"), 1, restricted)), "2024-01-04")
  assert.equal(toIso(nextAvailableDate(parseIso("2024-01-04"), -1, restricted)), "2024-01-01")
  assert.equal(nextAvailableDate(parseIso("2024-01-01"), 1, () => true, 10), null)
})

test("keeps year ranges anchored and clamped to min/max", () => {
  assert.deepEqual(yearRange({ anchors: [2018, 2016], before: 10, after: 5 }), { first: 2006, last: 2023 })
  assert.deepEqual(yearRange({ anchors: [2018], before: 100, after: 20, minYear: 2012, maxYear: 2023 }), { first: 2012, last: 2023 })
  assert.deepEqual(yearRange({ anchors: [3], before: 10, after: 0 }), { first: 1, last: 3 })
})
