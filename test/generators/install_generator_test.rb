# frozen_string_literal: true

require "test_helper"
require "generators/rails_datepicker/install_generator"

class InstallGeneratorTest < Rails::Generators::TestCase
  tests RailsDatepicker::Generators::InstallGenerator
  destination File.expand_path("../tmp/generator", __dir__)
  setup :prepare_destination

  setup do
    FileUtils.mkdir_p(File.join(destination_root, "config"))
    File.write(File.join(destination_root, "config/importmap.rb"), "# pins\n")
    FileUtils.mkdir_p(File.join(destination_root, "app/assets/tailwind"))
    File.write(File.join(destination_root, "app/assets/tailwind/application.css"), '@import "tailwindcss";\n')
  end

  test "installs configuration, JavaScript, importmap pin, and Tailwind source" do
    run_generator

    assert_file "config/initializers/rails_datepicker.rb"
    assert_file "app/javascript/controllers/rails_datepicker_controller.js"
    assert_file "app/javascript/rails-datepicker/calendar.js"
    assert_file "app/assets/tailwind/rails_datepicker.css"
    assert_file "config/importmap.rb", /rails-datepicker\/calendar/
    assert_file "app/assets/tailwind/application.css", /rails_datepicker/
  end

  test "can skip Tailwind integration" do
    run_generator ["--skip-tailwind"]

    assert_no_file "app/assets/tailwind/rails_datepicker.css"
  end

  test "uses a relative calendar import for JavaScript bundlers" do
    FileUtils.rm_f(File.join(destination_root, "config/importmap.rb"))
    run_generator ["--skip-tailwind"]

    assert_file "app/javascript/controllers/rails_datepicker_controller.js", /from "\.\.\/rails-datepicker\/calendar\.js"/
  end

  test "does not modify a non-Tailwind application stylesheet" do
    FileUtils.rm_f(File.join(destination_root, "app/assets/tailwind/application.css"))
    FileUtils.mkdir_p(File.join(destination_root, "app/assets/stylesheets"))
    File.write(File.join(destination_root, "app/assets/stylesheets/application.css"), "body { color: black; }\n")
    run_generator

    assert_file "app/assets/tailwind/rails_datepicker.css"
    assert_file "app/assets/stylesheets/application.css" do |content|
      assert_equal "body { color: black; }\n", content
    end
  end
end
