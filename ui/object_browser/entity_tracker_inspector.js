
App.StonehearthEntityTrackerInspectorView = App.View.extend({
   templateName: 'entityTrackerInspector',
   uriProperty: 'model',
   closeOnEsc: true,
   
   init: function() {
      var self = this;
      radiant.call_obj('debugtools.entity_tracker', 'load_entities_command')
         .done(function(response) {
               self.set('uri', response.tracker);
               self.set('num_entities', response.num_entities)
            });
      self._super();
   },

   didInsertElement: function() {
      // look at entities
      this.$('#body').on("click", ".navlink", function(event) {
         var uri = $(this).attr('href');
         var existingDebugView = App.debugView.getView(App.StonehearthObjectBrowserView);
         App.debugView.addView(App.StonehearthObjectBrowserView, { uri: uri });
      });
   },

   all_entities: function() {
      var self = this;
      var entities_dictionary = self.get('model.entities');
      var entities_array = [];
      var index = 0;
      radiant.each(entities_dictionary, function(k, v) {
         var uri = k;
         if (uri == "") {
            uri = "[no uri]"
         }
         entities_array[index] = {
            count : v.count,
            uri : uri,
            data : v.data
         };
         index++;
      });

      entities_array.sort(function(a, b){
         return b.count - a.count;
      });
      return entities_array;
   }.property('model.entities'),

   out_of_bounds_entities: function() {
      var self = this;
      var entities_array = radiant.map_to_array(self.get('model.out_of_bounds_entities'));
      return entities_array;
   }.property('model.out_of_bounds_entities'),

   actions: {
      close: function () {
         this.destroy();
      },
   }
});