# frozen_string_literal: true

require "minitest/autorun"
require_relative "../../lib/rails_datepicker/calendar"

class RailsDatepickerCalendarTest < Minitest::Test
  Calendar = RailsDatepicker::Calendar

  def test_ethiopian_new_year_boundaries
    assert_equal Date.new(2022, 9, 11), Calendar.ethiopian_to_gregorian(2015, 1, 1)
    assert_equal Date.new(2023, 9, 12), Calendar.ethiopian_to_gregorian(2016, 1, 1)
    assert_equal [2015, 13, 6], Calendar.gregorian_to_ethiopian(Date.new(2023, 9, 11))
    assert_equal [2016, 1, 1], Calendar.gregorian_to_ethiopian(Date.new(2023, 9, 12))
  end

  def test_conversion_remains_accurate_across_gregorian_century_boundaries
    assert_equal Date.new(2099, 9, 12, Date::GREGORIAN), Calendar.ethiopian_new_year(2092)
    assert_equal [2091, 13, 6], Calendar.gregorian_to_ethiopian(Date.new(2099, 9, 11, Date::GREGORIAN))
    assert_equal [2092, 1, 1], Calendar.gregorian_to_ethiopian(Date.new(2099, 9, 12, Date::GREGORIAN))
    assert_equal Date.new(2103, 9, 13, Date::GREGORIAN), Calendar.ethiopian_new_year(2096)
  end

  def test_pagume_and_ethiopian_leap_years
    assert Calendar.ethiopian_leap_year?(2011)
    refute Calendar.ethiopian_leap_year?(2012)
    assert_equal 6, Calendar.ethiopian_month_length(2011, 13)
    assert_equal 5, Calendar.ethiopian_month_length(2012, 13)
    assert_equal Date.new(2019, 9, 11), Calendar.ethiopian_to_gregorian(2011, 13, 6)
    assert_raises(RailsDatepicker::Calendar::InvalidDate) { Calendar.ethiopian_to_gregorian(2012, 13, 6) }
  end

  def test_gregorian_leap_year_rules
    assert Calendar.gregorian_leap_year?(2000)
    refute Calendar.gregorian_leap_year?(2100)
    assert Calendar.gregorian_leap_year?(2024)
  end

  def test_round_trip_over_reference_range
    (1900..2100).each do |year|
      [1, 3, 6, 9, 12].each do |month|
        date = Date.new(year, month, 15)
        ethiopian = Calendar.gregorian_to_ethiopian(date)
        assert_equal date, Calendar.ethiopian_to_gregorian(*ethiopian)
      end
    end
  end

  def test_strict_iso_parsing
    assert_equal Date.new(2024, 2, 29), Calendar.parse_iso("2024-02-29")
    assert_raises(RailsDatepicker::Calendar::InvalidDate) { Calendar.parse_iso("2024-2-29") }
    assert_raises(RailsDatepicker::Calendar::InvalidDate) { Calendar.parse_iso("2023-02-29") }
  end

  def test_ethiopic_numeral_formatting
    assert_equal "፳፻፲፮-፲፫-፮", Calendar.to_ethiopic_numerals("2016-13-06")
  end
end
