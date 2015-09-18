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

   _getXYZ: function(prefix) {
      var x = parseFloat($(prefix + '_x').val());
      var y = parseFloat($(prefix + '_y').val());
      var z = parseFloat($(prefix + '_z').val());
      return {x:x, y: y, z:z};
   },

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
      mobUpdates['model_origin_updates'] = self._getXYZ('#model_origin');
      mobUpdates['region_origin_updates'] = self._getXYZ('#region_origin');
      updates['mob'] = mobUpdates;

      var destinationUpdates = {};
      if (self.get('model.destination.region')) {
         var min = self._getXYZ('#destination_region_min');
         var max = self._getXYZ('#destination_region_max');
         destinationUpdates['region_updates'] = {min: min, max: max};
      }
      updates['destination'] = destinationUpdates;

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
