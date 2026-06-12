require 'rails_helper'

RSpec.describe 'Api::V1::PreRegistros', type: :request do
  def auth_header(tutor)
    token = JsonWebToken.encode({ tutor_id: tutor.id })
    { 'Authorization' => "Bearer #{token}" }
  end

  let!(:admin) { Tutor.create!(nombre: 'Admin', email: 'admin@test.cl', password: 'pass123', rol: :admin) }
  let!(:tutor) { Tutor.create!(nombre: 'Laura', email: 'laura@test.cl', password: 'pass123', rol: :tutor) }

  let(:valid_params) do
    { nombre_contacto: 'Juan Pérez', email_contacto: 'juan@test.cl', mensaje: 'Clases de matemáticas' }
  end

  describe 'POST /api/v1/pre_registros (público, sin auth)' do
    it 'crea un pre-registro y devuelve mensaje de confirmación' do
      post '/api/v1/pre_registros', params: valid_params
      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json.dig('data', 'mensaje')).to be_present
    end

    it 'devuelve 422 si falta nombre_contacto' do
      post '/api/v1/pre_registros', params: valid_params.except(:nombre_contacto)
      expect(response).to have_http_status(:unprocessable_entity)
    end

    it 'devuelve 422 si email_contacto tiene formato inválido' do
      post '/api/v1/pre_registros', params: valid_params.merge(email_contacto: 'no-es-email')
      expect(response).to have_http_status(:unprocessable_entity)
    end

    it 'devuelve 429 si el mismo email supera 5 solicitudes en 24h' do
      5.times { PreRegistro.create!(nombre_contacto: 'Test', email_contacto: 'juan@test.cl') }
      post '/api/v1/pre_registros', params: valid_params
      expect(response).to have_http_status(:too_many_requests)
    end
  end

  describe 'GET /api/v1/pre_registros' do
    let!(:pr_pendiente)  { PreRegistro.create!(nombre_contacto: 'Ana López', email_contacto: 'ana@test.cl', estado: :pendiente) }
    let!(:pr_contactado) { PreRegistro.create!(nombre_contacto: 'Carlos R',  email_contacto: 'carlos@test.cl', estado: :contactado) }

    it 'sin auth devuelve 401' do
      get '/api/v1/pre_registros'
      expect(response).to have_http_status(:unauthorized)
    end

    it 'tutor recibe 403' do
      get '/api/v1/pre_registros', headers: auth_header(tutor)
      expect(response).to have_http_status(:forbidden)
    end

    it 'admin ve todos los pre-registros' do
      get '/api/v1/pre_registros', headers: auth_header(admin)
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['data'].size).to eq(2)
      expect(json['meta']['total']).to eq(2)
    end

    it 'admin filtra por estado=pendiente' do
      get '/api/v1/pre_registros', params: { estado: 'pendiente' }, headers: auth_header(admin)
      json = JSON.parse(response.body)
      expect(json['data'].size).to eq(1)
      expect(json['data'].first['estado']).to eq('pendiente')
    end

    it 'la respuesta incluye estado, nombre y email' do
      get '/api/v1/pre_registros', headers: auth_header(admin)
      json = JSON.parse(response.body)
      pr = json['data'].first
      expect(pr['estado']).to be_present
      expect(pr['nombre_contacto']).to be_present
      expect(pr['email_contacto']).to be_present
    end
  end

  describe 'PATCH /api/v1/pre_registros/:id' do
    let!(:pr) { PreRegistro.create!(nombre_contacto: 'Test', email_contacto: 'test@cl.cl', estado: :pendiente) }

    it 'admin puede cambiar estado a contactado' do
      patch "/api/v1/pre_registros/#{pr.id}", params: { estado: 'contactado' }, headers: auth_header(admin)
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json.dig('data', 'estado')).to eq('contactado')
    end

    it 'admin puede cambiar estado a descartado' do
      patch "/api/v1/pre_registros/#{pr.id}", params: { estado: 'descartado' }, headers: auth_header(admin)
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).dig('data', 'estado')).to eq('descartado')
    end

    it 'tutor recibe 403' do
      patch "/api/v1/pre_registros/#{pr.id}", params: { estado: 'contactado' }, headers: auth_header(tutor)
      expect(response).to have_http_status(:forbidden)
    end

    it 'sin auth devuelve 401' do
      patch "/api/v1/pre_registros/#{pr.id}", params: { estado: 'contactado' }
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe 'GET /api/v1/public/tutores (público, sin auth)' do
    it 'devuelve tutores activos con sus materias' do
      get '/api/v1/public/tutores'
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['data']).to be_an(Array)
      json['data'].each do |t|
        expect(t['id']).to be_present
        expect(t['nombre']).to be_present
        expect(t['materias']).to be_an(Array)
      end
    end

    it 'no incluye tutores inactivos' do
      admin.update!(activo: false)
      get '/api/v1/public/tutores'
      json = JSON.parse(response.body)
      ids = json['data'].map { |t| t['id'] }
      expect(ids).not_to include(admin.id)
    end
  end
end
