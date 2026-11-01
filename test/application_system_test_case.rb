# frozen_string_literal: true

require "test_helper"

class ApplicationSystemTestCase < ActionDispatch::SystemTestCase
  if ENV["RUN_SYSTEM_TESTS"] == "1"
    driven_by :selenium, using: :headless_chrome, screen_size: [375, 812]
  else
    driven_by :rack_test
  end
end
