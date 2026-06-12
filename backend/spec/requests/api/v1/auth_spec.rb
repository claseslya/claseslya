require 'rails_helper'

RSpec.describe 'POST /api/v1/auth/login', type: :request do
  let!(:tutor) do
    Tutor.create!(
      nombre: 'Arthur',
      email: 'arthur@test.cl',
      password: 'password123',
      rol: :admin
    )
  end

  describe 'con credenciales correctas' do
    it 'devuelve 200 y un token JWT con datos del tutor' do
      post '/api/v1/auth/login', params: { email: tutor.email, password: 'password123' }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json.dig('data', 'token')).to be_present
      expect(json.dig('data', 'tutor', 'email')).to eq(tutor.email)
      expect(json.dig('data', 'tutor', 'rol')).to eq('admin')
    end
  end

  describe 'con contraseña incorrecta' do
    it 'devuelve 401 con mensaje de error' do
      post '/api/v1/auth/login', params: { email: tutor.email, password: 'mal' }

      expect(response).to have_http_status(:unauthorized)
      json = JSON.parse(response.body)
      expect(json['error']).to eq('Email o contraseña incorrectos')
    end
  end

  describe 'con email inexistente' do
    it 'devuelve 401 con mensaje de error' do
      post '/api/v1/auth/login', params: { email: 'noexiste@test.cl', password: 'password123' }

      expect(response).to have_http_status(:unauthorized)
      json = JSON.parse(response.body)
      expect(json['error']).to eq('Email o contraseña incorrectos')
    end
  end
end
