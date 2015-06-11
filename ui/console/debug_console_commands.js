$(document).ready(function(){
   var selected;

   $(top).on("radiant_selection_changed.unit_frame", function (_, data) {
      selected = data.selected_entity;
   });
   
   radiant.console.register('add_gold', {
      call: function(cmdobj, fn, args) {
         var goldAmount = JSON.parse(args[0]);
         return radiant.call_obj('stonehearth.inventory', 'add_gold_console_command', goldAmount);
      },
      description: "Adds gold to the current player's inventory. A negative value will subtract gold. Usage: add_gold 1000"
   });

   radiant.console.register('add_exp', {
      call: function(cmdobj, fn, args) {
         var xpAmount = parseInt(args[0]);
         if (selected && xpAmount && xpAmount > 0) {
            return radiant.call('debugtools:add_exp_command', selected, xpAmount);
         }
         return false;
      },
      description: "Adds experience points to the currently selected entity's job. Usage: add_exp 1000"
   });

   radiant.console.register('set_attr', {
      call: function(cmdobj, fn, args) {
         var attribute = args[0];
         var val = parseInt(args[1]);
         if (selected && attribute && val > 0) {
            return radiant.call('debugtools:set_attr_command', selected, attribute, val);
         }
         return false;
      },
      description: "Sets the attribute on the selected entity to the specified value. Usage: set_attr health 10"
   });

});
