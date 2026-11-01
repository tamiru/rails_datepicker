# frozen_string_literal: true

class Student < ApplicationRecord
  validates :name, presence: true
end
