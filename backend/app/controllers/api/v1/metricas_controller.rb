class Api::V1::MetricasController < ApplicationController
  before_action :require_admin, only: [:dashboard]

  def dashboard
    mes_actual   = Time.current.strftime('%Y-%m')
    mes_anterior = 1.month.ago.strftime('%Y-%m')

    render json: { data: {
      alumnos_activos:   alumnos_activos_count,
      alumnos_por_tutor: alumnos_por_tutor_data,
      sesiones_mes:      sesiones_mes_data,
      ingresos:          ingresos_data(mes_actual, mes_anterior),
      pagos_pendientes:  pagos_pendientes_data,
      proximas_sesiones: proximas_sesiones_data
    } }
  end

  def tutor
    render json: { data: {
      mis_alumnos:       mis_alumnos_data,
      sesiones_mes:      sesiones_mes_data(scope: :tutor),
      proximas_sesiones: proximas_sesiones_data(scope: :tutor)
    } }
  end

  private

  def alumnos_activos_count
    Alumno.activos.count
  end

  def alumnos_por_tutor_data
    Alumno.activos
          .joins(:tutor)
          .group('tutores.id', 'tutores.nombre')
          .count
          .map { |(tutor_id, tutor_nombre), count| { tutor_id:, tutor_nombre:, count: } }
          .sort_by { |r| -r[:count] }
  end

  def mis_alumnos_data
    alumnos = Alumno.activos.por_tutor(current_tutor.id)
    { count: alumnos.count }
  end

  def sesiones_mes_data(scope: :admin)
    base = scope == :tutor ? Sesion.del_mes.por_tutor(current_tutor.id) : Sesion.del_mes
    counts = base.group(:estado).count
    {
      total:      base.count,
      realizadas: counts['realizada'] || 0,
      agendadas:  counts['agendada']  || 0,
      canceladas: counts['cancelada'] || 0
    }
  end

  def ingresos_data(mes_actual, mes_anterior)
    actual    = Pago.pagados.del_periodo(mes_actual).sum(:monto)
    anterior  = Pago.pagados.del_periodo(mes_anterior).sum(:monto)
    variacion = anterior.zero? ? nil : ((actual - anterior).to_f / anterior * 100).round(1)
    { mes_actual: actual, mes_anterior: anterior, variacion_porcentual: variacion }
  end

  def pagos_pendientes_data
    base = Pago.pendientes
    { count: base.count, monto_total: base.sum(:monto) }
  end

  def proximas_sesiones_data(scope: :admin)
    base = scope == :tutor ? Sesion.proximas.por_tutor(current_tutor.id) : Sesion.proximas
    base.includes(:alumno, :materia)
        .order(:fecha_hora)
        .limit(5)
        .map do |s|
          {
            id:           s.id,
            fecha_hora:   s.fecha_hora,
            alumno:       { id: s.alumno.id, nombre: s.alumno.nombre },
            materia:      { id: s.materia.id, nombre: s.materia.nombre },
            duracion_min: s.duracion_min
          }
        end
  end
end
