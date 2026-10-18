# frozen_string_literal: true

require_relative "boot"
require "rails/all"
Bundler.require(*Rails.groups)
require "rails_datepicker"

module Dummy
  class Application < Rails::Application
    config.root = File.expand_path("..", __dir__)
    config.load_defaults 8.0
    config.eager_load = false
    config.secret_key_base = "test-secret-key-base-for-rails-datepicker"
    config.hosts.clear
  end
end
