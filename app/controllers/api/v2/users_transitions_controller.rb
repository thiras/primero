# frozen_string_literal: true

# API to list allowsed users to receive assignements, transfers, referrals
class Api::V2::UsersTransitionsController < ApplicationApiController
  before_action :record_model, only: %i[assign_to transfer_to refer_to]

  def assign_to
    authorize!(:assign, @record_model)
    @users = User.users_for_assign(current_user, @record_model)
    render 'api/v2/users/users_for_transition'
  end

  def transfer_to
    authorize!(:transfer, @record_model)
    @users = User.users_for_transfer(current_user, @record_model, user_filters)
    render 'api/v2/users/users_for_transition'
  end

  def refer_to
    authorize_refer_to!(@record_model)
    @users = User.users_for_referral(current_user, @record_model, user_filters)
    UserLocationService.inject_locations(@users)
    render 'api/v2/users/users_for_transition'
  end

  private

  def record_model
    @record_model = Record.model_from_name(params[:record_type])
  end

  def user_filters
    @user_filters ||= params.permit(:agency, :location, :service)
  end

  def authorize_refer_to!(record_model)
    authorize!(:referral, record_model)
  rescue CanCan::AccessDenied
    authorize!(:referral_from_service, record_model)
  end
end
