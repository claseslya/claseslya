module Authenticable
  extend ActiveSupport::Concern

  included do
    before_action :authenticate
  end

  private

  def authenticate
    token = request.headers['Authorization']&.split(' ')&.last
    return render_unauthorized unless token

    @current_tutor_payload = JsonWebToken.decode(token)
  rescue JWT::DecodeError
    render_unauthorized
  end

  def current_tutor
    @current_tutor ||= Tutor.find(@current_tutor_payload[:tutor_id])
  end

  def render_unauthorized
    render json: { error: 'Token inválido o expirado' }, status: :unauthorized
  end
end
