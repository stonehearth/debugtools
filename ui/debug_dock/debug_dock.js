$(document).on('stonehearthReady', function(){
   App.debugDock = App.debugView.addView(App.StonehearthDebugDockView);
});

App.StonehearthDebugDockView = App.ContainerView.extend({
   classNames: ['debugDock'],
   
   init: function() {
      this._super();
      var self = this;
   },

   addToDock: function(ctor) {
      this.addView(ctor)
   }

});
