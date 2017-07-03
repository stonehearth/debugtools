var topElement;
$(document).on('stonehearthReady', function(){
   topElement = $(top);
   App.debugDock.addToDock(App.StonehearthLuaConsoleIcon);
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

   init: function() {
      this._super();
   },

   didInsertElement: function() {
      var self = this;

      this.$().draggable();

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

      setTimeout(function () { self.switchEnv(false); }, 1);
   },

   destroy: function() {
      topElement.off("radiant_selection_changed.object_browser");
      this._super();
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
      this.currentEntity = null;
   },

   didInsertElement: function() {
      var self = this;

      topElement.on("radiant_selection_changed.object_browser", function (_, data) {
         self.currentEntity = App.stonehearthClient.getSubSelectedEntity();
         if (!self.currentEntity) {
            self.currentEntity = App.stonehearthClient.getSelectedEntity();
         }
      });

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

            radiant.call('debugtools:exec_script_' + self.env, command, self.currentEntity)
               .done(function (o) {
                  resultContainer.removeClass('progress').text(o.result);
               })
               .fail(function (o) {
                  if (typeof o.error == 'string') {
                     // Client failures don't decode. We should fix it at the root, but this hack here is fine for now.
                     o = JSON.parse(o.error)
                  }
                  resultContainer.removeClass('progress').addClass('error').text(o.result);
               });

            outputArea.scrollTop(outputArea[0].scrollHeight);
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

