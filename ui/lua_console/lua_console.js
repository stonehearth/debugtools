$(document).on('stonehearthReady', function(){
   App.debugDock.addToDock(App.StonehearthLuaConsoleIcon);
   radiant.call('radiant:get_config', 'mods.debugtools.enable_lua_console_hotkey')
      .done(function (o) {
         if (o['mods.debugtools.enable_lua_console_hotkey']) {
            $(top).bind('keydown', function (e) {
               if (e.keyCode == 192 && !e.originalEvent.repeat) { // Tilde/backtick
                  App.debugView.getView(App.StonehearthLuaConsoleIcon).$().click();
                  e.preventDefault();
                  e.stopPropagation();
               }
            });
         }
      });
});

App.StonehearthLuaConsoleIcon = App.View.extend({
   templateName: 'luaConsoleIcon',
   classNames: ['debugDockIcon'],

   didInsertElement: function() {
      $('#luaConsoleIcon').tooltipster();
      this.$().click(function () {
         var view = App.debugView.getView(App.StonehearthLuaConsoleView);
         if (view) {
            view.$().toggle();
            if (view.$().is(':visible')) {
               view.focus();
            }
         } else {
            App.debugView.addView(App.StonehearthLuaConsoleView)
         }
      });
   }
});

App.StonehearthLuaConsoleView = App.View.extend({
   templateName: 'luaConsole',
   uriProperty: 'model',
   envContainer: Ember.ContainerView.extend(),

   didInsertElement: function() {
      var self = this;

      this.$().draggable({ handle: '.header' });

      this.$('.button').tooltipster({
         theme: 'tooltipster-shdt',
         arrow: true,
      });

      this.$("#closeConsoleButton").click(function () {
         self.$().hide();
      });

      self.clientEnv = App.StonehearthLuaConsoleEnvironmentView.create({ env: 'client' });
      self.serverEnv = App.StonehearthLuaConsoleEnvironmentView.create({ env: 'server' });

      self.get('envContainerInstance').pushObject(self.serverEnv);
      self.get('envContainerInstance').pushObject(self.clientEnv);

      setTimeout(function () { self.switchEnv(true); }, 1);
   },

   switchEnv: function (isClient) {
      var toShow = isClient ? this.clientEnv : this.serverEnv;
      var toHide = isClient ? this.serverEnv : this.clientEnv;

      toHide.$().hide();
      toShow.$().show();
      toShow.focus();

      var toSelect = isClient ? '#clientButton' : '#serverButton';
      var toDeselect = isClient ? '#serverButton' : '#clientButton';
      this.$(toSelect).addClass('selected');
      this.$(toDeselect).removeClass('selected');
   },

   focus: function () {
      if (this.clientEnv.$().is(':visible')) {
         this.clientEnv.focus();
      } else {
         this.serverEnv.focus();
      }
   },
   
   actions: {
      switchToServer: function () {
         this.switchEnv(false);
      },

      switchToClient: function () {
         this.switchEnv(true);
      }
   }
});

App.StonehearthLuaConsoleEnvironmentView = App.View.extend({
   templateName: 'stonehearthLuaConsoleEnvironment',
   uriProperty: 'model',
   env: null,

   init: function () {
      this._super();
      this._history = [];
      this._curHistoryIdx = 0;
      this._curCommand = '';
   },

   didInsertElement: function() {
      var self = this;

      self.$('#input').keydown(function(e) {
         if (e.keyCode == 13 && !e.originalEvent.repeat) {  // Enter
            var command = $(this).val();
            if (!command) return;
            self._history.push(command);
            $(this).val('');
            self._curHistoryIdx = self._history.length - 1;

            var outputArea = self.$('.output');
            outputArea.append($('<div class="cmdIn">').text('> ' + command));

            var resultContainer = $('<div class="cmdOut progress">').text('...');
            outputArea.append(resultContainer);

            var currentEntity = App.stonehearthClient.getSubSelectedEntity();
            if (!currentEntity) {
               currentEntity = App.stonehearthClient.getSelectedEntity();
            }
            radiant.call('debugtools:exec_script_' + self.env, command, currentEntity)
               .done(function (o) {
                  resultContainer.removeClass('progress').text(o.result);
                  outputArea.scrollTop(outputArea[0].scrollHeight);
               })
               .fail(function (o) {
                  if (typeof o.error == 'string') {
                     // Client failures don't decode. We should fix it at the root, but this hack here is fine for now.
                     o = JSON.parse(o.error)
                  }
                  resultContainer.removeClass('progress').addClass('error').text(o.result);
                  outputArea.scrollTop(outputArea[0].scrollHeight);
               });

            outputArea.scrollTop(outputArea[0].scrollHeight);
         } else if (e.keyCode == 27) {  // Esc
            App.debugView.getView(App.StonehearthLuaConsoleIcon).$().click();
            e.preventDefault();
            e.stopPropagation();
         }
      });

      this.$('#input').keydown(function (e) {
         if (e.keyCode == 38) {  // UpArrow
            if (self._curHistoryIdx == self._history.length - 1) {
               // Remember our current command, if any.
               if ($(this).val() != '') {
                  self._curCommand = $(this).val();
               }
            }

            $(this).val(self._history[self._curHistoryIdx]);

            self._curHistoryIdx--;
            if (self._curHistoryIdx < 0) {
               self._curHistoryIdx = 0;
            }
            e.preventDefault();
         } else if (e.keyCode == 40) { // DownArrow
            if (self._curHistoryIdx == self._history.length - 1) {
               if (self._curCommand != '') {
                  $(this).val(self._curCommand);
                  self._curCommand = '';
               }
               return;
            }
            self._curHistoryIdx++;
            $(this).val(self._history[self._curHistoryIdx]);
            e.preventDefault();
         }
      });
   },

   focus: function () {
      this.$('#input').focus();
   },
});

