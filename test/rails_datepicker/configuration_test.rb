# frozen_string_literal: true

require "minitest/autorun"
require_relative "../../lib/rails_datepicker/configuration"

class RailsDatepickerConfigurationTest < Minitest::Test
  def setup
    @configuration = RailsDatepicker::Configuration.new
  end

  def test_defaults
    assert_equal :ethiopian, @configuration.default_calendar
    assert_equal :am, @configuration.default_locale
    assert_equal "YYYY-MM-DD", @configuration.date_format
    assert_equal :auto, @configuration.theme
    assert_equal :sunday, @configuration.week_start
  end

  def test_accepts_supported_values
    @configuration.default_calendar = "gregorian"
    @configuration.default_locale = "en"
    @configuration.theme = "dark"
    @configuration.week_start = "monday"

    assert_equal :gregorian, @configuration.default_calendar
    assert_equal :en, @configuration.default_locale
    assert_equal :dark, @configuration.theme
    assert_equal :monday, @configuration.week_start
  end

  def test_rejects_unsupported_values
    assert_raises(ArgumentError) { @configuration.default_calendar = :julian }
    assert_raises(ArgumentError) { @configuration.default_locale = :fr }
    assert_raises(ArgumentError) { @configuration.theme = :neon }
    assert_raises(ArgumentError) { @configuration.week_start = :tuesday }
    assert_raises(ArgumentError) { @configuration.date_format = "YYYY-MM" }
    assert_raises(ArgumentError) { @configuration.date_format = "YYYY-YYYY-MM-DD" }
  end
end
