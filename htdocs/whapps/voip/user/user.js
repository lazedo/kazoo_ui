winkstart.module('voip', 'user',
    {
        css: [
            'css/user.css'
        ],

        /* What HTML templates will we be using? */
        templates: {
            user: 'tmpl/user.html',
            editUser: 'tmpl/edit.html'
        },

        /* What events do we listen for, in the browser? */
        subscribe: {
            'user.activate' : 'activate',
            'user.list-panel-click' : 'editUser',
            'user.edit-user' : 'editUser'
        },

        validation : [
                {name : '#first_name', regex : /^[a-zA-Z\s\-\']+$/},
                {name : '#last_name', regex : /^[a-zA-Z\s\-\']+$/},
                {name : '#email', regex: /^([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/},
                {name : '#caller_id_number_internal', regex: /^[\+]?[0-9\s\-\.\(\)]*$/},
                {name : '#caller_id_name_internal', regex: /^.*$/},
                {name : '#caller_id_number_external', regex: /^[\+]?[0-9\s\-\.\(\)]*$/},
                {name : '#caller_id_name_external', regex: /^.*/},
                {name : '#hotdesk_id', regex: /^[0-9\+\#\*]*$/},
                {name : '#hotdesk_pin', regex: /^[0-9]*$/},
                {name : '#call_forward_number', regex: /^[\+]?[0-9]*$/}
        ],

        /* What API URLs are we going to be calling? Variables are in { }s */
        resources: {
            "user.list": {
                url: '{api_url}/accounts/{account_id}/users',
                contentType: 'application/json',
                verb: 'GET'
            },
            "user.get": {
                url: '{api_url}/accounts/{account_id}/users/{user_id}',
                contentType: 'application/json',
                verb: 'GET'
            },
            "user.create": {
                url: '{api_url}/accounts/{account_id}/users',
                contentType: 'application/json',
                verb: 'PUT'
            },
            "user.update": {
                url: '{api_url}/accounts/{account_id}/users/{user_id}',
                contentType: 'application/json',
                verb: 'POST'
            },
            "user.delete": {
                url: '{api_url}/accounts/{account_id}/users/{user_id}',
                contentType: 'application/json',
                verb: 'DELETE'
            },
            "hotdesk.list": {
                url: '{api_url}/accounts/{account_id}/users/hotdesks',
                contentType: 'application/json',
                verb: 'GET'
            }
        }
    },

    /* Bootstrap routine - run when the module is first loaded */
    function(args) {
        /* Tell winkstart about the APIs you are going to be using (see top of this file, under resources */
        winkstart.registerResources(this.__whapp, this.config.resources);

        winkstart.publish('subnav.add', {
            whapp: 'voip',
            module: this.__module,
            label: 'Users',
            icon: 'user',
            weight: '10'
        });
    },

    {
        validateForm: function(state) {
            var THIS = this;
            
            $(THIS.config.validation).each(function(k, v) {
                if(state == undefined) {
                    winkstart.validate.add($(v.name), v.regex);
                } else if (state == 'save') {
                    winkstart.validate.save($(v.name), v.regex);
                }
            });
        },

        saveUser: function(user_id, form_data) {
            var THIS = this,
                tmpPassword = form_data.pwd_mngt_pwd1;

            /* Check validation before saving */
            THIS.validateForm('save');

            if(form_data.pwd_mngt_pwd1 == form_data.pwd_mngt_pwd2) {
                if(!$('.invalid').size()) {
                    /* Construct the JSON we're going to send */

                    /* Is this a create or edit? See if there's a known ID */
                    if (user_id) {
                        
                        winkstart.getJSON('user.get', {
                            crossbar: true,
                            account_id: winkstart.apps['voip'].account_id,
                            api_url: winkstart.apps['voip'].api_url,
                            user_id: user_id
                        }, function(data, status){
                            delete data.data.id;
                            
                            // If there is no apps object
                            if (!("apps" in data.data)) {
                                data.data.apps = {};
                            }
                            
                            // If the user is an admin
                            if (form_data.user_level == "admin") {
                                if (!("voip" in data.data.apps)) {
                                    data.data.apps.voip = {
                                        "label": "VoIP Services",
                                        "icon": "phone",
                                        "api_url": winkstart.apps['voip'].api_url
                                    };
                                }
                                
                                if ("userportal" in data.data.apps) {
                                    delete data.data.apps.userportal;
                                }
                            } else { // If the user is a "simple" user.
                                if (!("userportal" in data.data.apps)) {
                                    data.data.apps.userportal = {
                                        "label": "User Portal",
                                        "icon": "userportal",
                                        "api_url": winkstart.apps['voip'].api_url
                                    };
                                }
                                
                                if ("voip" in data.data.apps) {
                                    delete data.data.apps.voip;
                                }
                            }
                            delete form_data.pwd_mngt_pwd1;
                            delete form_data.pwd_mngt_pwd2;
                            delete form_data.user_level;
                        
                            var newform_data = $.extend(true, {}, data.data, form_data);

                            if(form_data.hotdesk == undefined) delete newform_data.hotdesk;
                            if(form_data.caller_id.internal == undefined) delete newform_data.caller_id.internal;
                            if(form_data.caller_id.external == undefined) delete newform_data.caller_id.external;

                            var rest_data = {};
                            rest_data.crossbar = true;
                            rest_data.account_id = winkstart.apps['voip'].account_id,
                            rest_data.api_url = winkstart.apps['voip'].api_url,
                            rest_data.user_id = user_id;
                            rest_data.data = newform_data;
                            
                            // If another password is set ("fakePassword" is the default value)
                            if (tmpPassword != "fakePassword") {
                                rest_data.data.password = tmpPassword;
                            }
            
                            /* EDIT */
                            winkstart.postJSON('user.update', rest_data, function (json, xhr) {
                                /* Refresh the list and the edit content */
                                THIS.renderList();
                                THIS.editUser({
                                    id: user_id
                                });
                            });
                        });
                        
                        
                    } else {
                        /* CREATE */
                        
                        form_data.apps = {};
                        
                        if (form_data.user_level == "admin") {
                            form_data.apps.voip = {
                                "label": "VoIP Services",
                                "icon": "phone",
                                "api_url": winkstart.apps['voip'].api_url
                            };
                        } else {
                            form_data.apps.userportal = {
                                "label": "User Portal",
                                "icon": 'userportal',
                                "api_url": winkstart.apps['voip'].api_url
                            }
                        }
                        
                        var tmpPassword = form_data.pwd_mngt_pwd1;
                        
                        delete form_data.user_level;
                        delete form_data.pwd_mngt_pwd1;
                        delete form_data.pwd_mngt_pwd2;
                        
                        // If another password is set ("fakePassword" is the default value)
                        if (tmpPassword != "fakePassword") {
                            form_data.password = tmpPassword;
                        }

                        /* Actually send the JSON data to the server */
                        winkstart.putJSON('user.create', {
                            crossbar: true,
                            account_id: winkstart.apps['voip'].account_id,
                            api_url: winkstart.apps['voip'].api_url,
                            data: form_data
                        }, function (json, xhr) {
                            THIS.renderList();
                            THIS.editUser({
                                id: json.data.id
                            });
                        });
                    }

                } else {
                    alert('Please correct errors that you have on the form.');
                }
            } else {
                alert('Please confirm your password');
            }
        },

        /*
         * Create/Edit user properties (don't pass an ID field to cause a create instead of an edit)
         */
        editUser: function(data){

            $('#user-view').empty();
            var THIS = this;
            var form_data = {
                data : {
                    call_forward: {},
                    caller_id: {internal: { }, external: { }},
                    hotdesk: {}
                },
                field_data: {}
            };

            if (data && data.id) {
                /* This is an existing user - Grab JSON data from server for user_id */
                winkstart.getJSON('user.get', {
                    crossbar: true,
                    account_id: winkstart.apps['voip'].account_id,
                    api_url: winkstart.apps['voip'].api_url,
                    user_id: data.id
                }, function(json, xhr) {
                    /* On success, take JSON and merge with default/empty fields */
                    $.extend(true, form_data, json);

                    THIS.renderUser(form_data);
                });
            } else {
                /* This is a new user - pass along empty params */
                THIS.renderUser(form_data);
            }
        },

        deleteUser: function(user_id) {
            var THIS = this;
            
            var rest_data = {
                crossbar: true,
                account_id: winkstart.apps['voip'].account_id,
                api_url: winkstart.apps['voip'].api_url,
                user_id: user_id
            };

            /* Actually send the JSON data to the server */
            winkstart.deleteJSON('user.delete', rest_data, function (json, xhr) {
                THIS.renderList();
                $('#user-view').empty();
            });
        },

        cleanFormData: function(form_data){

            form_data.caller_id.internal.number = form_data.caller_id.internal.number.replace(/\s|\(|\)|\-|\./g,"");
            form_data.caller_id.external.number = form_data.caller_id.external.number.replace(/\s|\(|\)|\-|\./g,"");

            if(form_data.caller_id.internal.number == '' && form_data.caller_id.internal.name == '') delete form_data.caller_id.internal;
            if(form_data.caller_id.external.number == '' && form_data.caller_id.external.name == '') delete form_data.caller_id.external;

            if(form_data.hotdesk.require_pin == false) {
                delete form_data.hotdesk.pin
            }
            form_data.hotdesk.enable == false ? delete form_data.hotdesk : delete form_data.hotdesk.enable;
            form_data.call_forward.substitute = !form_data.call_forward.substitute;

            return form_data;
        },

        /**
         * Draw user fields/template and populate data, add validation. Works for both create & edit
         */
        renderUser: function(form_data){
            var THIS = this,
                user_id = form_data.data.id,
                user_html;
            
            // If the voip whapps is present, then it's an admin'
            if ('apps' in form_data.data && 'voip' in form_data.data.apps) {
                form_data.priv_level = 'admin';
            } else {
                form_data.priv_level = 'user';
            }
            if(form_data.data.hotdesk.require_pin != undefined) {
                form_data.data.hotdesk.enable = true;
            }
        
            /* Paint the template with HTML of form fields onto the page */
            user_html = THIS.templates.editUser.tmpl(form_data).appendTo( $('#user-view') );
            winkstart.timezone.populate_dropdown($('#timezone', user_html), form_data.data.timezone);

            winkstart.cleanForm();

            /* Initialize form field validation */
            THIS.validateForm();

            $("ul.settings1").tabs("div.pane > div");
            $("ul.settings2").tabs("div.advanced_pane > div");
            $("#first_name").focus();
            
            $(".advanced_pane").hide();
            $(".advanced_tabs_wrapper").hide();

            if(form_data.data.hotdesk.require_pin == undefined || form_data.data.hotdesk.require_pin == false) {
                $('#pin_wrapper', user_html).hide();
            }
            

            $("#advanced_settings_link").click(function(event) {
                if($(this).attr("enabled")=="true") {
                    $(this).attr("enabled", "false");
                    $(".advanced_pane").slideToggle(function(event) {
                        $(".advanced_tabs_wrapper").animate({width: 'toggle'});
                    });
                }
                else {
                    $(this).attr("enabled", "true");
                    $(".advanced_tabs_wrapper").animate({width: 'toggle'}, function(event) {
                        $(".advanced_pane").slideToggle();
                    });
                }
            });
        
            $('#hotdesk_require_pin',user_html).change(function() {
                $('#pin_wrapper',user_html).toggle();
            });

            /* Listen for the submit event (i.e. they click "save") */
            $('.user-save').click(function(event) {
                /* Save the data after they've clicked save */

                /* Ignore the normal behavior of a submit button and do our stuff instead */
                event.preventDefault();

                /* Grab all the form field data */
                var form_data = form2object('user-form');

                form_data = THIS.cleanFormData(form_data);

                THIS.saveUser(user_id, form_data);

                return false;
            });

            $('.user-cancel').click(function(event) {
                event.preventDefault();

                $('#user-view').empty();

                return false;
            });

            $('.user-delete').click(function(event) {
                /* Save the data after they've clicked save */

                /* Ignore the normal behavior of a submit button and do our stuff instead */
                event.preventDefault();

                THIS.deleteUser(user_id);

                return false;
            });
            
            $.each($('body').find('*[tooltip]'), function(){
                $(this).tooltip({attach:'body'});
            });
        },

        /* Builds the generic data list on the left hand side. It's responsible for gathering the data from the server
         * and populating into our standardized data list "thing".
         */
        renderList: function(){
            var THIS = this;

            winkstart.getJSON('user.list', {
                crossbar: true,
                account_id: winkstart.apps['voip'].account_id,
                api_url: winkstart.apps['voip'].api_url
            }, function (json, xhr) {

                // List Data that would be sent back from server
                function map_crossbar_data(crossbar_data){
                    var new_list = [];
                    if(crossbar_data.length > 0) {
                        _.each(crossbar_data, function(elem){
                            var title = elem.username;
                            if (elem.first_name) {
                                title += ' (' + elem.first_name;
                                if (elem.last_name) {
                                    title += ' ' + elem.last_name;
                                }
                                title += ')';
                            }

                            new_list.push({
                                id: elem.id,
                                title: elem.first_name + ' ' + elem.last_name
                            });
                        });
                    }
                    new_list.sort(function(a, b) {
                        var answer;
                        a.title.toLowerCase() < b.title.toLowerCase() ? answer = -1 : answer = 1;
                        return answer;
                    });
                    return new_list;
                }

                var options = {};
                options.label = 'User Module';
                options.identifier = 'user-module-listview';
                options.new_entity_label = 'Add User';
                options.data = map_crossbar_data(json.data);
                options.publisher = winkstart.publish;
                options.notifyMethod = 'user.list-panel-click';
                options.notifyCreateMethod = 'user.edit-user';  /* Edit with no ID = Create */

                $("#user-listpanel").empty();
                $("#user-listpanel").listpanel(options);

            });
        },

        /* This runs when this module is first loaded - you should register to any events at this time and clear the screen
         * if appropriate. You should also attach to any default click items you want to respond to when people click
         * on them. Also register resources.
         */
        activate: function(data) {
            $('#ws-content').empty();
            var THIS = this;
            this.templates.user.tmpl({}).appendTo( $('#ws-content') );

            winkstart.loadFormHelper('forms');

            winkstart.publish('layout.updateLoadedModule', {
                label: 'User Management',
                module: this.__module
            });

            $('.edit-user').live({
                click: function(evt){
                    var target = evt.currentTarget;
                    var user_id = target.getAttribute('rel');
                    winkstart.publish('user.edit-user', {
                        'user_id' : user_id
                    });
                }
            });

            THIS.renderList();
        }
    }
);
