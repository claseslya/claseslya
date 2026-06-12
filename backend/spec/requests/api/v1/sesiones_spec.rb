require 'rails_helper'

RSpec.describe 'Api::V1::Sesiones', type: :request do
  def auth_header(tutor)
    token = JsonWebToken.encode({ tutor_id: tutor.id })
    { 'Authorization' => "Bearer #{token}" }
  end

  let!(:admin)  { Tutor.create!(nombre: 'Admin',  email: 'admin@test.cl',  password: 'pass123', rol: :admin) }
  let!(:tutor)  { Tutor.create!(nombre: 'Laura',  email: 'laura@test.cl',  password: 'pass123', rol: :tutor) }
  let!(:otro_tutor) { Tutor.create!(nombre: 'Otro', email: 'otro@test.cl', password: 'pass123', rol: :tutor) }

  let!(:materia) { Materia.create!(nombre: 'Matemáticas') }

  let!(:alumno_admin) { Alumno.create!(nombre: 'Alumno Admin', nivel: :basica, curso: 7, tutor: admin) }
  let!(:alumno_tutor) { Alumno.create!(nombre: 'Alumno Laura', nivel: :media,  curso: 9, tutor: tutor) }

  let!(:sesion_admin) do
    Sesion.create!(alumno: alumno_admin, tutor: admin, materia: materia,
                   fecha_hora: 1.day.from_now, duracion_min: 60, estado: :agendada)
  end
  let!(:sesion_tutor) do
    Sesion.create!(alumno: alumno_tutor, tutor: tutor, materia: materia,
                   fecha_hora: 2.days.from_now, duracion_min: 60, estado: :agendada)
  end
  let!(:sesion_realizada) do
    Sesion.create!(alumno: alumno_admin, tutor: admin, materia: materia,
                   fecha_hora: 1.week.ago, duracion_min: 60, estado: :realizada,
                   notas: 'Clase completada')
  end

  describe 'GET /api/v1/sesiones' do
    it 'admin ve todas las sesiones' do
      get '/api/v1/sesiones', headers: auth_header(admin)
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['data'].size).to eq(3)
      expect(json['meta']['total']).to eq(3)
    end

    it 'tutor ve solo sus sesiones' do
      get '/api/v1/sesiones', headers: auth_header(tutor)
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['data'].size).to eq(1)
      expect(json['data'].first['tutor']['nombre']).to eq('Laura')
    end

    it 'admin puede filtrar por tutor_id' do
      get '/api/v1/sesiones', params: { tutor_id: tutor.id }, headers: auth_header(admin)
      json = JSON.parse(response.body)
      expect(json['data'].size).to eq(1)
    end

    it 'filtra por alumno_id' do
      get '/api/v1/sesiones', params: { alumno_id: alumno_admin.id }, headers: auth_header(admin)
      json = JSON.parse(response.body)
      expect(json['data'].size).to eq(2)
    end

    it 'filtra por estado' do
      get '/api/v1/sesiones', params: { estado: 'realizada' }, headers: auth_header(admin)
      json = JSON.parse(response.body)
      expect(json['data'].size).to eq(1)
      expect(json['data'].first['estado']).to eq('realizada')
    end

    it 'respuesta incluye nombre de alumno, tutor y materia' do
      get '/api/v1/sesiones', headers: auth_header(admin)
      json = JSON.parse(response.body)
      primera = json['data'].first
      expect(primera['alumno']['nombre']).to be_present
      expect(primera['tutor']['nombre']).to be_present
      expect(primera['materia']['nombre']).to be_present
    end

    it 'devuelve sesiones ordenadas por fecha_hora descendente' do
      get '/api/v1/sesiones', headers: auth_header(admin)
      json = JSON.parse(response.body)
      fechas = json['data'].map { |s| Time.parse(s['fecha_hora']) }
      expect(fechas).to eq(fechas.sort.reverse)
    end
  end

  describe 'GET /api/v1/sesiones/:id' do
    it 'devuelve la sesión con datos anidados' do
      get "/api/v1/sesiones/#{sesion_admin.id}", headers: auth_header(admin)
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json.dig('data', 'id')).to eq(sesion_admin.id)
      expect(json.dig('data', 'materia', 'nombre')).to eq('Matemáticas')
    end

    it 'tutor puede ver su propia sesión' do
      get "/api/v1/sesiones/#{sesion_tutor.id}", headers: auth_header(tutor)
      expect(response).to have_http_status(:ok)
    end

    it 'tutor recibe 403 al intentar ver sesión de otro tutor' do
      get "/api/v1/sesiones/#{sesion_admin.id}", headers: auth_header(tutor)
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe 'POST /api/v1/sesiones' do
    let(:valid_params) do
      {
        sesion: {
          alumno_id:    alumno_admin.id,
          tutor_id:     admin.id,
          materia_id:   materia.id,
          fecha_hora:   3.days.from_now.iso8601,
          duracion_min: 60
        }
      }
    end

    it 'admin puede crear sesión para cualquier tutor' do
      post '/api/v1/sesiones', params: valid_params, headers: auth_header(admin)
      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json.dig('data', 'estado')).to eq('agendada')
    end

    it 'tutor crea sesión y se asigna a sí mismo' do
      params = valid_params.deep_merge(sesion: { alumno_id: alumno_tutor.id })
      post '/api/v1/sesiones', params: params, headers: auth_header(tutor)
      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json.dig('data', 'tutor', 'id')).to eq(tutor.id)
    end

    it 'retorna error si falta fecha_hora' do
      params = valid_params.deep_merge(sesion: { fecha_hora: nil })
      post '/api/v1/sesiones', params: params, headers: auth_header(admin)
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe 'PATCH /api/v1/sesiones/:id' do
    it 'puede cambiar estado a realizada' do
      patch "/api/v1/sesiones/#{sesion_admin.id}",
            params: { sesion: { estado: 'realizada', notas: 'Completada sin problemas' } },
            headers: auth_header(admin)
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json.dig('data', 'estado')).to eq('realizada')
      expect(json.dig('data', 'notas')).to eq('Completada sin problemas')
    end

    it 'tutor puede cambiar estado de su propia sesión' do
      patch "/api/v1/sesiones/#{sesion_tutor.id}",
            params: { sesion: { estado: 'cancelada' } },
            headers: auth_header(tutor)
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).dig('data', 'estado')).to eq('cancelada')
    end

    it 'tutor recibe 403 al intentar modificar sesión de otro tutor' do
      patch "/api/v1/sesiones/#{sesion_admin.id}",
            params: { sesion: { estado: 'cancelada' } },
            headers: auth_header(tutor)
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe 'DELETE /api/v1/sesiones/:id' do
    it 'admin puede eliminar una sesión' do
      delete "/api/v1/sesiones/#{sesion_realizada.id}", headers: auth_header(admin)
      expect(response).to have_http_status(:no_content)
      expect { sesion_realizada.reload }.to raise_error(ActiveRecord::RecordNotFound)
    end

    it 'tutor recibe 403 al intentar eliminar' do
      delete "/api/v1/sesiones/#{sesion_tutor.id}", headers: auth_header(tutor)
      expect(response).to have_http_status(:forbidden)
    end
  end
end
