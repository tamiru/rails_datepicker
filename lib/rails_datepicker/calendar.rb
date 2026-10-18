# frozen_string_literal: true

require "date"

module RailsDatepicker
  module Calendar
    class InvalidDate < ArgumentError; end

    ETHIOPIAN_ANCHOR_YEAR = 2015
    ETHIOPIAN_ANCHOR_DATE = Date.new(2022, 9, 11, Date::GREGORIAN)

    module_function

    def ethiopian_leap_year?(year)
      Integer(year) % 4 == 3
    end

    def gregorian_leap_year?(year)
      Date.gregorian_leap?(Integer(year))
    end

    def ethiopian_month_length(year, month)
      year = Integer(year)
      month = Integer(month)
      raise InvalidDate, "Ethiopian month must be between 1 and 13" unless (1..13).cover?(month)

      return 30 if month <= 12

      ethiopian_leap_year?(year) ? 6 : 5
    end

    def valid_ethiopian_date?(year, month, day)
      year = Integer(year)
      month = Integer(month)
      day = Integer(day)
      year.positive? && day.between?(1, ethiopian_month_length(year, month))
    rescue ArgumentError, TypeError
      false
    end

    def ethiopian_to_gregorian(year, month, day)
      year, month, day = [year, month, day].map { |part| Integer(part) }
      raise InvalidDate, "invalid Ethiopian date" unless valid_ethiopian_date?(year, month, day)

      new_year = ethiopian_new_year(year)
      new_year + ((month - 1) * 30) + day - 1
    end

    def gregorian_to_ethiopian(value, month = nil, day = nil)
      date = coerce_gregorian(value, month, day)
      raise InvalidDate, "date predates the Ethiopian calendar" if date < ethiopian_new_year(1)

      ethiopian_year = [date.year - 7, 1].max
      ethiopian_year -= 1 while date < ethiopian_new_year(ethiopian_year)
      ethiopian_year += 1 while date >= ethiopian_new_year(ethiopian_year + 1)
      offset = (date - ethiopian_new_year(ethiopian_year)).to_i

      [ethiopian_year, (offset / 30) + 1, (offset % 30) + 1]
    end

    def ethiopian_new_year(ethiopian_year)
      ethiopian_year = Integer(ethiopian_year)
      raise InvalidDate, "Ethiopian year must be positive" unless ethiopian_year.positive?

      ETHIOPIAN_ANCHOR_DATE + days_before_ethiopian_year(ethiopian_year) -
        days_before_ethiopian_year(ETHIOPIAN_ANCHOR_YEAR)
    end

    def days_before_ethiopian_year(year)
      (365 * (year - 1)) + (year / 4)
    end
    private_class_method :days_before_ethiopian_year

    def parse_iso(value)
      match = /\A(\d{4,})-(\d{2})-(\d{2})\z/.match(value.to_s)
      raise InvalidDate, "date must use YYYY-MM-DD" unless match

      Date.new(*match.captures.map(&:to_i), Date::GREGORIAN)
    rescue Date::Error
      raise InvalidDate, "invalid Gregorian date"
    end

    def format_ethiopian(date, format = "YYYY-MM-DD", numerals: false)
      year, month, day = gregorian_to_ethiopian(date)
      formatted = apply_format(format, year, month, day)
      numerals ? to_ethiopic_numerals(formatted) : formatted
    end

    def format_gregorian(date, format = "YYYY-MM-DD", numerals: false)
      date = coerce_gregorian(date)
      formatted = apply_format(format, date.year, date.month, date.day)
      numerals ? to_ethiopic_numerals(formatted) : formatted
    end

    def to_ethiopic_numerals(value)
      value.to_s.gsub(/\d+/) { |digits| encode_ethiopic_integer(digits.to_i) }
    end

    def apply_format(format, year, month, day)
      format.to_s.gsub("YYYY", year.to_s.rjust(4, "0"))
        .gsub("MM", month.to_s.rjust(2, "0"))
        .gsub("DD", day.to_s.rjust(2, "0"))
    end
    private_class_method :apply_format

    def coerce_gregorian(value, month = nil, day = nil)
      return Date.new(Integer(value), Integer(month), Integer(day), Date::GREGORIAN) unless month.nil? || day.nil?
      return value if value.is_a?(Date)
      return value.to_date if value.respond_to?(:to_date)

      parse_iso(value)
    rescue Date::Error, ArgumentError, TypeError
      raise InvalidDate, "invalid Gregorian date"
    end
    private_class_method :coerce_gregorian

    ETHIOPIC_ONES = ["", "፩", "፪", "፫", "፬", "፭", "፮", "፯", "፰", "፱"].freeze
    ETHIOPIC_TENS = ["", "፲", "፳", "፴", "፵", "፶", "፷", "፸", "፹", "፺"].freeze

    def encode_ethiopic_integer(number)
      return "0" if number.zero?

      groups = []
      while number.positive?
        groups.unshift(number % 100)
        number /= 100
      end

      groups.each_with_index.filter_map do |group, index|
        power = groups.length - index - 1
        next if group.zero?

        coefficient = if group == 1 && power.positive?
                        ""
                      else
                        "#{ETHIOPIC_TENS[group / 10]}#{ETHIOPIC_ONES[group % 10]}"
                      end
        marker = if power.zero?
                   ""
                 elsif power.odd?
                   "፼" * (power / 2) + "፻"
                 else
                   "፼" * (power / 2)
                 end
        "#{coefficient}#{marker}"
      end.join
    end
    private_class_method :encode_ethiopic_integer
  end
end
