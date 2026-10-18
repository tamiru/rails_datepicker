# frozen_string_literal: true

require "rails/generators"

module RailsDatepicker
  module Generators
    class InstallGenerator < Rails::Generators::Base
      source_root File.expand_path("templates", __dir__)

      class_option :skip_tailwind, type: :boolean, default: false, desc: "Skip Tailwind CSS integration"

      def copy_initializer
        template "initializer.rb.tt", "config/initializers/rails_datepicker.rb"
      end

      def install_javascript
        copy_file gem_file("app/javascript/controllers/rails_datepicker_controller.js"), "app/javascript/controllers/rails_datepicker_controller.js"
        copy_file gem_file("app/javascript/rails-datepicker/calendar.js"), "app/javascript/rails-datepicker/calendar.js"
        unless importmap?
          gsub_file "app/javascript/controllers/rails_datepicker_controller.js",
            'from "rails-datepicker/calendar"',
            'from "../rails-datepicker/calendar.js"'
        end
      end

      def configure_importmap
        return unless importmap?
        return if File.read(destination_path("config/importmap.rb")).include?('pin "rails-datepicker/calendar"')

        append_to_file "config/importmap.rb", <<~RUBY

          # rails-datepicker (the controller itself is discovered by stimulus-rails)
          pin "rails-datepicker/calendar", to: "rails-datepicker/calendar.js"
        RUBY
      end

      def install_tailwind
        return if options[:skip_tailwind]

        stylesheet = tailwind_stylesheet
        component_path = if stylesheet
          File.join(File.dirname(stylesheet), "rails_datepicker.css")
        else
          "app/assets/tailwind/rails_datepicker.css"
        end
        copy_file gem_file("app/assets/stylesheets/rails_datepicker.css"), component_path
        if stylesheet
          import = '@import "./rails_datepicker.css";'
          append_to_file(stylesheet, "\n#{import}\n") unless File.read(destination_path(stylesheet)).include?(import)
        else
          say "Tailwind entrypoint not found. Import app/assets/tailwind/rails_datepicker.css from your Tailwind CSS 4 stylesheet.", :yellow
        end
      end

      def finish
        say "Rails Datepicker installed. Restart the asset watcher before testing the field.", :green
      end

      private

      def gem_file(relative)
        File.expand_path("../../../#{relative}", __dir__)
      end

      def destination_path(relative)
        File.join(destination_root, relative)
      end

      def tailwind_stylesheet
        known = %w[
          app/assets/tailwind/application.css
          app/assets/stylesheets/application.tailwind.css
        ].find { |path| File.exist?(destination_path(path)) }
        return known if known

        generic = "app/assets/stylesheets/application.css"
        return unless File.exist?(destination_path(generic))

        generic if File.read(destination_path(generic)).match?(/@import\s+["']tailwindcss["']/)
      end

      def importmap?
        File.exist?(destination_path("config/importmap.rb"))
      end
    end
  end
end
