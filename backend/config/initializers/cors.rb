Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins_list = ['http://localhost:5173', 'http://localhost:5174']
    origins_list << ENV['FRONTEND_URL'] if ENV['FRONTEND_URL'].present?

    origins origins_list

    resource '*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head]
  end
end
