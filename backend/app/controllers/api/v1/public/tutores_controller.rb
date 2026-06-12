module Api
  module V1
    module Public
      class TutoresController < ApplicationController
        skip_before_action :authenticate

        def index
          tutores = Tutor.activos.includes(:materias).order(:nombre)

          render json: {
            data: tutores.map { |t| serialize(t) }
          }
        end

        private

        def serialize(tutor)
          {
            id: tutor.id,
            nombre: tutor.nombre,
            materias: tutor.materias.map { |m| { id: m.id, nombre: m.nombre } }
          }
        end
      end
    end
  end
end
