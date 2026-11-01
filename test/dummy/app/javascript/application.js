import "@hotwired/turbo-rails"
import { Application } from "@hotwired/stimulus"
import RailsDatepickerController from "rails-datepicker/controller"

window.Stimulus = Application.start()
window.Stimulus.register("rails-datepicker", RailsDatepickerController)
