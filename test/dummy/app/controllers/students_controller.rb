# frozen_string_literal: true

class StudentsController < ApplicationController
  def new
    @student = Student.new(birth_date: Date.new(2023, 9, 12))
  end

  def create
    @student = Student.new(student_params)
    if @student.save
      render plain: @student.birth_date.iso8601
    else
      render :new, status: :unprocessable_entity
    end
  end

  def frame
    @student = Student.new(birth_date: Date.new(2024, 1, 1))
    render :frame
  end

  private

  def student_params
    params.require(:student).permit(:name, :birth_date)
  end
end
