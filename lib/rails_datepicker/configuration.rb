# frozen_string_literal: true

module RailsDatepicker
  class Configuration
    CALENDARS = %i[ethiopian gregorian].freeze
    LOCALES = %i[am en].freeze
    THEMES = %i[auto light dark].freeze
    WEEK_STARTS = %i[sunday monday].freeze

    attr_reader :default_calendar, :default_locale, :date_format, :theme, :week_start

    def initialize
      @default_calendar = :ethiopian
      @default_locale = :am
      @date_format = "YYYY-MM-DD"
      @theme = :auto
      @week_start = :sunday
    end

    def default_calendar=(value)
      @default_calendar = validate!(:calendar, value, CALENDARS)
    end

    def default_locale=(value)
      @default_locale = validate!(:locale, value, LOCALES)
    end

    def theme=(value)
      @theme = validate!(:theme, value, THEMES)
    end

    def week_start=(value)
      @week_start = validate!(:week_start, value, WEEK_STARTS)
    end

    def date_format=(value)
      format = value.to_s
      tokens = format.scan(/YYYY|MM|DD/)
      unless tokens.length == 3 && tokens.uniq.length == 3
        raise ArgumentError, "date_format must contain YYYY, MM, and DD exactly once"
      end

      @date_format = format
    end

    private

    def validate!(name, value, allowed)
      normalized = value.to_sym
      return normalized if allowed.include?(normalized)

      raise ArgumentError, "invalid #{name}: #{value.inspect}; expected one of #{allowed.join(', ')}"
    end
  end
end
