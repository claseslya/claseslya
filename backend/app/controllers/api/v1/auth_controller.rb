module Api
  module V1
    class AuthController < ApplicationController
      skip_before_action :authenticate

      def login
        tutor = Tutor.find_by(email: params[:email]&.downcase)

        if tutor&.authenticate(params[:password])
          token = JsonWebToken.encode({ tutor_id: tutor.id })
          render json: {
            data: {
              token:,
              tutor: tutor_payload(tutor)
            }
          }
        else
          render json: { error: 'Email o contraseña incorrectos' }, status: :unauthorized
        end
      end

      private

      def tutor_payload(tutor)
        { id: tutor.id, nombre: tutor.nombre, email: tutor.email, rol: tutor.rol }
      end
    end
  end
end
