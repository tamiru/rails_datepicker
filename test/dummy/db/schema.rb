ActiveRecord::Schema.define(version: 1) do
  create_table :students, force: true do |table|
    table.string :name
    table.date :birth_date
    table.timestamps
  end
end
