class Api::V1::ApoderadosController < ApplicationController
  before_action :require_admin
  before_action :set_apoderado, only: [:show, :update]

  def index
    apoderados = Apoderado.left_joins(:alumnos)
                          .select('apoderados.*, COUNT(alumnos.id) AS alumnos_count')
                          .group('apoderados.id')
                          .order(:nombre)
    render json: { data: apoderados.map { |a| serialize_index(a) }, meta: { total: apoderados.size } }
  end

  def show
    render json: { data: serialize_detail(@apoderado) }
  end

  def create
    apoderado = Apoderado.new(apoderado_params)
    if apoderado.save
      render json: { data: serialize_index(apoderado) }, status: :created
    else
      render json: { error: 'Error al crear apoderado', details: apoderado.errors }, status: :unprocessable_entity
    end
  end

  def update
    if @apoderado.update(apoderado_params)
      render json: { data: serialize_index(@apoderado) }
    else
      render json: { error: 'Error al actualizar apoderado', details: @apoderado.errors }, status: :unprocessable_entity
    end
  end

  private

  def set_apoderado
    @apoderado = Apoderado.find(params[:id])
  end

  def apoderado_params
    params.require(:apoderado).permit(:nombre, :email, :telefono, :relacion)
  end

  def serialize_index(apoderado)
    {
      id:            apoderado.id,
      nombre:        apoderado.nombre,
      email:         apoderado.email,
      telefono:      apoderado.telefono,
      relacion:      apoderado.relacion,
      alumnos_count: apoderado.respond_to?(:alumnos_count) ? apoderado.alumnos_count.to_i : apoderado.alumnos.count
    }
  end

  def serialize_detail(apoderado)
    serialize_index(apoderado).merge(
      alumnos: apoderado.alumnos.map { |al| { id: al.id, nombre: al.nombre, curso: al.curso, nivel: al.nivel } }
    )
  end
end
