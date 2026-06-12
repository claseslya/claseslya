require 'rails_helper'

RSpec.describe 'Api::V1::Materias', type: :request do
  def auth_header(tutor)
    token = JsonWebToken.encode({ tutor_id: tutor.id })
    { 'Authorization' => "Bearer #{token}" }
  end

  let!(:admin) { Tutor.create!(nombre: 'Admin', email: 'admin@test.cl', password: 'pass123', rol: :admin) }
  let!(:tutor) { Tutor.create!(nombre: 'Laura', email: 'laura@test.cl', password: 'pass123', rol: :tutor) }
  let!(:materia) { Materia.create!(nombre: 'Matemáticas') }

  describe 'GET /api/v1/materias' do
    it 'admin puede listar materias' do
      get '/api/v1/materias', headers: auth_header(admin)
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['data'].first['nombre']).to eq('Matemáticas')
    end

    it 'tutor también puede listar materias' do
      get '/api/v1/materias', headers: auth_header(tutor)
      expect(response).to have_http_status(:ok)
    end
  end

  describe 'POST /api/v1/materias' do
    it 'admin puede crear una materia' do
      post '/api/v1/materias',
           params: { materia: { nombre: 'Historia' } },
           headers: auth_header(admin)
      expect(response).to have_http_status(:created)
      expect(JSON.parse(response.body).dig('data', 'nombre')).to eq('Historia')
    end

    it 'tutor recibe 403 al intentar crear' do
      post '/api/v1/materias',
           params: { materia: { nombre: 'Nueva' } },
           headers: auth_header(tutor)
      expect(response).to have_http_status(:forbidden)
    end
  end
end
