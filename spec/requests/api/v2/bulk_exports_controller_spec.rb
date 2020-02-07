# frozen_string_literal: true

require 'rails_helper'

describe Api::V2::BulkExportsController, type: :request do
  include ActiveJob::TestHelper

  before :each do
    clean_data(BulkExport, Child, User)
    User.new(user_name: fake_user_name).save(validate: false)
    User.new(user_name: 'other_user').save(validate: false)

    @export_permission = Permission.new(
      resource: Permission::CASE,
      actions: [
        Permission::EXPORT_JSON
      ]
    )
    @export1 = BulkExport.create!(
      status: BulkExport::COMPLETE, record_type: 'case', format: 'json', file_name: 'export1', owned_by: fake_user_name
    )
    @export2 = BulkExport.create!(
      status: BulkExport::COMPLETE, record_type: 'case', format: 'json', file_name: 'export2', owned_by: fake_user_name
    )
    @export3 = BulkExport.create!(
      status: BulkExport::COMPLETE, record_type: 'case', format: 'json', file_name: 'export3', owned_by: 'other_user'
    )
    @export4 = BulkExport.create!(
      status: BulkExport::COMPLETE, record_type: 'case', format: 'csv', file_name: 'export4', owned_by: fake_user_name
    )
  end

  let(:json) { JSON.parse(response.body) }

  describe 'GET /api/v2/exports' do
    it 'lists all permitted exports and accompanying metadata' do
      login_for_test(permissions: [@export_permission])
      get '/api/v2/exports'

      expect(response).to have_http_status(200)
      expect(json['data'].size).to eq(3)
      expect(json['data'].map { |c| c['file_name'] }).to include(@export1.file_name, @export2.file_name, @export4.file_name)
      expect(json['metadata']['total']).to eq(3)
      expect(json['metadata']['per']).to eq(20)
      expect(json['metadata']['page']).to eq(1)
    end


    it 'lists only csv permitted exports and accompanying metadata' do
      login_for_test(permissions: [@export_permission])

      get '/api/v2/exports', params: { export_format: 'csv'}

      expect(response).to have_http_status(200)
      expect(json['data'].size).to eq(1)
      expect(json['data'].first['file_name']).to eq(@export4.file_name)
      expect(json['metadata']['total']).to eq(1)
      expect(json['metadata']['per']).to eq(20)
      expect(json['metadata']['page']).to eq(1)
    end

    it 'refuses unauthorized access' do
      login_for_test(permissions: [])
      get '/api/v2/exports'

      expect(response).to have_http_status(403)
      expect(json['errors'].size).to eq(1)
      expect(json['errors'][0]['resource']).to eq('/api/v2/exports')
    end
  end

  describe 'GET /api/v2/exports/:id' do
    it 'displays the correct record' do
      login_for_test(permissions: [@export_permission])
      get "/api/v2/exports/#{@export1.id}"

      expect(response).to have_http_status(200)
      expect(json['data']['id']).to eq(@export1.id)
      expect(json['data']['file_name']).to eq('export1')
      expect(json['data']['export_format']).to eq('json')
    end

    it 'refuses unauthorized access to an export generated by someone else' do
      login_for_test(permissions: [@export_permission])
      get "/api/v2/exports/#{@export3.id}"

      expect(response).to have_http_status(403)
      expect(json['errors'].size).to eq(1)
      expect(json['errors'][0]['resource']).to eq("/api/v2/exports/#{@export3.id}")
    end
  end

  describe 'POST /api/v2/exports' do
    before do
      @password = 'password123'
      @password_encrypted = 'password_encrypted'
      allow(EncryptionService).to receive(:encrypt).with(@password).and_return(@password_encrypted)
      allow(EncryptionService).to receive(:decrypt).with(@password_encrypted).and_return(@password)
      allow(ENV).to receive(:[])
      allow(ENV).to receive(:[]).with('PRIMERO_ZIP_FORMAT').and_return('zip')
    end

    context 'valid export request' do
      before do
        login_for_test(permissions: [@export_permission])
        params = {
          data: {
            record_type: 'case',
            export_format: 'json',
            file_name: 'test.json',
            password: @password
          }
        }
        post '/api/v2/exports', params: params
      end

      it 'creates a bulk export process' do
        expect(response).to have_http_status(200)
        expect(json['data']['id']).to be
        expect(json['data']['file_name']).to eq('test.json')
        expect(json['data']['export_format']).to eq('json')
      end

      it 'triggers an export job' do
        expect(BulkExportJob).to have_been_enqueued
          .with(json['data']['id'], @password_encrypted)
          .at_least(:once)
      end
    end

    it 'refuses export of unauthorized record types' do
      login_for_test(permissions: [@export_permission])
      params = {
        data: {
          record_type: 'incident',
          export_format: 'json',
          file_name: 'test.json',
          password: @password
        }
      }
      post '/api/v2/exports', params: params

      expect(response).to have_http_status(403)
      expect(json['errors'].size).to eq(1)
      expect(json['errors'][0]['resource']).to eq('/api/v2/exports')
    end

    it 'refuses export of unauthorized export formats' do
      login_for_test(permissions: [@export_permission])
      params = {
        data: {
          record_type: 'case',
          export_format: 'csv',
          file_name: 'test.json',
          password: @password
        }
      }
      post '/api/v2/exports', params: params

      expect(response).to have_http_status(403)
      expect(json['errors'].size).to eq(1)
      expect(json['errors'][0]['resource']).to eq('/api/v2/exports')
    end

    it 'refuses export if provided with a weak password' do
      login_for_test(permissions: [@export_permission])
      params = {
        data: {
          record_type: 'case',
          export_format: 'json',
          file_name: 'test.json',
          password: 'weak'
        }
      }
      post '/api/v2/exports', params: params

      expect(response).to have_http_status(422)
      expect(json['errors'].size).to eq(1)
      expect(json['errors'][0]['resource']).to eq('/api/v2/exports')
    end
  end

  describe 'DELETE /api/v2/exports/:id' do
    it 'archives an existing bulk export' do
      login_for_test(permissions: [@export_permission])
      delete "/api/v2/exports/#{@export1.id}"

      expect(response).to have_http_status(200)
      expect(json['data']['id']).to eq(@export1.id)
      @export1.reload
      expect(@export1.status).to eq(BulkExport::ARCHIVED)
    end

    it 'does not archive a bulk export owned by a different user' do
      login_for_test(permissions: [@export_permission])
      delete "/api/v2/exports/#{@export3.id}"

      expect(response).to have_http_status(403)
      expect(json['errors'].size).to eq(1)
      expect(json['errors'][0]['resource']).to eq("/api/v2/exports/#{@export3.id}")
    end
  end

  after :each do
    clean_data(BulkExport, Child, User)
  end
end