# frozen_string_literal: true

require "rails/engine"
require_relative "form_helper"

module RailsDatepicker
  class Engine < ::Rails::Engine
    isolate_namespace RailsDatepicker

    initializer "rails_datepicker.helpers" do
      ActiveSupport.on_load(:action_view) do
        include RailsDatepicker::FormHelper
      end
      ActionView::Helpers::FormBuilder.include RailsDatepicker::FormBuilder
    end

    initializer "rails_datepicker.importmap", before: "importmap" do |app|
      if app.config.respond_to?(:importmap)
        app.config.importmap.paths << root.join("config/importmap.rb")
        app.config.assets.paths << root.join("app/javascript") if app.config.respond_to?(:assets)
      end
    end

    config.after_initialize do
      if defined?(SimpleForm) || Gem.loaded_specs.key?("simple_form")
        require "simple_form" unless defined?(SimpleForm)
        require "rails_datepicker/simple_form_input"
      end
    end
  end
end
