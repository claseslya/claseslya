class Api::V1::SesionesController < ApplicationController
  before_action :require_admin, only: [:destroy]
  before_action :set_sesion,    only: [:show, :update, :destroy]

  def index
    sesiones = Sesion.includes(:alumno, :tutor, :materia)

    sesiones = sesiones.por_tutor(current_tutor.id) unless current_tutor.admin?

    sesiones = sesiones.por_tutor(params[:tutor_id])   if current_tutor.admin? && params[:tutor_id].present?
    sesiones = sesiones.por_alumno(params[:alumno_id]) if params[:alumno_id].present?
    sesiones = sesiones.where('fecha_hora >= ?', params[:desde]) if params[:desde].present?
    sesiones = sesiones.where('fecha_hora <= ?', params[:hasta]) if params[:hasta].present?
    sesiones = sesiones.where(estado: params[:estado])           if params[:estado].present?

    sesiones = sesiones.order(fecha_hora: :desc)

    render json: { data: sesiones.map { |s| serialize(s) }, meta: { total: sesiones.size } }
  end

  def show
    render json: { data: serialize(@sesion) }
  end

  def create
    sesion = Sesion.new(sesion_params)
    sesion.tutor_id = current_tutor.id unless current_tutor.admin?

    if sesion.save
      render json: { data: serialize(sesion) }, status: :created
    else
      render json: { error: 'Error al crear sesión', details: sesion.errors }, status: :unprocessable_entity
    end
  end

  def update
    if @sesion.update(update_params)
      render json: { data: serialize(@sesion) }
    else
      render json: { error: 'Error al actualizar sesión', details: @sesion.errors }, status: :unprocessable_entity
    end
  end

  def destroy
    @sesion.destroy!
    head :no_content
  end

  private

  def set_sesion
    @sesion = Sesion.includes(:alumno, :tutor, :materia).find(params[:id])
    unless current_tutor.admin? || @sesion.tutor_id == current_tutor.id
      render json: { error: 'Acceso denegado' }, status: :forbidden
    end
  end

  def sesion_params
    params.require(:sesion).permit(:alumno_id, :tutor_id, :materia_id, :fecha_hora, :duracion_min, :estado, :notas)
  end

  def update_params
    params.require(:sesion).permit(:estado, :notas)
  end

  def serialize(sesion)
    {
      id:           sesion.id,
      fecha_hora:   sesion.fecha_hora,
      duracion_min: sesion.duracion_min,
      estado:       sesion.estado,
      notas:        sesion.notas,
      alumno:       { id: sesion.alumno.id, nombre: sesion.alumno.nombre },
      tutor:        { id: sesion.tutor.id,  nombre: sesion.tutor.nombre },
      materia:      { id: sesion.materia.id, nombre: sesion.materia.nombre }
    }
  end
end
