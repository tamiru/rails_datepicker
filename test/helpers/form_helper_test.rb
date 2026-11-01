# frozen_string_literal: true

require "test_helper"

class FormHelperTest < ActionView::TestCase
  include RailsDatepicker::FormHelper

  test "preserves field attributes and nested names" do
    student = Student.new(birth_date: Date.new(2023, 9, 12))
    html = form_for(student, url: "/") do |form|
      form.fields_for(:profile) do |nested|
        nested.datepicker_field(:birth_date, required: true, disabled: true, class: "custom")
      end
    end

    assert_includes html, 'name="student[profile][birth_date]"'
    assert_includes html, "required=\"required\""
    assert_includes html, "disabled=\"disabled\""
    assert_includes html, "custom"
  end

  test "calendar switching data keeps canonical value" do
    student = Student.new(birth_date: Date.new(2023, 9, 12))
    html = rails_datepicker_field(:student, :birth_date, object: student, calendar: :ethiopian)

    assert_includes html, 'value="2023-09-12"'
    assert_includes html, 'value="2016-01-01"'
  end

  test "displays Gregorian results when choosing from the Ethiopian calendar" do
    html = rails_datepicker_field(:student, :birth_date,
      object: Student.new(birth_date: Date.new(2023, 9, 12)),
      calendar: :ethiopian, display_calendar: :gregorian)
    fragment = Nokogiri::HTML.fragment(html)
    assert_equal "2023-09-12", fragment.at_css(".rdp__input")["value"]
    assert_equal "gregorian", fragment.at_css(".rdp")["data-rails-datepicker-display-calendar-value"]
    assert fragment.at_css("[data-action='rails-datepicker#switchLocale']")
  end

  test "uses the field locale and preserves custom accessibility attributes" do
    student = Student.new
    student.errors.add(:birth_date, "is invalid")
    html = rails_datepicker_field(
      :student,
      :birth_date,
      object: student,
      locale: :am,
      aria: { label: "Birth date", describedby: "birth_date_hint" },
      data: { action: "focus->hint#show" }
    )
    fragment = Nokogiri::HTML.fragment(html)
    wrapper = fragment.at_css("[data-controller='rails-datepicker']")
    input = fragment.at_css("input.rdp__input")

    assert_equal "am", wrapper["lang"]
    assert_equal "Birth date", input["aria-label"]
    assert_equal "birth_date_hint student_birth_date_error", input["aria-describedby"]
    assert_includes input["data-action"], "focus->hint#show"
    assert_equal "ቀን መቁጠሪያ ክፈት", fragment.at_css(".rdp__trigger")["aria-label"]
    assert_equal "ዛሬ", fragment.at_css(".rdp__footer-button").text
  end

  test "disables every interactive control in a disabled inline picker" do
    html = rails_datepicker_field(
      :student,
      :birth_date,
      object: Student.new,
      inline: true,
      disabled: true
    )
    fragment = Nokogiri::HTML.fragment(html)
    controls = fragment.css(".rdp__popover button, .rdp__popover select")

    assert controls.any?
    assert controls.all? { |control| control.key?("disabled") }
  end

  test "renders navigation targets, a live region, and accessible weekday headers" do
    html = rails_datepicker_field(:student, :birth_date, object: Student.new)
    fragment = Nokogiri::HTML.fragment(html)

    assert fragment.at_css(".rdp__nav[data-rails-datepicker-target='previousButton']")
    assert fragment.at_css(".rdp__nav[data-rails-datepicker-target='nextButton']")
    assert fragment.at_css("[data-rails-datepicker-target='todayButton']")
    assert_equal "polite", fragment.at_css("[data-rails-datepicker-target='status']")["aria-live"]
    assert_equal "true", fragment.at_css(".rdp__weekdays")["aria-hidden"]
    assert_includes fragment.at_css(".rdp")["data-action"], "focusout->rails-datepicker#focusOut"
    assert_includes fragment.at_css(".rdp__input")["data-action"], "click->rails-datepicker#inputClick"
  end

  test "renders a calendar dropdown and derives the locale from the calendar when linked" do
    html = rails_datepicker_field(:student, :birth_date, object: Student.new, calendar: :gregorian, locale: :am, locale_follows_calendar: true)
    fragment = Nokogiri::HTML.fragment(html)
    picker = fragment.at_css(".rdp")

    assert_equal "en", picker["lang"]
    assert_equal "true", picker["data-rails-datepicker-locale-follows-calendar-value"]
    assert_equal "en", picker["data-rails-datepicker-locale-value"]
    assert fragment.at_css(".rdp__locale-toggle").key?("hidden")
    select = fragment.at_css("select[data-rails-datepicker-target='calendarSelect']")
    assert_equal %w[ethiopian gregorian], select.css("option").map { |option| option["value"] }
    assert_equal %w[Ethiopian Gregorian], select.css("option").map(&:text)
    assert_equal "gregorian", select.at_css("option[selected]")["value"]
    assert_equal "Calendar", select["aria-label"]

    unlinked = Nokogiri::HTML.fragment(rails_datepicker_field(:student, :birth_date, object: Student.new, calendar: :gregorian, locale: :am))
    assert_equal "am", unlinked.at_css(".rdp")["lang"]
    refute unlinked.at_css(".rdp__locale-toggle").key?("hidden")
  end

  test "dual dates follow configuration unless overridden per field" do
    default = Nokogiri::HTML.fragment(rails_datepicker_field(:student, :birth_date, object: Student.new))
    assert_equal "false", default.at_css(".rdp")["data-rails-datepicker-dual-dates-value"]

    RailsDatepicker.configuration.dual_dates = true
    configured = Nokogiri::HTML.fragment(rails_datepicker_field(:student, :birth_date, object: Student.new))
    overridden = Nokogiri::HTML.fragment(rails_datepicker_field(:student, :birth_date, object: Student.new, dual_dates: false))
    assert_equal "true", configured.at_css(".rdp")["data-rails-datepicker-dual-dates-value"]
    assert_equal "false", overridden.at_css(".rdp")["data-rails-datepicker-dual-dates-value"]
  ensure
    RailsDatepicker.configuration.dual_dates = false
  end
end
