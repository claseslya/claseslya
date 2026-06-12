module JsonWebToken
  SECRET = Rails.application.credentials.secret_key_base
  DEFAULT_EXP = 24.hours

  def self.encode(payload, exp: DEFAULT_EXP)
    payload[:exp] = exp.from_now.to_i
    JWT.encode(payload, SECRET, 'HS256')
  end

  def self.decode(token)
    decoded = JWT.decode(token, SECRET, true, algorithm: 'HS256')
    HashWithIndifferentAccess.new(decoded.first)
  rescue JWT::DecodeError => e
    raise JWT::DecodeError, e.message
  end
end
