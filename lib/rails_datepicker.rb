# frozen_string_literal: true

require_relative "rails_datepicker/version"
require_relative "rails_datepicker/configuration"
require_relative "rails_datepicker/calendar"

module RailsDatepicker
  class << self
    attr_writer :configuration

    def configuration
      @configuration ||= Configuration.new
    end

    def configure
      yield(configuration)
    end

    def reset_configuration!
      @configuration = Configuration.new
    end
  end
end

require_relative "rails_datepicker/engine" if defined?(Rails::Engine)
