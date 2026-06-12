require 'rails_helper'

RSpec.describe 'Api::V1::Alumnos', type: :request do
  def auth_header(tutor)
    token = JsonWebToken.encode({ tutor_id: tutor.id })
    { 'Authorization' => "Bearer #{token}" }
  end

  let!(:admin) { Tutor.create!(nombre: 'Admin', email: 'admin@test.cl', password: 'pass123', rol: :admin) }
  let!(:tutor) { Tutor.create!(nombre: 'Laura', email: 'laura@test.cl', password: 'pass123', rol: :tutor) }
  let!(:apoderado) { Apoderado.create!(nombre: 'María', relacion: 'madre') }

  let!(:alumno1) { Alumno.create!(nombre: 'Alumno Uno', nivel: :basica, curso: 7, tutor: admin) }
  let!(:alumno2) { Alumno.create!(nombre: 'Alumno Dos', nivel: :media,  curso: 9, tutor: tutor) }

  describe 'GET /api/v1/alumnos' do
    it 'admin ve todos los alumnos activos' do
      get '/api/v1/alumnos', headers: auth_header(admin)
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['data'].size).to eq(2)
      expect(json['meta']['total']).to eq(2)
    end

    it 'tutor ve solo sus propios alumnos' do
      get '/api/v1/alumnos', headers: auth_header(tutor)
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['data'].size).to eq(1)
      expect(json['data'].first['nombre']).to eq('Alumno Dos')
    end

    it 'filtra por nombre con ?search=' do
      get '/api/v1/alumnos', params: { search: 'uno' }, headers: auth_header(admin)
      json = JSON.parse(response.body)
      expect(json['data'].size).to eq(1)
      expect(json['data'].first['nombre']).to eq('Alumno Uno')
    end
  end

  describe 'GET /api/v1/alumnos/:id' do
    it 'devuelve el alumno con tutor y apoderado' do
      alumno1.update!(apoderado: apoderado)
      get "/api/v1/alumnos/#{alumno1.id}", headers: auth_header(admin)
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json.dig('data', 'tutor', 'nombre')).to eq('Admin')
      expect(json.dig('data', 'apoderado', 'nombre')).to eq('María')
    end

    it 'tutor puede ver su propio alumno' do
      get "/api/v1/alumnos/#{alumno2.id}", headers: auth_header(tutor)
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).dig('data', 'nombre')).to eq('Alumno Dos')
    end

    it 'tutor recibe 403 al intentar ver alumno de otro tutor' do
      get "/api/v1/alumnos/#{alumno1.id}", headers: auth_header(tutor)
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe 'POST /api/v1/alumnos' do
    let(:valid_params) { { alumno: { nombre: 'Nuevo', nivel: 'basica', curso: 6, tutor_id: admin.id } } }

    it 'admin puede crear un alumno' do
      post '/api/v1/alumnos', params: valid_params, headers: auth_header(admin)
      expect(response).to have_http_status(:created)
      expect(JSON.parse(response.body).dig('data', 'nombre')).to eq('Nuevo')
    end

    it 'tutor recibe 403 al intentar crear' do
      post '/api/v1/alumnos', params: valid_params, headers: auth_header(tutor)
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe 'PATCH /api/v1/alumnos/:id' do
    it 'admin puede actualizar un alumno' do
      patch "/api/v1/alumnos/#{alumno1.id}",
            params: { alumno: { nombre: 'Modificado' } },
            headers: auth_header(admin)
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).dig('data', 'nombre')).to eq('Modificado')
    end
  end

  describe 'DELETE /api/v1/alumnos/:id' do
    it 'admin hace soft delete (activo=false)' do
      delete "/api/v1/alumnos/#{alumno1.id}", headers: auth_header(admin)
      expect(response).to have_http_status(:no_content)
      expect(alumno1.reload.activo).to be(false)
    end

    it 'el alumno desactivado no aparece en el index' do
      alumno1.update!(activo: false)
      get '/api/v1/alumnos', headers: auth_header(admin)
      json = JSON.parse(response.body)
      expect(json['data'].map { |a| a['id'] }).not_to include(alumno1.id)
    end
  end
end
