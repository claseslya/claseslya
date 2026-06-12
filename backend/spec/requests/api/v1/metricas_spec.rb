require 'rails_helper'

RSpec.describe 'Api::V1::Metricas', type: :request do
  def auth_header(tutor)
    token = JsonWebToken.encode({ tutor_id: tutor.id })
    { 'Authorization' => "Bearer #{token}" }
  end

  let!(:admin) { Tutor.create!(nombre: 'Admin', email: 'admin@test.cl', password: 'pass123', rol: :admin) }
  let!(:tutor) { Tutor.create!(nombre: 'Laura', email: 'laura@test.cl', password: 'pass123', rol: :tutor) }
  let!(:materia) { Materia.create!(nombre: 'Matemáticas') }

  let!(:alumno1) { Alumno.create!(nombre: 'Alumno Uno',  nivel: :basica, curso: 7, tutor: admin) }
  let!(:alumno2) { Alumno.create!(nombre: 'Alumno Dos',  nivel: :media,  curso: 9, tutor: tutor) }
  let!(:alumno3) { Alumno.create!(nombre: 'Alumno Tres', nivel: :media,  curso: 10, tutor: tutor, activo: false) }

  let(:mes_actual)  { Time.current.strftime('%Y-%m') }
  let(:mes_anterior) { 1.month.ago.strftime('%Y-%m') }

  before do
    # Sesiones del mes actual
    Sesion.create!(alumno: alumno1, tutor: admin, materia: materia,
                   fecha_hora: Time.current - 5.days, duracion_min: 60, estado: :realizada)
    Sesion.create!(alumno: alumno2, tutor: tutor, materia: materia,
                   fecha_hora: Time.current - 2.days, duracion_min: 60, estado: :cancelada)
    Sesion.create!(alumno: alumno1, tutor: admin, materia: materia,
                   fecha_hora: Time.current + 3.days, duracion_min: 60, estado: :agendada)

    # Pagos
    Pago.create!(alumno: alumno1, monto: 40_000, periodo: mes_actual,
                 fecha_pago: Date.current, estado: :pagado, metodo: :transferencia)
    Pago.create!(alumno: alumno2, monto: 50_000, periodo: mes_anterior,
                 fecha_pago: 1.month.ago.to_date, estado: :pagado, metodo: :efectivo)
    Pago.create!(alumno: alumno2, monto: 45_000, periodo: mes_actual, estado: :pendiente)
  end

  describe 'GET /api/v1/metricas/dashboard' do
    it 'tutor recibe 403' do
      get '/api/v1/metricas/dashboard', headers: auth_header(tutor)
      expect(response).to have_http_status(:forbidden)
    end

    context 'admin autenticado' do
      before { get '/api/v1/metricas/dashboard', headers: auth_header(admin) }

      it 'responde 200' do
        expect(response).to have_http_status(:ok)
      end

      it 'alumnos_activos cuenta solo activos' do
        expect(json.dig('data', 'alumnos_activos')).to eq(2)
      end

      it 'alumnos_por_tutor tiene la estructura correcta' do
        por_tutor = json.dig('data', 'alumnos_por_tutor')
        expect(por_tutor).to be_an(Array)
        expect(por_tutor.first.keys).to include('tutor_id', 'tutor_nombre', 'count')
        total = por_tutor.sum { |r| r['count'] }
        expect(total).to eq(2)
      end

      it 'sesiones_mes tiene los conteos correctos' do
        sm = json.dig('data', 'sesiones_mes')
        expect(sm['total']).to eq(3)
        expect(sm['realizadas']).to eq(1)
        expect(sm['canceladas']).to eq(1)
        expect(sm['agendadas']).to eq(1)
      end

      it 'ingresos refleja pagos pagados del periodo' do
        ingresos = json.dig('data', 'ingresos')
        expect(ingresos['mes_actual']).to eq(40_000)
        expect(ingresos['mes_anterior']).to eq(50_000)
        expect(ingresos['variacion_porcentual']).to eq(-20.0)
      end

      it 'pagos_pendientes cuenta y suma correctamente' do
        pp = json.dig('data', 'pagos_pendientes')
        expect(pp['count']).to eq(1)
        expect(pp['monto_total']).to eq(45_000)
      end

      it 'proximas_sesiones devuelve hasta 5 sesiones agendadas futuras' do
        ps = json.dig('data', 'proximas_sesiones')
        expect(ps).to be_an(Array)
        expect(ps.size).to eq(1)
        expect(ps.first.keys).to include('id', 'fecha_hora', 'alumno', 'materia', 'duracion_min')
        expect(ps.first.dig('alumno', 'nombre')).to be_present
      end
    end
  end

  def json
    JSON.parse(response.body)
  end
end
