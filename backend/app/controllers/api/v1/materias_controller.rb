class Api::V1::MateriasController < ApplicationController
  before_action :require_admin, only: [:create]

  def index
    materias = Materia.order(:nombre)
    render json: { data: materias.map { |m| { id: m.id, nombre: m.nombre } }, meta: { total: materias.size } }
  end

  def create
    materia = Materia.new(materia_params)
    if materia.save
      render json: { data: { id: materia.id, nombre: materia.nombre } }, status: :created
    else
      render json: { error: 'Error al crear materia', details: materia.errors }, status: :unprocessable_entity
    end
  end

  private

  def materia_params
    params.require(:materia).permit(:nombre)
  end
end
