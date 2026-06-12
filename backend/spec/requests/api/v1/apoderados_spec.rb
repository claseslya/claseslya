require 'rails_helper'

RSpec.describe 'Api::V1::Apoderados', type: :request do
  def auth_header(tutor)
    token = JsonWebToken.encode({ tutor_id: tutor.id })
    { 'Authorization' => "Bearer #{token}" }
  end

  let!(:admin) { Tutor.create!(nombre: 'Admin', email: 'admin@test.cl', password: 'pass123', rol: :admin) }
  let!(:apoderado) { Apoderado.create!(nombre: 'María González', email: 'maria@test.cl', relacion: 'madre') }
  let!(:alumno) { Alumno.create!(nombre: 'Sofía', nivel: :basica, curso: 7, apoderado: apoderado) }

  describe 'GET /api/v1/apoderados' do
    it 'lista apoderados con count de alumnos' do
      get '/api/v1/apoderados', headers: auth_header(admin)
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['data'].size).to eq(1)
      expect(json['data'].first['alumnos_count']).to eq(1)
    end
  end

  describe 'GET /api/v1/apoderados/:id' do
    it 'devuelve apoderado con sus alumnos' do
      get "/api/v1/apoderados/#{apoderado.id}", headers: auth_header(admin)
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json.dig('data', 'alumnos').size).to eq(1)
      expect(json.dig('data', 'alumnos', 0, 'nombre')).to eq('Sofía')
    end
  end

  describe 'POST /api/v1/apoderados' do
    it 'admin puede crear un apoderado' do
      post '/api/v1/apoderados',
           params: { apoderado: { nombre: 'Pedro', relacion: 'padre' } },
           headers: auth_header(admin)
      expect(response).to have_http_status(:created)
      expect(JSON.parse(response.body).dig('data', 'nombre')).to eq('Pedro')
    end
  end

  describe 'PATCH /api/v1/apoderados/:id' do
    it 'admin puede actualizar un apoderado' do
      patch "/api/v1/apoderados/#{apoderado.id}",
            params: { apoderado: { telefono: '+56912345678' } },
            headers: auth_header(admin)
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).dig('data', 'telefono')).to eq('+56912345678')
    end
  end
end
