_primero.Collections.UsersCollection = Backbone.Collection.extend({
  url: '/api/users',

  parse: function(resp) {
    this.status = resp.success;
    this.message = resp.message;
    return resp.users;
  },

  find_by_user_name: function(user_name){
    var users = this.where({user_name: user_name});
    var user = null;
    if(users && users.length > 0){
      user = _.first(users).attributes;
    }
    return user;
  }
});

_primero.Views.ReferRecords = _primero.Views.Base.extend({

  el: 'body',

  events: {
    'click .service_referral_button' : 'refer_from_service',
    'click .referral_index_action' : 'refer_records',
    'click .referral_show_action' : 'refer_records_empty',
    'change #referral-modal input[name="is_remote"]' : 'toggle_remote_primero',
    'change #referral-modal select#existing_user_referral' : 'on_user_change',
    'change #referral-modal input#other_user' : 'toggle_existing_user',
    'click #referral-modal input[type="submit"]' : 'close_referral',
    'change #referral-modal select.existing_user_filter' : 'clear_user_selection'
  },

  initialize: function(){
    var self = this;
    this.collection = new _primero.Collections.UsersCollection();
    $("#referral-modal").find("select#existing_user_referral").on('chosen:showing_dropdown', function(){
      self.clear_user_selection();
      self.load_existing_users();
    });
  },

  refer_records_empty: function(event) {
    this.clear_referral();
    var $referral_modal = $("#referral-modal");
    $referral_modal.find("#service_hidden").attr("disabled","disabled");
    $referral_modal.find("#existing_user_hidden").attr("disabled","disabled");

    var $referral_button = $(event.target);
    this.select_user_location();
    this.clear_user_selection();
  },

  refer_records: function(event) {
    this.clear_referral();
    var selected_recs = _primero.indexTable.get_selected_records(),
        $referral_button = $(event.target),
        consent_url = $referral_button.data('consent_count_url');
    $("#selected_records").val(selected_recs);
    this.refer_records_empty(event);
    $.get( consent_url, {selected_records: selected_recs.join(","), transition_type: "referral"}, function(response) {
        var total = response['record_count'],
            consent_cnt = response['consent_count'],
            no_consent_cnt = total - consent_cnt;
        $("#referral-modal").find(".consent_count").html(no_consent_cnt.toString());
    });
  },

  refer_from_service: function(event) {
    var self = this;
    self.clear_referral();
    self.clear_user_selection();
    var $referral_button = $(event.target);
    var service_type = $referral_button.data('service-type');
    var service_user_name = $referral_button.data('service-user-name');
    var service_object_id = $referral_button.data('service-object-id');
    var service_agency = $referral_button.data('service-agency');
    var $referral_modal = $("#referral-modal");
    $referral_modal.find("#service_hidden").val(service_type);
    var $service_type = $referral_modal.find("#service");
    $service_type.val(service_type);
    $service_type.not("[type='hidden']").attr("disabled","disabled");
    $referral_modal.find("#existing_user_hidden").val(service_user_name);

    $referral_modal.find("#agency_hidden").val(service_agency);
    var $agency_select = $referral_modal.find("select#agency");
    $agency_select.val(service_agency);
    $agency_select.attr("disabled","disabled");

    self.load_existing_users(function(){
      var $location_select = $referral_modal.find("select#location");
      $location_select.attr("disabled", "disabled");
      $location_select.trigger("chosen:updated");

      var selected_user = self.collection.find_by_user_name(service_user_name);
      if(selected_user) {
        self.populate_location_filter(selected_user.reporting_location_code)
      }

      var $existing_user_select = $referral_modal.find("#existing_user_referral");
      $existing_user_select.val(service_user_name);
      $existing_user_select.attr("disabled","disabled");
      $existing_user_select.trigger("chosen:updated");
    });

    $referral_modal.find("#service_object_id").val(service_object_id);
  },

  toggle_remote_primero: function() {
    var $referral_modal = $('#referral-modal');
    $referral_modal.find('.remote_toggle').toggle();
    $referral_modal.find('.local_toggle').toggle();
  },

  toggle_other_user: function(e) {
    var existing_user = $(e.target).val(),
      $other_user_input = $('#other_user'),
      $other_user_agency_input = $('#other_user_agency');
    if(existing_user == null || existing_user == undefined || existing_user.trim() == ""){
      $other_user_input.prop('disabled', false);
      $other_user_agency_input.prop('disabled', false);
    } else {
      $other_user_input.prop('disabled', true);
      $other_user_agency_input.prop('disabled', true);
    }
  },

  toggle_existing_user: function(e) {
    var other_user = $(e.target).val(),
      $existing_user_select = $('#existing_user');

     if(other_user == null || other_user == undefined || other_user.trim() == ""){
      $existing_user_select.prop('disabled', false);
     } else {
      $existing_user_select.prop('disabled', true);
     }
  },

  clear_referral: function(e) {
    var $referral_modal = $("#referral-modal");
    $referral_modal.find("#service").removeAttr("disabled");
    $referral_modal.find("#service_hidden").removeAttr("disabled");

    $referral_modal.find("#agency").removeAttr("disabled");
    $referral_modal.find("#agency_hidden").removeAttr("disabled");

    var $location_select = $referral_modal.find("select#location");
    $location_select.removeAttr("disabled");
    $location_select.removeAttr("chosen-disabled");
    $location_select.trigger("chosen:updated");

    var $existing_user_select = $referral_modal.find("#existing_user_referral");
    $existing_user_select.removeAttr("disabled");
    $existing_user_select.removeAttr("chosen-disabled");
    $existing_user_select.trigger("chosen:updated");
  },

  close_referral: function(e) {
    e.preventDefault();
    var $referral_modal = $('#referral-modal');
    var password = $referral_modal.find('#password').val();
    var local_user = $referral_modal.find("#existing_user_referral").val();
    var remote_user = $referral_modal.find('#other_user').val();
    var is_remote = $referral_modal.find('#is_remote').prop('checked');
    var $localUserErrorDiv = $referral_modal.find(".local_user_flash");
    var $remoteUserErrorDiv = $referral_modal.find(".remote_user_flash");
    var $passwordErrorDiv = $referral_modal.find(".password_flash");
    var is_valid = true;
    if(is_remote){
      //Require remote user and password
      if(remote_user == null || remote_user == undefined || remote_user.trim() == ""){
        $remoteUserErrorDiv.children(".error").text(I18n.t("referral.user_mandatory")).css('color', 'red');
        $remoteUserErrorDiv.show();
        is_valid = false;
      }
      if(password == null || password == undefined || password.trim() == ""){
        $passwordErrorDiv.children(".error").text(I18n.t("encrypt.password_mandatory")).css('color', 'red');
        $passwordErrorDiv.show();
        is_valid = false;
      }
    } else {
      //Require local user
      if(local_user == null || local_user == undefined || local_user.trim() == ""){
        $localUserErrorDiv.children(".error").text(I18n.t("referral.user_mandatory")).css('color', 'red');
        $localUserErrorDiv.show();
        is_valid = false;
      }
    }
    if(is_valid){
      $localUserErrorDiv.hide();
      $remoteUserErrorDiv.hide();
      $passwordErrorDiv.hide();
      $(e.target).parents('form').submit();
      $referral_modal.foundation('close');
      $referral_modal.find('form')[0].reset();
      $referral_modal.find('.remote_toggle').hide();
      $referral_modal.find('.local_toggle').show();
      window.disable_loading_indicator = true;
    } else {
      return false;
    }
  },

  load_existing_users: function(onComplete) {
    var $referral_modal = $("#referral-modal");
    var $service_select = $referral_modal.find('select#service');
    var $agency_select = $referral_modal.find("select#agency");
    var $location_select = $referral_modal.find("select#location");
    var $existing_user_select = $('select#existing_user_referral');

    var data = {
      services: $service_select.val(),
      agency_id: $agency_select.val(),
      location: $location_select.val()
    }

    var self = this;
    if(!_.isEmpty(_.compact(_.values(data)))){

      $existing_user_select.empty();
      $existing_user_select.html('<option>' + I18n.t("messages.loading") + '</option>');
      $existing_user_select.trigger("chosen:updated");

      self.collection
          .fetch({data: data})
          .done(function(){
            $existing_user_select.empty();
            var select_options = [];
            if(self.collection.length > 0) {
              select_options.push('<option value=""></option>');
            } else {
              select_options.push('<option value="">'+I18n.t("no_results_found") +'</option>');
            }
            self.collection.each(function(user){
              var user_model = user.attributes;
              select_options.push('<option value="' + user_model.user_name + '">' + user_model.user_name + '</option>');
            })

            $existing_user_select.html(select_options.join(''));
            $existing_user_select.trigger("chosen:updated");

            if(onComplete) {
              onComplete();
            }
          });
    } else {
      alert(I18n.t('messages.valid_search_criteria'));
    }
  },

  on_user_change: function(e) {
    this.toggle_other_user(e);
    this.populate_filters(e);
  },

  populate_filters: function(e) {
    var selected_user_name = $(e.target).val();
    if(selected_user_name){
      var selected_user = this.collection.find_by_user_name(selected_user_name);
      if(selected_user){
        var $referral_modal = $("#referral-modal");
        $referral_modal.find("#agency_hidden").val(selected_user.organization);
        var $agency_select = $referral_modal.find("select#agency");
        $agency_select.val(selected_user.organization);

        this.populate_location_filter(selected_user.reporting_location_code);
      }
    }
  },


  populate_location_filter: function(location_code){
    var $location_select = $("#referral-modal select#location");
    $location_select.data('value', location_code);
    _primero.populate_location_select_boxes(function(){
      $location_select.val(location_code);
      $location_select.trigger("chosen:updated");
    });
  },

  select_user_location: function(){
    var $location_select = $("#referral-modal select#location");
    $location_select.val($location_select.data('value'))
    $location_select.trigger("chosen:updated");
  },

  clear_user_selection: function(){
    var $existing_user_select = $('select#existing_user_referral');
    $existing_user_select.empty();
    $existing_user_select.html('<option value=""></option>');
    $existing_user_select.trigger('change');
    $existing_user_select.trigger('chosen:updated');
  }

});
