# frozen_string_literal: true

require "test_helper"

class FormSubmissionTest < ActionDispatch::IntegrationTest
  test "submits Gregorian ISO into an Active Record date column" do
    post students_path, params: { student: { name: "Mimi", birth_date: "2023-09-12" } }

    assert_response :success
    assert_equal "2023-09-12", response.body
    assert_equal Date.new(2023, 9, 12), Student.last.birth_date
  end

  test "renders builder and standalone datepickers with canonical names" do
    get new_student_path

    assert_response :success
    assert_select "[data-controller='rails-datepicker']", count: 4
    assert_select "input[type='hidden'][name='student[birth_date]'][value='2023-09-12']", count: 4
    assert_select "input.rdp__input:not([name])", count: 4
  end
end
