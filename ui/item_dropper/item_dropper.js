$(document).on('stonehearthReady', function(){
   App.debugDock.addToDock(App.StonehearthItemDropperIcon);
   radiant.call('debugtools:get_all_item_uris_command')
      .done(function(response) {
         allUris = response;
      })
      .fail(function() {
      });
});

var itemDropperInitialValue = "stonehearth:resources:wood:oak_log";
var allUris = {};

App.StonehearthItemDropperIcon = App.View.extend({
   templateName: 'itemDropperIcon',
   classNames: ['debugDockIcon'],

   didInsertElement: function() {
      $('#itemDropperIcon').tooltipster();
      this.$().click(function() {
         App.debugView.addView(App.StonehearthItemDropperView);
      })
   }
});

App.StonehearthItemDropperView = App.View.extend({
   templateName: 'itemDropper',

   init: function() {
      var self = this;
      this._super();
   },

   didInsertElement: function() {
      var self = this;

      this._super();

      this.$().draggable();

      this.$('#uriInput')
         .attr("value", itemDropperInitialValue)
         .autocomplete({source: allUris})
         .focus();

      var doPlaceEntity = function(uri, iconic) {
         radiant.call('debugtools:create_and_place_entity', uri, iconic)
            .done(function() {
               doPlaceEntity(uri, iconic)
            })
            .fail(function() {
               
            });
      };

      this.$('#uriInput').focus(function(e) {       
         $(this).val('');
      });

      this.$('#uriInput').keypress(function(e) {
         if (e.which == 13) { // return
            var uri = self.$('#uriInput').val();
            itemDropperInitialValue = uri;
            var iconic = self.$('#iconicCheckbox').is(':checked');
            doPlaceEntity(uri, iconic);
         }
      });

      this.$('#makeButton').click(function() {
         var uri = self.$('#uriInput').val();
         itemDropperInitialValue = uri;
         var iconic = self.$('#iconicCheckbox').is(':checked');
         doPlaceEntity(uri, iconic);
      });

      this.$('.close').click(function() {
         self.destroy();
      });

      this.$('#itemDropper').position({
         my: 'right-150 top+150',
         at: 'right top',
         of: $(top)
      });

   },

});
