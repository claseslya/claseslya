class Api::V1::PagosController < ApplicationController
  before_action :require_admin
  before_action :set_pago, only: [:update, :destroy]

  def generar_pendientes
    periodo = params[:periodo].presence || Time.current.strftime('%Y-%m')
    monto   = params[:monto].to_i

    if monto <= 0
      return render json: { error: 'El monto debe ser mayor a 0' }, status: :unprocessable_entity
    end

    creados = Pago.generar_pendientes(periodo, monto: monto)
    render json: { data: creados.map { |p| serialize(p) }, meta: { total: creados.size } }, status: :created
  end

  def index
    pagos = Pago.includes(:alumno)

    pagos = pagos.del_periodo(params[:periodo])   if params[:periodo].present?
    pagos = pagos.where(estado: params[:estado])  if params[:estado].present?
    pagos = pagos.where(alumno_id: params[:alumno_id]) if params[:alumno_id].present?

    pagos = pagos.joins(:alumno).order('pagos.periodo DESC, alumnos.nombre ASC')

    render json: { data: pagos.map { |p| serialize(p) }, meta: { total: pagos.size } }
  end

  def create
    pago = Pago.new(pago_params)
    if pago.save
      render json: { data: serialize(pago) }, status: :created
    else
      render json: { error: 'Error al crear pago', details: pago.errors }, status: :unprocessable_entity
    end
  end

  def update
    if @pago.update(pago_params)
      render json: { data: serialize(@pago) }
    else
      render json: { error: 'Error al actualizar pago', details: @pago.errors }, status: :unprocessable_entity
    end
  end

  def destroy
    @pago.destroy!
    head :no_content
  end

  private

  def set_pago
    @pago = Pago.find(params[:id])
  end

  def pago_params
    params.require(:pago).permit(:alumno_id, :monto, :fecha_pago, :periodo, :estado, :metodo)
  end

  def serialize(pago)
    {
      id:         pago.id,
      monto:      pago.monto,
      fecha_pago: pago.fecha_pago,
      periodo:    pago.periodo,
      estado:     pago.estado,
      metodo:     pago.metodo,
      alumno:     { id: pago.alumno.id, nombre: pago.alumno.nombre }
    }
  end
end
