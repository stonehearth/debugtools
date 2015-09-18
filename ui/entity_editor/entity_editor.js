var topElement;
$(document).on('stonehearthReady', function(){
   topElement = $(top);
   App.debugDock.addToDock(App.StonehearthEntityEditorIcon);
});

App.StonehearthEntityEditorIcon = App.View.extend({
   templateName: 'entityEditorIcon',
   classNames: ['debugDockIcon'],

   didInsertElement: function() {
      $('#entityEditorIcon').tooltipster();
      this.$().click(function() {
         App.debugView.addView(App.StonehearthEntityEditorView);
      })
   }

});

App.StonehearthEntityEditorView = App.View.extend({
   templateName: 'entityEditor',
   uriProperty: 'model',
   components: {
      "mob" :{},
      "destination": {},
      "region_collision_shape": {}

   },

   axis_alignment_flags: {
      'X': 1,
      'Y': 2,
      'Z': 4
   },

   didInsertElement: function() {
      var self = this;
            // for some reason $(top) here isn't [ Window ] like everywhere else.  Why?  Dunno.
      // So annoying!  Use the cached value of $(top) we got in 'stonehearthReady'
      topElement.on("radiant_selection_changed.object_browser", function (_, data) {
         var uri = data.selected_entity;
         if (uri) {
            self.set('uri', uri)
         }
      });

      var selected = App.stonehearthClient.getSelectedEntity();
      if (selected) {
         self.set('uri', selected)
      }
   },

   _updateAxisAlignmentFlags: function() {
      var self = this;
      var flag = self.get('model.mob.axis_alignment_flags');
      if (flag & self.axis_alignment_flags['X']) {
         self.set('axis_aligned_x', true);
      } else {
         self.set('axis_aligned_x', false);
      }
      if (flag & self.axis_alignment_flags['Z']) {
         self.set('axis_aligned_z', true);
      } else {
         self.set('axis_aligned_z', false);
      }
   }.observes('model.mob.axis_alignment_flags'),

   _getUpdates: function() {
      var self = this;
      var updates = {};

      // MOB Updates
      var mobUpdates = {};
      var axisAlignedX = $('#axis_alignment_x').is(':checked') ? self.axis_alignment_flags['X'] : 0;
      var axisAlignedZ = $('#axis_alignment_z').is(':checked') ? self.axis_alignment_flags['Z'] : 0;
      var flags = axisAlignedX | axisAlignedZ;
      mobUpdates['axis_alignment_flags'] = flags;

      // Model Origin
      var modelOriginX = parseFloat($('#model_origin_x').val());
      var modelOriginY = parseFloat($('#model_origin_y').val());
      var modelOriginZ = parseFloat($('#model_origin_z').val());
      mobUpdates['model_origin_updates'] = {x:modelOriginX, y: modelOriginY, z:modelOriginZ};

      var regionOriginX = parseFloat($('#region_origin_x').val());
      var regionOriginY = parseFloat($('#region_origin_y').val());
      var regionOriginZ = parseFloat($('#region_origin_z').val());
      mobUpdates['region_origin_updates'] = {x:regionOriginX, y: regionOriginY, z:regionOriginZ};

      updates['mob'] = mobUpdates;

      return updates;
   },
   actions: {
      close: function () {
         this.destroy();
      },
      updateEntity: function () {
         var self = this;
         return radiant.call('debugtools:update_entity_command', self.get('uri'), self._getUpdates()); 
      }
   },

   destroy: function() {
      topElement.off("radiant_selection_changed.object_browser");
      this._super();
   },

});
