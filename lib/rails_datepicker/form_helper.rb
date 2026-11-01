# frozen_string_literal: true

require "json"

module RailsDatepicker
  module FormHelper
    FIELD_OPTIONS = %i[
      calendar display_calendar locale date_format format theme week_start ethiopic_numerals
      dual_dates locale_follows_calendar inline min max disabled_dates readonly years_before years_after
    ].freeze

    def rails_datepicker_field(object_name, method, options = {})
      object = options.delete(:object) || rails_datepicker_object_for(object_name)
      builder = ActionView::Helpers::FormBuilder.new(object_name, object, self, {})
      builder.datepicker_field(method, options)
    end

    private

    def rails_datepicker_object_for(object_name)
      root = object_name.to_s.sub(/\[.*\]\z/, "")
      instance_variable_get("@#{root}")
    end
  end

  module FormBuilder
    def datepicker_field(method, options = {})
      config = RailsDatepicker.configuration
      picker = extract_picker_options(options, config)
      html_options = options.dup
      value = html_options.key?(:value) ? html_options.delete(:value) : object&.public_send(method)
      iso_value = canonical_iso(value)
      visible_value = display_value(iso_value, picker)
      base_id = html_options.delete(:id) || field_id(method)
      canonical_id = "#{base_id}_gregorian"
      disabled = html_options[:disabled]
      required = html_options[:required]
      readonly = picker[:readonly] || html_options.delete(:readonly)
      aria_options = html_options.delete(:aria)
      errors = object.respond_to?(:errors) ? object.errors[method] : []
      invalid = errors.any?

      data = stimulus_data(picker, iso_value)
      wrapper_classes = ["rdp", "rdp--#{picker[:theme]}", ("rdp--inline" if picker[:inline])].compact.join(" ")

      @template.content_tag(:div, class: wrapper_classes, lang: picker[:locale], data: data) do
        canonical = hidden_field(method,
          id: canonical_id,
          value: iso_value,
          disabled: disabled,
          data: { rails_datepicker_target: "canonical" })

        visible_options = html_options.merge(
          id: base_id,
          name: nil,
          value: visible_value,
          readonly: readonly,
          required: required,
          disabled: disabled,
          autocomplete: "off",
          inputmode: "numeric",
          role: "combobox",
          aria: input_aria(base_id, picker, invalid, aria_options),
          class: ["rdp__input", html_options[:class]].compact.join(" "),
          data: merge_data(html_options[:data],
            rails_datepicker_target: "input",
            action: "input->rails-datepicker#input blur->rails-datepicker#validate keydown->rails-datepicker#inputKeydown click->rails-datepicker#inputClick")
        )
        visible_options.delete(:class) if visible_options[:class].empty?
        input = text_field(method, visible_options)
        trigger = picker[:inline] ? nil : calendar_trigger(base_id, disabled, picker[:locale])
        input_group = @template.content_tag(:div, @template.safe_join([input, trigger].compact), class: "rdp__input-group")
        panel = calendar_panel(base_id, picker, disabled)
        error = if invalid
          @template.content_tag(:p, errors.to_sentence, id: "#{base_id}_error", class: "rdp__error", role: "alert")
        end

        @template.safe_join([canonical, input_group, panel, error].compact)
      end
    end

    private

    def extract_picker_options(options, config)
      date_format = options.delete(:date_format) || options.delete(:format) || config.date_format
      validate_date_format!(date_format)
      min = constraint_iso(options.delete(:min), :min)
      max = constraint_iso(options.delete(:max), :max)
      raise ArgumentError, "min must not be after max" if !min.empty? && !max.empty? && min > max
      years_before = Integer(options.delete(:years_before) || 100)
      years_after = Integer(options.delete(:years_after) || 20)
      raise ArgumentError, "year ranges must be non-negative" if years_before.negative? || years_after.negative?

      calendar = picker_enum!(:calendar, options.delete(:calendar) || config.default_calendar, Configuration::CALENDARS)
      locale_follows_calendar = options.key?(:locale_follows_calendar) ? !!options.delete(:locale_follows_calendar) : config.locale_follows_calendar
      requested_locale = options.delete(:locale) || config.default_locale
      locale = locale_follows_calendar ? locale_for_calendar(calendar) : picker_enum!(:locale, requested_locale, Configuration::LOCALES)
      {
        calendar: calendar,
        display_calendar: (picker_enum!(:display_calendar, options.delete(:display_calendar), Configuration::CALENDARS) if options[:display_calendar]),
        locale: locale,
        locale_follows_calendar: locale_follows_calendar,
        date_format: date_format,
        theme: picker_enum!(:theme, options.delete(:theme) || config.theme, Configuration::THEMES),
        week_start: picker_enum!(:week_start, options.delete(:week_start) || config.week_start, Configuration::WEEK_STARTS),
        ethiopic_numerals: !!options.delete(:ethiopic_numerals),
        dual_dates: options.key?(:dual_dates) ? !!options.delete(:dual_dates) : config.dual_dates,
        inline: !!options.delete(:inline),
        min: min,
        max: max,
        disabled_dates: Array(options.delete(:disabled_dates)).map { |date| constraint_iso(date, :disabled_dates) },
        readonly: !!options.delete(:readonly),
        years_before: years_before,
        years_after: years_after
      }
    end

    def validate_date_format!(format)
      tokens = format.to_s.scan(/YYYY|MM|DD/)
      return if tokens.length == 3 && tokens.uniq.length == 3

      raise ArgumentError, "date_format must contain YYYY, MM, and DD exactly once"
    end

    def constraint_iso(value, name)
      return "" if value.nil? || value == ""

      result = canonical_iso(value)
      RailsDatepicker::Calendar.parse_iso(result).strftime("%Y-%m-%d")
    rescue RailsDatepicker::Calendar::InvalidDate
      raise ArgumentError, "#{name} must be a Gregorian date or YYYY-MM-DD value"
    end

    def picker_enum!(name, value, allowed)
      normalized = value.to_sym
      return normalized if allowed.include?(normalized)

      raise ArgumentError, "invalid #{name}: #{value.inspect}; expected one of #{allowed.join(', ')}"
    end

    def stimulus_data(picker, iso_value)
      {
        controller: "rails-datepicker",
        action: "focusout->rails-datepicker#focusOut",
        rails_datepicker_calendar_value: picker[:calendar],
        rails_datepicker_display_calendar_value: picker[:display_calendar],
        rails_datepicker_locale_value: picker[:locale],
        rails_datepicker_format_value: picker[:date_format],
        rails_datepicker_theme_value: picker[:theme],
        rails_datepicker_week_start_value: picker[:week_start],
        rails_datepicker_ethiopic_numerals_value: picker[:ethiopic_numerals],
        rails_datepicker_dual_dates_value: picker[:dual_dates],
        rails_datepicker_locale_follows_calendar_value: picker[:locale_follows_calendar],
        rails_datepicker_inline_value: picker[:inline],
        rails_datepicker_min_value: picker[:min].to_s,
        rails_datepicker_max_value: picker[:max].to_s,
        rails_datepicker_disabled_dates_value: picker[:disabled_dates].to_json,
        rails_datepicker_years_before_value: picker[:years_before],
        rails_datepicker_years_after_value: picker[:years_after],
        rails_datepicker_selected_value: iso_value.to_s
      }
    end

    def calendar_trigger(base_id, disabled, locale)
      @template.button_tag(
        type: "button",
        class: "rdp__trigger",
        disabled: disabled,
        aria: { label: translate("open_calendar", locale), controls: "#{base_id}_calendar" },
        data: { rails_datepicker_label: "open_calendar", rails_datepicker_target: "trigger", action: "rails-datepicker#toggle" }
      ) do
        @template.content_tag(:svg, class: "rdp__icon", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", aria: { hidden: "true" }) do
          @template.safe_join([
            @template.tag.path(d: "M8 2v4M16 2v4M3 10h18", stroke_width: 2, stroke_linecap: "round"),
            @template.tag.rect(x: 3, y: 5, width: 18, height: 16, rx: 2, stroke_width: 2)
          ])
        end
      end
    end

    def calendar_panel(base_id, picker, disabled)
      @template.content_tag(:div,
        id: "#{base_id}_calendar",
        class: "rdp__popover",
        hidden: !picker[:inline],
        role: "dialog",
        aria: { modal: "false", label: translate("choose_date", picker[:locale]) },
        data: { rails_datepicker_label: "choose_date", rails_datepicker_target: "popover", action: "keydown->rails-datepicker#calendarKeydown" }) do
        @template.safe_join([
          calendar_header(picker[:locale], disabled),
          # Day buttons carry full date labels, so the visual weekday row is hidden from assistive tech.
          @template.content_tag(:div, "", class: "rdp__weekdays", aria: { hidden: "true" }, data: { rails_datepicker_target: "weekdays" }),
          @template.content_tag(:div, "", class: "rdp__grid", role: "grid", data: { rails_datepicker_target: "grid" }),
          @template.content_tag(:div, "", class: "rdp__sr-only", role: "status", aria: { live: "polite" }, data: { rails_datepicker_target: "status" }),
          calendar_footer(picker, disabled)
        ])
      end
    end

    def calendar_header(locale, disabled)
      @template.content_tag(:div, class: "rdp__header") do
        @template.safe_join([
          nav_button("previous_month", "previousMonth", "‹", locale, disabled, "previousButton"),
          @template.content_tag(:div, class: "rdp__selectors") do
            @template.safe_join([
              @template.select_tag(nil, "", class: "rdp__select", disabled: disabled, aria: { label: translate("month", locale) }, data: { rails_datepicker_label: "month", rails_datepicker_target: "monthSelect", action: "change->rails-datepicker#selectMonth" }),
              @template.select_tag(nil, "", class: "rdp__select", disabled: disabled, aria: { label: translate("year", locale) }, data: { rails_datepicker_label: "year", rails_datepicker_target: "yearSelect", action: "change->rails-datepicker#selectYear" })
            ])
          end,
          nav_button("next_month", "nextMonth", "›", locale, disabled, "nextButton")
        ])
      end
    end

    def calendar_footer(picker, disabled)
      locale = picker[:locale]
      @template.content_tag(:div, class: "rdp__footer") do
        @template.safe_join([
          @template.button_tag(translate("today", locale), type: "button", class: "rdp__footer-button", disabled: disabled, data: { rails_datepicker_text: "today", rails_datepicker_target: "todayButton", action: "rails-datepicker#today" }),
          @template.button_tag(translate("clear", locale), type: "button", class: "rdp__footer-button", disabled: disabled, data: { rails_datepicker_text: "clear", action: "rails-datepicker#clear" }),
          @template.button_tag("", type: "button", class: "rdp__locale-toggle", disabled: disabled, hidden: picker[:locale_follows_calendar],
            data: { rails_datepicker_target: "localeToggle", action: "rails-datepicker#switchLocale" }),
          @template.select_tag(nil, calendar_options(picker[:calendar], locale), class: "rdp__select rdp__calendar-select rdp__calendar-select--#{picker[:calendar]}", disabled: disabled,
            aria: { label: translate("calendar", locale) },
            data: { rails_datepicker_label: "calendar", rails_datepicker_target: "calendarSelect", action: "change->rails-datepicker#selectCalendar" })
        ])
      end
    end

    def calendar_options(active, locale)
      @template.options_for_select(
        RailsDatepicker::Configuration::CALENDARS.map { |calendar| [translate(calendar, locale), calendar.to_s] },
        active.to_s
      )
    end

    def locale_for_calendar(calendar)
      calendar == :ethiopian ? :am : :en
    end

    def nav_button(label, action, glyph, locale, disabled, target)
      @template.button_tag(glyph, type: "button", class: "rdp__nav", disabled: disabled, aria: { label: translate(label, locale) }, data: { rails_datepicker_label: label, rails_datepicker_target: target, action: "rails-datepicker##{action}" })
    end

    def canonical_iso(value)
      return "" if value.nil? || value == ""

      date = value.respond_to?(:to_date) ? value.to_date : RailsDatepicker::Calendar.parse_iso(value)
      date.strftime("%Y-%m-%d")
    rescue RailsDatepicker::Calendar::InvalidDate, Date::Error
      value.to_s
    end

    def display_value(iso_value, picker)
      return "" if iso_value.empty?

      date = RailsDatepicker::Calendar.parse_iso(iso_value)
      if (picker[:display_calendar] || picker[:calendar]) == :ethiopian
        RailsDatepicker::Calendar.format_ethiopian(date, picker[:date_format], numerals: picker[:ethiopic_numerals])
      else
        RailsDatepicker::Calendar.format_gregorian(date, picker[:date_format], numerals: picker[:ethiopic_numerals])
      end
    rescue RailsDatepicker::Calendar::InvalidDate
      iso_value
    end

    def input_aria(base_id, picker, invalid, existing)
      supplied = (existing || {}).to_h.transform_keys(&:to_sym)
      describedby = [supplied.delete(:describedby), ("#{base_id}_error" if invalid)].compact.join(" ")
      aria = {
        autocomplete: "none",
        controls: "#{base_id}_calendar",
        expanded: picker[:inline] ? "true" : "false",
        haspopup: "dialog",
        invalid: invalid.to_s
      }.merge(supplied)
      aria[:invalid] = "true" if invalid
      aria[:describedby] = describedby unless describedby.empty?
      aria
    end

    def merge_data(existing, additions)
      (existing || {}).to_h.transform_keys(&:to_sym).merge(additions) do |key, old_value, new_value|
        key.to_sym == :action ? "#{old_value} #{new_value}" : new_value
      end
    end

    def translate(key, locale)
      I18n.t("rails_datepicker.#{key}", locale: locale, default: key.to_s.tr("_", " ").capitalize)
    end
  end
end
