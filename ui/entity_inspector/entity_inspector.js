$(document).on('stonehearthReady', function(){
   App.debugDock.addToDock(App.StonehearthEntityInspectorIcon);
});

// Icon that sits at the top of the screen to open a new entity
// inspector
App.StonehearthEntityInspectorIcon = App.View.extend({
   templateName: 'entityInspectorIcon',
   classNames: ['debugDockIcon'],

   didInsertElement: function() {
      var tooltip = i18n.t('debugtools:tooltip_icon_entity_inspector');
      $('#entityInspectorIcon').tooltipster({content: tooltip});
      this.$().click(function() {
         App.debugView.addView(App.StonehearthEntityInspectorView);
      })
   }
});

// Gets us from the debug info in the ai component to the first
// execution frame
App.StonehearthAiThreadView = App.View.extend({
   uriProperty: 'model',
});

// Used for all rows in the table.  Indents according to the depth
// in the tree
App.StonehearthAiRowView = App.View.extend({
   uriProperty: 'model',

   _onModelDepthUpdated: function() {
      var depth = this.get('model.depth');
      var styleOverride = 'padding-left: ' + (depth * 4) + 'px';
      this.set('styleOverride', styleOverride);
   }.observes('model.depth'),

   /* 
   // Uncomment to observe the models as they go flying by
   _onModelUpdated: function() {
      console.log('ai row model is ', this.get('model'));
   }.observes('model').on('init'),
   // */
});

// Execution frame.  Is recursive, so we can't use an inline view
App.StonehearthExecutionFrameView = App.StonehearthAiRowView.extend({
   templateName: 'executionFrame',
});

// Execution unit.  We just need to collect the action datastore before
// rendering...
App.StonehearthExecutionUnitView = App.StonehearthAiRowView.extend({
   components: {
      "action": {}
   },
});

// The inspector.  Just call `debug_info` on the ai_component to get the
// root datastore with the debug info in it.
App.StonehearthEntityInspectorView = App.View.extend({
   templateName: 'entityInspector',
   uriProperty: 'model',
   closeOnEsc: true,

   init: function() {
      this._super();

      var self = this;
      $(top).on("radiant_selection_changed.entity_inspector", function (_, data) {
         self.set('uri', data.selected_entity)
     });
   },

   _updateAiComponent: function() {
      var self = this;
      self.set('model.debug_info', undefined)
      radiant.call_obj(self.get('model.stonehearth:ai'), 'get_debug_info')
         .done(function(o) {
            self.set('model.debug_info', o.debug_info);
         })
         .fail(function(o) {
            console.log(o);
         });
   }.observes('model.stonehearth:ai'),

   destroy: function() {
      $(top).off("radiant_selection_changed.entity_inspector");
      this._super(); 
   },

   didInsertElement: function() {
      var self = this;
      this.$('.close').click(function() {
         self.destroy();
      });
   }
});
