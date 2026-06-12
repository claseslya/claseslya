Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      post 'auth/login', to: 'auth#login'
      resources :alumnos,    only: [:index, :show, :create, :update, :destroy]
      resources :apoderados, only: [:index, :show, :create, :update]
      resources :materias,   only: [:index, :create]
      resources :tutores,    only: [:index]
      resources :sesiones,   only: [:index, :show, :create, :update, :destroy]
      resources :pagos, only: [:index, :create, :update, :destroy] do
        collection { post :generar_pendientes }
      end
      get 'metricas/dashboard', to: 'metricas#dashboard'
      get 'metricas/tutor',    to: 'metricas#tutor'
      resources :pre_registros, only: [:index, :create, :update]
      namespace :public do
        resources :tutores, only: [:index]
      end
    end
  end
end
