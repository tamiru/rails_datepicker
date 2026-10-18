# frozen_string_literal: true

return unless defined?(SimpleForm::Inputs::Base)

class RailsDatepickerInput < SimpleForm::Inputs::Base
  PICKER_KEYS = RailsDatepicker::FormHelper::FIELD_OPTIONS

  def input(wrapper_options = nil)
    merged = merge_wrapper_options(input_html_options, wrapper_options)
    picker_options = options.slice(*PICKER_KEYS)
    @builder.datepicker_field(attribute_name, picker_options.merge(merged))
  end

  def input_type
    :string
  end
end
