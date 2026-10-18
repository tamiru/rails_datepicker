# frozen_string_literal: true

require_relative "lib/rails_datepicker/version"

Gem::Specification.new do |spec|
  spec.name = "rails-datepicker"
  spec.version = RailsDatepicker::VERSION
  spec.authors = ["Tamiru"]
  spec.summary = "An accessible Ethiopian and Gregorian datepicker for Rails 8"
  spec.description = "A Rails 8 engine providing a Stimulus 3 and Tailwind CSS 4 datepicker with accurate Ethiopian/Gregorian conversion."
  spec.homepage = "https://rubygems.org/gems/rails-datepicker"
  spec.license = "MIT"
  spec.required_ruby_version = ">= 3.2.0"

  spec.metadata = { "rubygems_mfa_required" => "true" }

  spec.files = Dir.chdir(__dir__) do
    Dir["{app,config,lib,test}/**/*", "CHANGELOG.md", "LICENSE.txt", "README.md", "package.json"]
      .reject do |path|
        File.directory?(path) ||
          path.start_with?("test/tmp/", "test/dummy/log/", "test/dummy/storage/", "test/dummy/tmp/")
      end
  end
  spec.require_paths = ["lib"]

  spec.add_dependency "railties", ">= 8.0", "< 9.0"
  spec.add_dependency "actionview", ">= 8.0", "< 9.0"

  spec.add_development_dependency "capybara", "~> 3.40"
  spec.add_development_dependency "importmap-rails", "~> 2.1"
  spec.add_development_dependency "minitest", ">= 5.25", "< 7"
  spec.add_development_dependency "puma", ">= 6.4", "< 9"
  spec.add_development_dependency "rake", "~> 13.2"
  spec.add_development_dependency "selenium-webdriver", "~> 4.25"
  spec.add_development_dependency "simple_form", "~> 5.3"
  spec.add_development_dependency "sqlite3", "~> 2.1"
end
