var topElement;
$(document).on('stonehearthReady', function(){
   topElement = $(top);
   App.debugDock.addToDock(App.StonehearthObjectBrowserIcon);
});

App.StonehearthObjectBrowserIcon = App.View.extend({
   templateName: 'objectBrowserIcon',
   classNames: ['debugDockIcon'],

   didInsertElement: function() {
      $('#objectBrowserIcon').tooltipster();
      this.$().click(function() {
         App.debugView.addView(App.StonehearthObjectBrowserView, { trackSelected: true })
      })
   }

});

App.StonehearthObjectBrowserView = App.View.extend({
   templateName: 'objectBrowser',
   uriProperty: 'model',

   init: function() {
      this._super();
      this.backStack = [];
      this.forwardStack = [];
   },

   didInsertElement: function() {
      var self = this;

      // for some reason $(top) here isn't [ Window ] like everywhere else.  Why?  Dunno.
      // So annoying!  Use the cached value of $(top) we got in 'stonehearthReady'
      topElement.on("radiant_selection_changed.object_browser", function (_, data) {
         if (self.trackSelected) {
            var uri = data.selected_entity;
            if (uri) {
               self.navigateTo(uri);
            }
         }
      });

      this.$().draggable();

      if (self.relativeTo) {
         var top = self.relativeTo.top + 64;
         var left = self.relativeTo.left + 64;
         this.$().css({'top': top, 'left' : left})
      }
      this.$('.button').tooltipster({
         theme: 'tooltipster-shdt',
         arrow: true,
      });

      this.$('#body').on("click", ".navlink", function(event) {
         var uri = $(this).attr('href');

         event.preventDefault();

         self.trackSelected = false;
         self._updateTrackSelectedControl();

         if (event.shiftKey) {
            App.debugView.addView(App.StonehearthObjectBrowserView, {
                  uri: uri,
                  relativeTo: self.$().offset(),
               })
         } else {
            self.navigateTo(uri);
         }
      });

      $('#uriInput').keypress(function(e) {
         if (e.which == 13) {
            $(this).blur();
            self.navigateTo($(this).val());
         }
      });

      self._updateTrackSelectedControl();
      self._updateCollapsedControl();
   },

   destroy: function() {
      topElement.off("radiant_selection_changed.object_browser");
      this._super();
   },

   navigateTo: function(uri) {
      var currentUri = this.get('uri');
      if (uri != currentUri) {
         this.backStack.push(currentUri);
         this.forwardStack = [];
         this.set('uri', uri);
      }
   },

   _updateCollapsedControl : function() {
      var self = this;
      if (self.collapsed) {
         this.$('#collapse_image').addClass('fa-chevron-up')
                                  .removeClass('fa-chevron-down');
         this.$('#body').hide();
      } else {
         this.$('#collapse_image').removeClass('fa-chevron-up')
                                  .addClass('fa-chevron-down');
         this.$('#body').show();
      }
   },

   _updateTrackSelectedControl : function() {
      var self = this;
      if (self.trackSelected) {
         var selected = App.stonehearthClient.getSelectedEntity();
         if (selected) {
            self.set('uri', selected)
         }
         this.$("#trackSelected").addClass('depressed');
      } else {
         this.$("#trackSelected").removeClass('depressed');
      }
   },

   _updateToggleRawViewControl : function() {
      var self = this;
      if (self.showRawView) {
         this.$("#toggleRawView").addClass('depressed');
      } else {
         this.$("#toggleRawView").removeClass('depressed');
      }
   },

   actions: {
      goBack: function() {
         if (this.backStack.length > 0) {
            var currentUri = this.get('uri');

            var nextUri = this.backStack.pop();
            this.forwardStack.push(currentUri);
            this.set('uri', nextUri);
         }
      },

      goForward: function () {
         if (this.forwardStack.length > 0) {
            var currentUri = this.get('uri');

            var nextUri = this.forwardStack.pop();
            this.backStack.push(currentUri);
            this.set('uri', nextUri);
         }
      },

      close: function () {
         this.destroy();
      },

      toggleCollapsed: function() {
         var self = this;
         self.collapsed = !self.collapsed;
         self._updateCollapsedControl();
      },

      toggleTrackSelected: function() {
         var self = this;
         self.trackSelected = !self.trackSelected;
         self._updateTrackSelectedControl();
      },

      toggleRawView: function() {
         var self = this;
         self.set('showRawView', !self.get('showRawView'));
         self._updateToggleRawViewControl();
      }
   }
});


App.StonehearthObjectBrowserContentView = App.View.extend({
   templateName: 'objectBrowserContent',
   uriProperty: 'model',

   subViewClass: function() {
      var known_types = {
         'stonehearth:game_master:encounter' :  'stonehearthObjectBrowserEncounter',
      }
      var type = this.get('model.__controller');
      var subViewClass = known_types[type];
      if (!subViewClass) {
         subViewClass = 'stonehearthObjectBrowserRaw';
      }      

      if (this._lastSubViewClass && this._lastSubViewClass != subViewClass) {
         Ember.run.scheduleOnce('afterRender', this, 'rerender');
      }
      this._lastSubViewClass = subViewClass;

      return subViewClass;
   }.property('model', 'model.__controller'),
});

App.StonehearthObjectBrowserRawView = App.View.extend({
   templateName: 'stonehearthObjectBrowserRaw',
   uriProperty: 'model',

   raw_view: function() {
      var model = this.get('model');

      if (!model) {
         return '- no data -';
      }
      var json = JSON.stringify(model, undefined, 2);
      return json.replace(/&/g, '&amp;')
                 .replace(/</g, '&lt;')
                 .replace(/>/g, '&gt;')
                 .replace(/ /g, '&nbsp;')
                 .replace(/\n/g, '<br>')
                 .replace(/"(object:\/\/[^"]*)"/g, '<a class="navlink" href="$1">$1</a>')
                 .replace(/uri\":&nbsp;\"([^"]*)"/g, 'uri": <a class="navlink" href="$1">$1</a>');
   }.property('model'),
});


App.StonehearthObjectBrowserEncounterView = App.View.extend({
   uriProperty: 'model',
   components: {
      script : {},
      ctx : {}
   },

   init : function() {
      this._super();
   },

   didInsertElement: function() {
      this._super();
   },
   
   encounterSubViewClass: function() {
      var known_types = {
         'stonehearth:game_master:encounters:generator' :            'stonehearthObjectBrowserGeneratorEncounter',
         'stonehearth:game_master:encounters:wait' :                 'stonehearthObjectBrowserWaitEncounter',
         'stonehearth:game_master:encounters:wait_for_net_worth' :   'stonehearthObjectBrowserWaitForNetWorthEncounter',
         'stonehearth:game_master:encounters:wait_for_time_of_day' : 'stonehearthObjectBrowserWaitForTimeOfDayEncounter',
         'stonehearth:game_master:encounters:collection_quest' :     'stonehearthObjectBrowserCollectionQuestEncounter',
      }

      var type = this.get('model.script.__controller');
      var encounterSubViewClass = known_types[type];
      if (!encounterSubViewClass) {
         encounterSubViewClass = 'stonehearthObjectBrowserRawEncounter';
      }

      if (this._lastEncounterSubViewClass && this._lastEncounterSubViewClass != encounterSubViewClass) {
         var parentView = this.get('parentView');
         if (parentView) {
            Ember.run.scheduleOnce('afterRender', parentView, 'rerender');
         }
      }
      this._lastEncounterSubViewClass = encounterSubViewClass;
      return encounterSubViewClass;
   }.property('model', 'model.script.__controller'),
});

App.StonehearthObjectBrowserBaseView = App.View.extend({
   uriProperty: 'model',
   components: {
      ctx : {}
   },

   destroy : function() {
      self._dead = true
      if (self._interval) {
         clearInterval(self._interval);
         self._interval = null;
      }
   },

   didInsertElement: function() {
      var self = this;

      self._super();
      if (self.pollRate && !self._interval) {
         self._poll_encounter();
         self._interval = setInterval(function() { self._poll_encounter(); }, self.pollRate);
      }
   },

   _poll_encounter : function() {
      var self = this;
      if (!self._dead) {
         self._call_encounter('get_progress_cmd')
                  .done(function(o) {
                     if (!self._dead) {
                        self.set('progress', o);
                     }
                  })
      }
   },

   _call_encounter : function(method, arg0, arg1, arg2) {
      var obj = this.get('model.__self');
      return radiant.call_obj(obj, method, arg0, arg1, arg2)
                        .fail(function(o) {
                           console.log('failed!', o)
                        })      
   }   
});

App.StonehearthObjectBrowserRawEncounterView = App.StonehearthObjectBrowserBaseView.extend({
});

App.StonehearthObjectBrowserWaitEncounterView = App.StonehearthObjectBrowserBaseView.extend({
   pollRate: 500,
   actions: {
      triggerNow: function() {
         this._call_encounter('trigger_now_cmd');
      },
   }
});

App.StonehearthObjectBrowserGeneratorEncounterView = App.StonehearthObjectBrowserBaseView.extend({
   pollRate: 500,
   actions: {
      triggerNow: function() {
         this._call_encounter('trigger_now_cmd');
      },
   }
});

App.StonehearthObjectBrowserWaitForNetWorthEncounterView = App.StonehearthObjectBrowserBaseView.extend({
   pollRate: 500,
   actions: {
      triggerNow: function() {
         this._call_encounter('trigger_now_cmd');
      },
   }
});

App.StonehearthObjectBrowserWaitForTimeOfDayEncounterView = App.StonehearthObjectBrowserBaseView.extend({
   pollRate: 500,
   actions: {
      triggerNow: function() {
         this._call_encounter('trigger_now_cmd');
      },
   }
});

App.StonehearthObjectBrowserCollectionQuestEncounterView = App.StonehearthObjectBrowserBaseView.extend({
   pollRate: 500,
   actions: {
      forceReturnNow: function() {
         this._call_encounter('force_return_now_cmd');
      },
   }
});

App.stonehearthObjectBrowserDebugCommandsView = App.StonehearthObjectBrowserView.extend({
   templateName: 'stonehearthObjectBrowserDebugCommands',
   didInsertElement: function() {
      var self = this;
      self._super();
      // Generate list of all console commands that apply to the selected entity.
      var allCommands = radiant.console.getCommands();
      var possibleCommandsArray = [];
      radiant.each(allCommands, function(key, command) {
         if (command.test && command.test(self.get('model'))) {
            possibleCommandsArray.push(key);
         }
      });
      self.set('consoleCommands', possibleCommandsArray);

      if (self.posX && self.posY) {
         self.$("#objectBrowser").css({top: self.posY, left: self.posX, position:'absolute'});
      }
   },
   actions: {
      doConsoleCommand: function(command) {
         radiant.console.run(command);
      },
   }
});



