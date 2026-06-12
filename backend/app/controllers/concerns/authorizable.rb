module Authorizable
  extend ActiveSupport::Concern

  private

  def require_admin
    render json: { error: 'Acceso denegado' }, status: :forbidden unless current_tutor.admin?
  end
end
