winkstart.module('voip', 'timeofday', {
        css: [
            'css/timeofday.css'
        ],

        templates: {
            timeofday: 'tmpl/timeofday.html',
            edit: 'tmpl/edit.html'
            //timeofday_callflow: 'tmpl/conference_timeofday.html'
        },

        subscribe: {
            'timeofday.activate': 'activate',
            'timeofday.edit': 'edit_timeofday',
        },

        formData: {
            wdays: [
                'Sunday',
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday'
            ],

            day: [
                '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16',
                '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31'
            ],

            cycle: [
                { id: 'weekly', value: 'Weekly' },
                { id: 'monthly', value:'Monthly' },
                { id: 'yearly', value:'Yearly' }
            ],

            ordinals: [
                { id: 'first', value: 'First' },
                { id: 'second', value: 'Second' },
                { id: 'third', value: 'Third' },
                { id: 'fourth', value: 'Fourth' },
                { id: 'last', value: 'Last' },
                { id: 'day', value: 'Day' },
            ],

            months: [
                { id: 1, value: 'January' },
                { id: 2, value: 'February' },
                { id: 3, value: 'March' },
                { id: 4, value: 'April' },
                { id: 5, value: 'May' },
                { id: 6, value: 'June' },
                { id: 7, value: 'July' },
                { id: 8, value: 'August' },
                { id: 9, value: 'September' },
                { id: 10, value: 'October' },
                { id: 11, value: 'November' },
                { id: 12, value: 'December' }
            ]
        },

        validation: [
            { name: '#name', regex: /^[a-zA-Z0-9\s_']+$/ }
        ],

        resources: {
            'timeofday.list': {
                url: '{api_url}/accounts/{account_id}/temporal_rules',
                contentType: 'application/json',
                verb: 'GET'
            },
            'timeofday.get': {
                url: '{api_url}/accounts/{account_id}/temporal_rules/{timeofday_id}',
                contentType: 'application/json',
                verb: 'GET'
            },
            'timeofday.create': {
                url: '{api_url}/accounts/{account_id}/temporal_rules',
                contentType: 'application/json',
                verb: 'PUT'
            },
            'timeofday.update': {
                url: '{api_url}/accounts/{account_id}/temporal_rules/{timeofday_id}',
                contentType: 'application/json',
                verb: 'POST'
            },
            'timeofday.delete': {
                url: '{api_url}/accounts/{account_id}/temporal_rules/{timeofday_id}',
                contentType: 'application/json',
                verb: 'DELETE'
            }
        }
    },

    function(args) {
        winkstart.registerResources(this.__whapp, this.config.resources);

        winkstart.publish('subnav.add', {
            whapp: 'voip',
            module: this.__module,
            label: 'Time Of Day',
            icon: 'timeofday',
            weight: '25'
        });
    },

    {
        save_timeofday: function(form_data, data, success, error) {
            var THIS = this,
                normalized_data = THIS.normalize_data($.extend(true, {}, data.data, form_data));

            if(typeof data.data == 'object' && data.data.id) {
                winkstart.request(true, 'timeofday.update', {
                        account_id: winkstart.apps['voip'].account_id,
                        api_url: winkstart.apps['voip'].api_url,
                        timeofday_id: data.data.id,
                        data: normalized_data
                    },
                    function(_data, status) {
                        if(typeof success == 'function') {
                            success(_data, status, 'update');
                        }
                    },
                    function(_data, status) {
                        if(typeof error == 'function') {
                            error(_data, status, 'update');
                        }
                    }
                );
            }
            else {
                winkstart.request(true, 'timeofday.create', {
                        account_id: winkstart.apps['voip'].account_id,
                        api_url: winkstart.apps['voip'].api_url,
                        data: normalized_data
                    },  
                    function(_data, status) {
                        if(typeof success == 'function') {
                            success(_data, status, 'create');
                        }
                    },
                    function(_data, status) {
                        if(typeof error == 'function') {
                            error(_data, status, 'create');
                        }
                    }
                );
            }
        },

        edit_timeofday: function(data, _parent, _target, _callbacks) {
            var THIS = this,
                parent = _parent || $('#timeofday-content'),
                target = _target || $('#timeofday-view', parent)
                _callbacks = _callbacks || {},
                callbacks = {
                    save_success: _callbacks.save_success || function(_data) {
                            THIS.render_list(parent);

                            THIS.edit_timeofday({ id: _data.data.id }, parent, target, callbacks);
                    },

                    save_error: _callbacks.save_error,

                    delete_success: _callbacks.delete_success || function() {
                        target.empty();

                        THIS.render_list(parent);
                    },

                    delete_error: _callbacks.delete_error,

                    after_render: _callbacks.after_render
                },
                defaults = {
                    data: {     
                        time_window_start: 0,
                        time_window_stop: 0,
                        wdays: [],
                        days: [],
                        interval: 1
                    },
                    field_data: THIS.config.formData
                };
            
            if(typeof data == 'object' && data.id) {
                winkstart.request(true, 'timeofday.get', {
                        account_id: winkstart.apps['voip'].account_id,
                        api_url: winkstart.apps['voip'].api_url,
                        timeofday_id: data.id
                    },
                    function(_data, status) {
                        _data = THIS.format_data(_data);
                        _data = THIS.migrate_data(_data);
                    
                        THIS.render_timeofday($.extend(true, defaults, _data), target, callbacks);

                        if(typeof callbacks.after_render == 'function') {
                            callbacks.after_render();
                        }
                    }
                );
            }
            else {
                THIS.render_timeofday(defaults, target, callbacks);

                if(typeof callbacks.after_render == 'function') {
                    callbacks.after_render();
                }
            }
        },

        delete_timeofday: function(data, success, error) {
            var THIS = this;

            if(data.data.id) {
                winkstart.request(true, 'timeofday.delete', {
                        account_id: winkstart.apps['voip'].account_id,
                        api_url: winkstart.apps['voip'].api_url,
                        timeofday_id: data.data.id
                    },
                    function(_data, status) {
                        if(typeof success == 'function') {
                            success(_data, status);
                        }
                    },
                    function(_data, status) {
                        if(typeof error == 'function') {
                            error(_data, status);
                        }
                    }
                );
            }
        },

        render_timeofday: function(data, target, callbacks){
            
            var THIS = this,
                wday,
                timeofday_html = THIS.templates.edit.tmpl(data);

            winkstart.validate.set(THIS.config.validation, timeofday_html);

            $('*[tooltip]', timeofday_html).each(function() {
                $(this).tooltip({ attach: timeofday_html });
            });

            $('ul.settings1', timeofday_html).tabs($('.pane > div', timeofday_html));
            $('ul.settings2', timeofday_html).tabs($('.advanced_pane > div', timeofday_html));

            $('#name', timeofday_html).focus();

            $('.advanced_pane', timeofday_html).hide();
            $('.advanced_tabs_wrapper', timeofday_html).hide();

            $('#start_date', timeofday_html).datepicker();

            $('#yearly_every', timeofday_html).hide();
            $('#monthly_every', timeofday_html).hide();
            $('#weekly_every', timeofday_html).hide();
            $('#ordinal', timeofday_html).hide();
            $('#days_checkboxes', timeofday_html).hide();
            $('#weekdays', timeofday_html).hide();
            $('#specific_day', timeofday_html).hide();

            $('#advanced_settings_link', timeofday_html).click(function() {
                if($(this).attr('enabled') === 'true') {
                    $(this).attr('enabled', 'false');

                    $('.advanced_pane', timeofday_html).slideToggle(function() {
                        $('.advanced_tabs_wrapper').animate({ width: 'toggle' });
                    });
                }
                else {
                    $(this).attr('enabled', 'true');

                    $('.advanced_tabs_wrapper').animate({
                            width: 'toggle'
                        },
                        function() {
                            $('.advanced_pane').slideToggle();
                        }
                    );
                }
            });

            if(data.data.id == undefined) {
                $('#weekly_every', timeofday_html).show();
                $('#days_checkboxes', timeofday_html).show();
            } else {
                if(data.data.cycle == 'monthly') {
                    $('#monthly_every', timeofday_html).show();
                    $('#ordinal', timeofday_html).show();
                    if(data.data.days != undefined && data.data.days[0] != undefined) {
                        $('#specific_day', timeofday_html).show();
                    } else {
                        $('#weekdays', timeofday_html).show();
                    }
                } else if(data.data.cycle == 'yearly') {
                    $('#yearly_every', timeofday_html).show();
                    $('#ordinal', timeofday_html).show();
                    if(data.data.days != undefined && data.data.days[0] != undefined) {
                        $('#specific_day', timeofday_html).show();
                    } else {
                        $('#weekdays', timeofday_html).show();
                    }
                } else if(data.data.cycle = 'weekly') {
                    $('#weekly_every', timeofday_html).show();
                    $('#days_checkboxes', timeofday_html).show();
                }
            }

            $('.fake_checkbox', timeofday_html).click(function() {
                $(this).toggleClass('checked');
            });

            $('#ordinal', timeofday_html).change(function() {
                if($(this).val() == 'day') {
                    $('#weekdays', timeofday_html).hide();
                    $('#specific_day', timeofday_html).show();
                } else {
                    $('#weekdays', timeofday_html).show();
                    $('#specific_day', timeofday_html).hide();
                }
            });

            $('#cycle', timeofday_html).change(function() {
                $('#yearly_every', timeofday_html).hide();
                $('#monthly_every', timeofday_html).hide();
                $('#weekly_every', timeofday_html).hide();
                $('#ordinal', timeofday_html).hide();
                $('#days_checkboxes', timeofday_html).hide();
                $('#weekdays', timeofday_html).hide();
                $('#specific_day', timeofday_html).hide();

                switch($(this).val()) {
                    case 'yearly': 
                        $('#yearly_every', timeofday_html).show();
                        $('#ordinal', timeofday_html).show();
                        if($('#ordinal', timeofday_html).val() == 'day') {
                            $('#weekdays', timeofday_html).hide();
                            $('#specific_day', timeofday_html).show();
                        } else {
                            $('#weekdays', timeofday_html).show();
                            $('#specific_day', timeofday_html).hide();
                        }
                        break;
                        
                    case 'monthly': 
                        $('#monthly_every', timeofday_html).show();
                        $('#ordinal', timeofday_html).show();
                        if($('#ordinal', timeofday_html).val() == 'day') {
                            $('#weekdays', timeofday_html).hide();
                            $('#specific_day', timeofday_html).show();
                        } else {
                            $('#weekdays', timeofday_html).show();
                            $('#specific_day', timeofday_html).hide();
                        }
                        break;

                    case 'weekly': 
                        $('#weekly_every', timeofday_html).show();
                        $('#days_checkboxes', timeofday_html).show();
                        break;
                }
            });

            $('.timeofday-save', timeofday_html).click(function(ev) {
                ev.preventDefault();

                winkstart.validate.is_valid(THIS.config.validation, timeofday_html, function() {
                        var form_data = form2object('timeofday-form');

                        form_data.wdays = [];

                        $('.fake_checkbox.checked', timeofday_html).each(function() {
                            form_data.wdays.push($(this).dataset('value'));                    
                        });
            
                        form_data.interval = $('#cycle', timeofday_html).val() == 'monthly' ? $('#interval_month', timeofday_html).val() : $('#interval_week', timeofday_html).val();

                        form_data = THIS.clean_form_data(form_data);

                        THIS.save_timeofday(form_data, data, callbacks.save_success, callbacks.save_error);
                    },
                    function() {
                        alert('There were errors on the form, please correct!');
                    }
                );
            });

            $('.timeofday-delete', timeofday_html).click(function(ev) {
                ev.preventDefault();

                THIS.delete_timeofday(data, callbacks.delete_success, callbacks.delete_error);
            });

            (target)
                .empty()
                .append(timeofday_html);

            $('#time', timeofday_html).slider({
                from: 0,
                to: 86400,
                step: 900,
                dimension: '',
                scale: ['12:00am', '1:00am', '2:00am', '3:00am', '4:00am', '5:00am', 
                        '6:00am', '7:00am', '8:00am',  '9:00am', '10:00am', '11:00am', 
                        '12:00pm', '1:00pm', '2:00pm', '3:00pm', '4:00pm', '5:00pm',
                        '6:00pm', '7:00pm', '8:00pm', '9:00pm', '10:00pm', '11:00pm', '12:00am'],
                limits: false,
                calculate: function(val) {
                    var hours = Math.floor(val / 3600),
                        mins = (val - hours * 3600) / 60,
                        meridiem = (hours < 12) ? 'am' : 'pm';

                    hours = hours % 12;                    

                    if (hours == 0)
                        hours = 12;

                    return hours + ':' + (mins ? mins : '0' + mins)  + meridiem;
                },
                onstatechange: function () {}
            });
        },

        clean_form_data: function(form_data) {
            var wdays = [],
                times = form_data.time.split(';');
            if(form_data.cycle != 'weekly' && form_data.weekday != undefined) {
                form_data.wdays = [];
                form_data.wdays.push(form_data.weekday);
            } 

            $.each(form_data.wdays, function(i, val) {
                if(val) {
                    if(val == 'wednesday') {
                        val = 'wensday';
                    }
                    wdays.push(val);
                }
            });

            if(wdays.length > 0 && wdays[0] == 'sunday') {
                wdays.push(wdays.shift());
            }
            form_data.wdays = wdays;
            
            form_data.start_date = new Date(form_data.start_date).getTime()/1000 + 62167219200;
            
            form_data.time_window_start = times[0];
            form_data.time_window_stop = times[1];
           
            return form_data;
        },

        normalize_data: function(form_data) {
            if(form_data.cycle == 'weekly') {
                delete form_data.ordinal;
                delete form_data.days;
                delete form_data.month;
            } 
            else {
                form_data.cycle == 'yearly' ? delete form_data.interval : delete form_data.month;
                form_data.ordinal != 'day' ? delete form_data.days : delete form_data.wdays;
            }

            delete form_data.time; 
            delete form_data.weekday;

            return form_data;
        },

        format_data: function(data) {
            var tmp_date = data.data.start_date == undefined ? new Date() : new Date((data.data.start_date - 62167219200)* 1000);
            var month = tmp_date.getMonth()+1 < 10 ? '0'+(tmp_date.getMonth()+1) : tmp_date.getMonth()+1;
            var day = tmp_date.getDate() < 10 ? '0'+tmp_date.getDate() : tmp_date.getDate();
            tmp_date = month + '/' + day + '/'  + tmp_date.getFullYear();

            data.data.start_date = tmp_date;

            if(data.data.wdays != undefined && data.data.cycle != 'weekly') {
                data.data.weekday = data.data.wdays[0];
            }

            return data;
        },
    
        migrate_data: function(data) {
            // Check for spelling ;)
            if('wdays' in data.data && (wday = $.inArray('wensday', data.data.wdays)) > -1) {
                data.data.wdays[wday] = 'wednesday';
            }

            return data;
        },

        render_list: function(parent){
            var THIS = this;

            winkstart.request(true, 'timeofday.list', {
                    account_id: winkstart.apps['voip'].account_id,
                    api_url: winkstart.apps['voip'].api_url
                },
                function(data, status) {
                    var map_crossbar_data = function(data) {
                        var new_list = [];

                        if(data.length > 0) {
                            $.each(data, function(key, val) {
                                new_list.push({
                                    id: val.id,
                                    title: val.name || '(no name)'
                                });
                            });
                        }

                        new_list.sort(function(a, b) {
                            return a.title.toLowerCase() < b.title.toLowerCase() ? -1 : 1;
                        });

                        return new_list;
                    };

                    $('#timeofday-listpanel', parent)
                        .empty()
                        .listpanel({
                            label: 'Time of Day',
                            identifier: 'timeofday-listview', 
                            new_entity_label: 'Add Time of Day',
                            data: map_crossbar_data(data.data),
                            publisher: winkstart.publish,
                            notifyMethod: 'timeofday.edit',
                            notifyCreateMethod: 'timeofday.edit',
                            notifyParent: parent
                        });
                }
            );
        },

        activate: function(parent) {
            var THIS = this,
                timeofday_html = THIS.templates.timeofday.tmpl();

            (parent || $('#ws-content'))
                .empty()
                .append(timeofday_html);

            THIS.render_list(timeofday_html);
        }
    }
);
