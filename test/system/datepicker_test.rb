# frozen_string_literal: true

require "application_system_test_case"

class DatepickerTest < ApplicationSystemTestCase
  setup do
    skip "set RUN_SYSTEM_TESTS=1 to run browser tests" unless ENV["RUN_SYSTEM_TESTS"] == "1"
    visit datepicker_path
  end

  test "switches calendars without changing the canonical date" do
    picker = find("[data-controller='rails-datepicker']", match: :first)
    canonical = picker.find("[data-rails-datepicker-target='canonical']", visible: :all)
    assert_equal "2023-09-12", canonical.value

    picker.find("[data-rails-datepicker-target='trigger']").click
    picker.find("[data-rails-datepicker-target='calendarSelect']").find("option[value='gregorian']").select_option

    assert_equal "2023-09-12", canonical.value
    assert_equal "2023-09-12", picker.find(".rdp__input").value
  end

  test "switches all calendar labels between Amharic and English" do
    picker = find(".rdp", match: :first)
    picker.find(".rdp__trigger").click
    picker.find("[data-rails-datepicker-target='localeToggle']").click
    assert_equal "en", picker["lang"]
    assert_equal "Open calendar", picker.find(".rdp__trigger")["aria-label"]
    assert_equal "Today", picker.find("[data-action='rails-datepicker#today']").text
    assert_equal "Meskerem", picker.find("[data-rails-datepicker-target='monthSelect'] option:checked").text
    picker.find("[data-rails-datepicker-target='localeToggle']").click
    assert_equal "am", picker["lang"]
    assert_equal "ዛሬ", picker.find("[data-action='rails-datepicker#today']").text
  end

  test "keeps Gregorian results after Ethiopian selection and calendar switching" do
    picker = find(".rdp:has(#gregorian_result)")
    picker.find(".rdp__trigger").click
    width = picker.find(".rdp__popover").evaluate_script("this.getBoundingClientRect().width")
    assert_operator width, :<=, 288
    picker.find("[data-iso='2023-09-14']").click
    assert_equal "2023-09-14", picker.find(".rdp__input").value
    assert_equal "2023-09-14", picker.find("input[type='hidden']", visible: :all).value
    picker.find(".rdp__trigger").click
    picker.find("[data-rails-datepicker-target='calendarSelect']").find("option[value='gregorian']").select_option
    assert_equal "2023-09-14", picker.find(".rdp__input").value
    picker.find(".rdp__input").fill_in(with: "2024-02-29")
    picker.find(".rdp__input").send_keys(:tab)
    assert_equal "2024-02-29", picker.find("input[type='hidden']", visible: :all).value
  end

  test "switches language together with the calendar when linked" do
    picker = find(".rdp:has(#linked_locale)")
    assert_equal "am", picker["lang"]
    picker.find(".rdp__trigger").click
    assert picker.find("[data-rails-datepicker-target='localeToggle']", visible: :hidden)
    assert_equal "ethiopian", picker.find("[data-rails-datepicker-target='calendarSelect']").value

    picker.find("[data-rails-datepicker-target='calendarSelect']").find("option[value='gregorian']").select_option
    assert_equal "en", picker["lang"]
    assert_equal "Today", picker.find("[data-action='rails-datepicker#today']").text
    assert_equal "gregorian", picker.find("[data-rails-datepicker-target='calendarSelect']").value
    assert_equal "Gregorian", picker.find("[data-rails-datepicker-target='calendarSelect'] option:checked").text
    assert_equal "2023-09-12", picker.find("input[type='hidden']", visible: :all).value

    picker.find("[data-rails-datepicker-target='calendarSelect']").find("option[value='ethiopian']").select_option
    assert_equal "am", picker["lang"]
    assert_equal "ዛሬ", picker.find("[data-action='rails-datepicker#today']").text
  end

  test "supports independent instances and disabled dates" do
    pickers = all("[data-controller='rails-datepicker']")
    pickers.first.find("[data-rails-datepicker-target='trigger']").click

    assert pickers.first.find("[data-iso='2023-09-13']", visible: :all).disabled?
    assert pickers.first.find(".rdp__popover", visible: :visible)
    assert pickers[1].find(".rdp__popover", visible: :hidden)
  end

  test "provides keyboard navigation and Escape focus restoration" do
    trigger = find("[data-rails-datepicker-target='trigger']", match: :first)
    trigger.click
    day = find("[data-rdp-day]:not([disabled])", match: :first)
    day.send_keys(:arrow_right)
    assert_selector "[data-rdp-day]:focus"
    page.send_keys(:escape)

    assert_equal trigger, page.evaluate_script("document.activeElement")
  end

  test "reconnects once after a Turbo Frame replacement and renders dark inline mode" do
    click_link "Replace frame"

    within("turbo-frame#datepicker_frame") do
      assert_selector ".rdp--dark.rdp--inline", count: 1
      assert_selector ".rdp__popover:not([hidden])", count: 1
      find(".rdp__day:not(.rdp__day--empty):not([disabled])", match: :first).click
      assert_selector "input[type='hidden'][value]:not([value=''])", visible: :all, count: 1
    end
  end

  test "strictly validates manual input and respects range restrictions" do
    input = find(".rdp__input", match: :first)
    input.fill_in(with: "2016-1-1")
    input.send_keys(:tab)
    assert_equal "true", input["aria-invalid"]

    input.fill_in(with: "2016-01-01")
    input.send_keys(:tab)
    assert_equal "false", input["aria-invalid"]
  end
end
