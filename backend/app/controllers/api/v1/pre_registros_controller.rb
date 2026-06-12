module Api
  module V1
    class PreRegistrosController < ApplicationController
      skip_before_action :authenticate, only: [:create]
      before_action :require_admin, only: [:index, :update]
      before_action :set_pre_registro, only: [:update]

      def create
        email = params[:email_contacto].to_s.downcase

        if PreRegistro.rate_limit_exceeded?(email)
          return render json: { error: "Has enviado demasiadas solicitudes. Intenta nuevamente en 24 horas." },
                        status: :too_many_requests
        end

        pre_registro = PreRegistro.new(create_params)
        pre_registro.email_contacto = email

        if pre_registro.save
          render json: { data: { mensaje: "Tu solicitud fue recibida. Te contactaremos pronto." } },
                 status: :created
        else
          render json: { error: "Error al crear solicitud", details: pre_registro.errors },
                 status: :unprocessable_entity
        end
      end

      def index
        pre_registros = PreRegistro.recientes.includes(:tutor, :materia)
        pre_registros = pre_registros.where(estado: params[:estado]) if params[:estado].present?

        render json: {
          data: pre_registros.map { |pr| serialize(pr) },
          meta: { total: pre_registros.size }
        }
      end

      def update
        if @pre_registro.update(update_params)
          render json: { data: serialize(@pre_registro) }
        else
          render json: { error: "Error al actualizar", details: @pre_registro.errors },
                 status: :unprocessable_entity
        end
      end

      private

      def set_pre_registro
        @pre_registro = PreRegistro.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Pre-registro no encontrado" }, status: :not_found
      end

      def create_params
        params.permit(:nombre_contacto, :email_contacto, :telefono_contacto,
                      :tutor_id, :materia_id, :mensaje)
      end

      def update_params
        params.permit(:estado)
      end

      def serialize(pr)
        {
          id: pr.id,
          nombre_contacto: pr.nombre_contacto,
          email_contacto: pr.email_contacto,
          telefono_contacto: pr.telefono_contacto,
          mensaje: pr.mensaje,
          estado: pr.estado,
          tutor: pr.tutor ? { id: pr.tutor.id, nombre: pr.tutor.nombre } : nil,
          materia: pr.materia ? { id: pr.materia.id, nombre: pr.materia.nombre } : nil,
          created_at: pr.created_at
        }
      end
    end
  end
end
