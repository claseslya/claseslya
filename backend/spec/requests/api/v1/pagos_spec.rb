require 'rails_helper'

RSpec.describe 'Api::V1::Pagos', type: :request do
  def auth_header(tutor)
    token = JsonWebToken.encode({ tutor_id: tutor.id })
    { 'Authorization' => "Bearer #{token}" }
  end

  let!(:admin) { Tutor.create!(nombre: 'Admin', email: 'admin@test.cl', password: 'pass123', rol: :admin) }
  let!(:tutor) { Tutor.create!(nombre: 'Laura', email: 'laura@test.cl', password: 'pass123', rol: :tutor) }

  let!(:alumno1) { Alumno.create!(nombre: 'Sofía G', nivel: :basica, curso: 8) }
  let!(:alumno2) { Alumno.create!(nombre: 'Matías P', nivel: :media, curso: 9) }
  let!(:alumno3) { Alumno.create!(nombre: 'Valentina R', nivel: :media, curso: 11) }

  let!(:pago_pagado) do
    Pago.create!(alumno: alumno1, monto: 50_000, periodo: '2026-05',
                 fecha_pago: Date.new(2026, 5, 5), estado: :pagado, metodo: :transferencia)
  end
  let!(:pago_pendiente) do
    Pago.create!(alumno: alumno2, monto: 50_000, periodo: '2026-06', estado: :pendiente)
  end

  describe 'GET /api/v1/pagos' do
    it 'admin ve todos los pagos' do
      get '/api/v1/pagos', headers: auth_header(admin)
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['data'].size).to eq(2)
      expect(json['meta']['total']).to eq(2)
    end

    it 'tutor recibe 403' do
      get '/api/v1/pagos', headers: auth_header(tutor)
      expect(response).to have_http_status(:forbidden)
    end

    it 'filtra por periodo' do
      get '/api/v1/pagos', params: { periodo: '2026-05' }, headers: auth_header(admin)
      json = JSON.parse(response.body)
      expect(json['data'].size).to eq(1)
      expect(json['data'].first['periodo']).to eq('2026-05')
    end

    it 'filtra por estado' do
      get '/api/v1/pagos', params: { estado: 'pendiente' }, headers: auth_header(admin)
      json = JSON.parse(response.body)
      expect(json['data'].size).to eq(1)
      expect(json['data'].first['estado']).to eq('pendiente')
    end

    it 'filtra por alumno_id' do
      get '/api/v1/pagos', params: { alumno_id: alumno1.id }, headers: auth_header(admin)
      json = JSON.parse(response.body)
      expect(json['data'].size).to eq(1)
    end

    it 'incluye nombre del alumno en la respuesta' do
      get '/api/v1/pagos', headers: auth_header(admin)
      json = JSON.parse(response.body)
      expect(json['data'].first['alumno']['nombre']).to be_present
    end

    it 'devuelve pagos ordenados por periodo desc' do
      get '/api/v1/pagos', headers: auth_header(admin)
      json = JSON.parse(response.body)
      periodos = json['data'].map { |p| p['periodo'] }
      expect(periodos).to eq(periodos.sort.reverse)
    end
  end

  describe 'POST /api/v1/pagos' do
    let(:valid_params) do
      { pago: { alumno_id: alumno3.id, monto: 45_000, periodo: '2026-06', estado: 'pendiente' } }
    end

    it 'admin puede crear un pago' do
      post '/api/v1/pagos', params: valid_params, headers: auth_header(admin)
      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json.dig('data', 'monto')).to eq(45_000)
      expect(json.dig('data', 'estado')).to eq('pendiente')
    end

    it 'retorna error con monto inválido' do
      post '/api/v1/pagos',
           params: { pago: valid_params[:pago].merge(monto: 0) },
           headers: auth_header(admin)
      expect(response).to have_http_status(:unprocessable_entity)
    end

    it 'retorna error con periodo inválido' do
      post '/api/v1/pagos',
           params: { pago: valid_params[:pago].merge(periodo: '06-2026') },
           headers: auth_header(admin)
      expect(response).to have_http_status(:unprocessable_entity)
    end

    it 'tutor recibe 403' do
      post '/api/v1/pagos', params: valid_params, headers: auth_header(tutor)
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe 'PATCH /api/v1/pagos/:id' do
    it 'admin puede marcar como pagado' do
      patch "/api/v1/pagos/#{pago_pendiente.id}",
            params: { pago: { estado: 'pagado', fecha_pago: '2026-06-10', metodo: 'transferencia' } },
            headers: auth_header(admin)
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json.dig('data', 'estado')).to eq('pagado')
      expect(json.dig('data', 'metodo')).to eq('transferencia')
    end

    it 'admin puede actualizar monto' do
      patch "/api/v1/pagos/#{pago_pendiente.id}",
            params: { pago: { monto: 60_000 } },
            headers: auth_header(admin)
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).dig('data', 'monto')).to eq(60_000)
    end
  end

  describe 'DELETE /api/v1/pagos/:id' do
    it 'admin puede eliminar un pago' do
      delete "/api/v1/pagos/#{pago_pagado.id}", headers: auth_header(admin)
      expect(response).to have_http_status(:no_content)
      expect { pago_pagado.reload }.to raise_error(ActiveRecord::RecordNotFound)
    end
  end

  describe 'Pago.generar_pendientes' do
    it 'crea pagos pendientes para alumnos activos sin pago en el periodo' do
      # alumno1 ya tiene pago en '2026-05', alumno2 y alumno3 no
      expect {
        Pago.generar_pendientes('2026-05', monto: 50_000)
      }.to change(Pago, :count).by(2)
    end

    it 'no duplica pagos para alumnos que ya tienen pago en el periodo' do
      Pago.generar_pendientes('2026-06', monto: 50_000)
      # alumno2 ya tiene pago en 2026-06, así que solo crea para alumno1 y alumno3
      expect(Pago.del_periodo('2026-06').count).to eq(3)
    end

    it 'los pagos generados quedan como pendientes' do
      creados = Pago.generar_pendientes('2026-07', monto: 45_000)
      expect(creados).to all(be_pendiente)
      expect(creados.map(&:monto).uniq).to eq([45_000])
    end
  end
end
