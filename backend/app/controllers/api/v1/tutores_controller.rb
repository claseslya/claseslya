class Api::V1::TutoresController < ApplicationController
  def index
    tutores = Tutor.activos.includes(:materias).order(:nombre)
    render json: { data: tutores.map { |t| serialize(t) } }
  end

  private

  def serialize(tutor)
    {
      id:       tutor.id,
      nombre:   tutor.nombre,
      email:    tutor.email,
      rol:      tutor.rol,
      materias: tutor.materias.map { |m| { id: m.id, nombre: m.nombre } }
    }
  end
end
