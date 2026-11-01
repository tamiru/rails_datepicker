# frozen_string_literal: true

Rails.application.routes.draw do
  resources :students, only: %i[new create]
  get "/datepicker", to: "students#new"
  get "/datepicker/frame", to: "students#frame"
end
