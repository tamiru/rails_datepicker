# frozen_string_literal: true

require_relative "lib/rails_datepicker/version"

Gem::Specification.new do |spec|
  spec.name = "rails-datepicker"
  spec.version = RailsDatepicker::VERSION
  spec.authors = ["Tamiru Hailu"]
  spec.email = ["tamiruhailu@gmail.com"]
  spec.summary = "An accessible Ethiopian and Gregorian datepicker for Rails 8"
  spec.description = "A Rails 8 engine providing a Stimulus 3 and Tailwind CSS 4 datepicker with accurate Ethiopian/Gregorian conversion."
  spec.homepage = "https://github.com/tamiru/rails_datepicker"
  spec.license = "MIT"
  spec.required_ruby_version = ">= 4.0.0"

  spec.metadata = {
    "homepage_uri" => spec.homepage,
    "source_code_uri" => "#{spec.homepage}/tree/main",
    "changelog_uri" => "#{spec.homepage}/blob/main/CHANGELOG.md",
    "bug_tracker_uri" => "#{spec.homepage}/issues",
    "funding_uri" => "https://github.com/sponsors/tamiru",
    "allowed_push_host" => "https://rubygems.org",
    "rubygems_mfa_required" => "true"
  }

  spec.files = Dir.chdir(__dir__) do
    Dir["{app,config,lib}/**/*", "CHANGELOG.md", "LICENSE.txt", "README.md", "Rakefile", "package.json", "rails-datepicker.gemspec"]
      .reject do |path|
        File.directory?(path) || path.match?(%r{(?:^|/)(?:\.idea|log|tmp|storage|pkg)(?:/|$)|\.(?:gem|sqlite3|log)\z|Zone\.Identifier\z})
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
