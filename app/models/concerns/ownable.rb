# frozen_string_literal: true

# This describes all models that may be owned by a particular user
module Ownable
  extend ActiveSupport::Concern

  included do
    store_accessor :data, :owned_by, :owned_by_full_name, :owned_by_agency_id, :owned_by_groups, :owned_by_location,
                   :owned_by_user_code, :owned_by_agency_office, :previously_owned_by, :previously_owned_by_full_name,
                   :previously_owned_by_agency, :previously_owned_by_location, :previously_owned_by_agency_office,
                   :assigned_user_names, :module_id, :associated_user_groups, :associated_user_agencies

    searchable do
      string :associated_user_names, multiple: true
      string :associated_user_groups, multiple: true
      string :associated_user_agencies, multiple: true
      string :owned_by_groups, multiple: true
      string :assigned_user_names, multiple: true
      boolean :not_edited_by_owner
      %w[
        owned_by_agency_id owned_by_location owned_by_agency_office module_id owned_by
      ].each { |f| string(f, as: "#{f}_sci") }
    end

    scope :owned_by, ->(username) { where('data @> ?', { owned_by: username }.to_json) }
    scope :associated_with, (lambda do |username|
      where(
        "(data -> 'assigned_user_names' ? :username) OR (data -> 'owned_by' ? :username)",
        username: username
      )
    end)

    before_save :update_ownership
  end

  def owner_fields_for(user)
    self.owned_by = user&.user_name
    self.owned_by_full_name = user&.full_name
  end

  def owner
    users_by_association[:owner]
  end

  def associated_user_names
    ([owned_by] + (assigned_user_names || [])).compact
  end

  # TODO: Refactor as association or AREL query after we migrated User
  # Note this returns all associated users, including the owner
  def associated_users
    user_ids = associated_user_names
    @associated_users ||= user_ids.present? ? User.where(user_name: user_ids) : []
  end

  # TODO: Refactor as association or AREL query after we migrated PrimeroModule
  def module
    @record_module ||= PrimeroModule.find_by(unique_id: module_id) if module_id
  end

  def owned_by_agency
    @record_agency ||= Agency.find_by(unique_id: owned_by_agency_id)&.agency_code if owned_by_agency_id
  end

  def users_by_association
    @users_by_association ||= associated_users.each_with_object({}) do |user, hash|
      hash[:owner] = user if user.user_name == owned_by
      hash[:assigned_users] = []
      # TODO: Put this in only if we need to get user info about the other assigned users (probably transfers)
      # hash[:assigned_users] << user if assigned_user_names && assigned_user_names.include? user.user_name
    end
  end

  def not_edited_by_owner
    (data['last_updated_by'] != data['owned_by']) && data['last_updated_by'].present?
  end
  alias not_edited_by_owner? not_edited_by_owner

  def update_ownership
    @users_by_association = nil
    @associated_users = nil
    @record_agency = nil
    if owner.blank?
      # Revert owned by changes and bail if new user doesn't exist
      self.owned_by = changes_to_save_for_record['owned_by'][0] if changes_to_save_for_record['owned_by'].present?
      return
    end

    if owned_by.present? && (new_record? || changes_to_save_for_record['owned_by'].present?)
      update_owned_by
      update_previously_owned_by unless new_record? || !will_save_change_to_attribute?('data')
    end

    if changes_to_save_for_record['assigned_user_names'].present? ||
       changes_to_save_for_record['owned_by'].present? ||
       new_record?
      update_associated_user_groups
      update_associated_user_agencies
    end
  end

  def update_owned_by
    self.owned_by_full_name = owner&.full_name
    self.owned_by_agency_id = owner&.organization&.unique_id
    self.owned_by_groups = owner&.user_group_unique_ids
    self.owned_by_location = owner&.location
    self.owned_by_user_code = owner&.code
    self.owned_by_agency_office = owner&.agency_office
  end

  def update_previously_owned_by
    self.previously_owned_by = attributes_in_database['data']['owned_by'] || owned_by
    self.previously_owned_by_full_name = attributes_in_database['data']['owned_by_full_name'] || owned_by_full_name
    self.previously_owned_by_agency = attributes_in_database['data']['owned_by_agency_id'] || owned_by_agency_id
    self.previously_owned_by_location = attributes_in_database['data']['owned_by_location'] || owned_by_location
    self.previously_owned_by_agency_office = attributes_in_database['data']['owned_by_agency_office'] ||
                                             owned_by_agency_office
  end

  def update_associated_user_groups
    self.associated_user_groups = UserGroup.joins(:users).where(
      users: { user_name: associated_user_names }
    ).pluck(:unique_id).uniq
  end

  def update_associated_user_agencies
    self.associated_user_agencies = Agency.joins(:users).where(
      users: { user_name: associated_user_names }
    ).pluck(:unique_id).uniq
  end

  def update_last_updated_by(current_user)
    self.last_updated_by = current_user.user_name
    self.last_updated_by_full_name = current_user.full_name
    self.last_updated_organization = current_user.agency
    self.last_updated_at = DateTime.now
  end
end
