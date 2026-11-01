# frozen_string_literal: true

require "test_helper"
require "simple_form"
require "rails_datepicker/simple_form_input"

class SimpleFormInputTest < ActionView::TestCase
  include SimpleForm::ActionViewExtensions::FormHelper

  test "Simple Form input delegates to the datepicker builder" do
    student = Student.new(birth_date: Date.new(2023, 9, 12))
    html = simple_form_for(student, url: "/") do |form|
      form.input :birth_date, as: :rails_datepicker, calendar: :ethiopian, locale: :am
    end

    assert_includes html, 'data-controller="rails-datepicker"'
    assert_includes html, 'name="student[birth_date]"'
    assert_includes html, 'value="2016-01-01"'
  end
end
