class ApplicationController < ActionController::API
  include Authenticable
  include Authorizable
end
