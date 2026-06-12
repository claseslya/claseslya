class Api::V1::AlumnosController < ApplicationController
  before_action :require_admin, only: [:create, :update, :destroy]
  before_action :set_alumno,    only: [:show, :update, :destroy]

  def index
    alumnos = Alumno.activos.includes(:tutor, :apoderado)
    alumnos = alumnos.por_tutor(current_tutor.id) unless current_tutor.admin?
    alumnos = alumnos.where('alumnos.nombre ILIKE ?', "%#{params[:search]}%") if params[:search].present?
    render json: { data: alumnos.map { |a| serialize(a) }, meta: { total: alumnos.size } }
  end

  def show
    render json: { data: serialize(@alumno) }
  end

  def create
    alumno = Alumno.new(alumno_params)
    if alumno.save
      render json: { data: serialize(alumno) }, status: :created
    else
      render json: { error: 'Error al crear alumno', details: alumno.errors }, status: :unprocessable_entity
    end
  end

  def update
    if @alumno.update(alumno_params)
      render json: { data: serialize(@alumno) }
    else
      render json: { error: 'Error al actualizar alumno', details: @alumno.errors }, status: :unprocessable_entity
    end
  end

  def destroy
    @alumno.update!(activo: false)
    head :no_content
  end

  private

  def set_alumno
    @alumno = Alumno.find(params[:id])
    unless current_tutor.admin? || @alumno.tutor_id == current_tutor.id
      render json: { error: 'Acceso denegado' }, status: :forbidden
    end
  end

  def alumno_params
    params.require(:alumno).permit(:nombre, :email, :telefono, :tutor_id, :apoderado_id, :nivel, :curso, :activo)
  end

  def serialize(alumno)
    {
      id:        alumno.id,
      nombre:    alumno.nombre,
      email:     alumno.email,
      telefono:  alumno.telefono,
      nivel:     alumno.nivel,
      curso:     alumno.curso,
      activo:    alumno.activo,
      tutor:     alumno.tutor     ? { id: alumno.tutor.id,     nombre: alumno.tutor.nombre }     : nil,
      apoderado: alumno.apoderado ? { id: alumno.apoderado.id, nombre: alumno.apoderado.nombre } : nil
    }
  end
end
