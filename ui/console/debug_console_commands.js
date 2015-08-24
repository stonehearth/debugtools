$(document).ready(function(){
   var selected;

   $(top).on("radiant_selection_changed.unit_frame", function (_, data) {
      selected = data.selected_entity;
   });
   
   radiant.console.register('add_gold', {
      call: function(cmdobj, fn, args) {
         var goldAmount = JSON.parse(args[0]);
         return radiant.call('debugtools:add_gold_console_command', goldAmount);
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
         if (selected && attribute && val != NaN) {
            return radiant.call('debugtools:set_attr_command', selected, attribute, val);
         }
         return false;
      },
      description: "Sets the attribute on the selected entity to the specified value. Usage: set_attr health 10"
   });

   radiant.console.register('reset_location', {
      call: function(cmdobj, fn, args) {
         var x = parseInt(args[0]);
         var y = parseInt(args[1]);
         var z = parseInt(args[2]);
         if (selected) {
            return radiant.call('debugtools:reset_location_command', selected, x, y, z);
         }
         return false;
      },
      description: "Resets the entity's location to a proper one on the ground. Can also pass in a new location. Usage: reset_location {optional x y z}"
   });

   radiant.console.register('change_score', {
      call: function(cmdobj, fn, args) {
         var scoreName = args[0];
         var val = parseInt(args[1]);
         if (selected && scoreName) {
            return radiant.call('debugtools:change_score_command', selected, scoreName, val);
         }
         return false;
      },
      description: "Changes the specified score on the selected entity by the specified amount. Usage: change_score nutrition -10"
   });

   radiant.console.register('reset_scores', {
      call: function(cmdobj, fn, args) {
         if (selected) {
            return radiant.call('debugtools:reset_scores_command', selected);
         }
         return false;
      },
      description: "Resets all the scores on the selected entity to their starting values. Usage: reset_scores"
   });

   radiant.console.register('add_buff', {
      call: function(cmdobj, fn, args) {
         var buffUri = args[0];
         if (selected) {
            return radiant.call('debugtools:add_buff_command', selected, buffUri);
         }
         return false;
      },
      description: "Add the specified buff uri to the currently selected entity. Usage: add_buff stonehearth:buffs:starving"
   });

   radiant.console.register('promote_to', {
      call: function(cmdobj, fn, args) {
         var job = args[0];
         if (selected) {
            return radiant.call('debugtools:promote_to_command', selected, job);
         }
         return false;
      },
      description: "Instantly promote the selected hearthling to the specified job. Usage: promote_to footman"
   });

   radiant.console.register('add_citizen', {
      call: function(cmdobj, fn, args) {
         return radiant.call('debugtools:add_citizen_command');
      },
      description: "Add a new hearthling to your town. Usage: add_citizen"
   });

   radiant.console.register('dump_backpack', {
      call: function(cmdobj, fn, args) {
         if (selected) {
            return radiant.call('debugtools:dump_backpack_command', selected);
         }
      },
      description: "Instantly drops on to the ground all items in the selected hearthling's backpack. Usage: dump_backpack"
   });

   radiant.console.register('show_untranslated', {
      stringToBoolean: function(string) {
         switch(string.toLowerCase()){
            case "true": case "yes": case "1": return true;
            case "false": case "no": case "0": case null: return false;
            default: return Boolean(string);
         }
      },

      call: function(cmdobj, fn, args) {
         var shouldShow = args.length > 0 ? this.stringToBoolean(args[0]) : true;
         _debug_show_untranslated = shouldShow;
      },
      description: "Use to display untranslated strings with *** around them. Usage: show_untranslated true/false"
   });

   radiant.console.register('hot_reload', {
      call: function(cmdobj, fn, args) {
         radiant.call("radiant:debug_clear_rm_json_cache");
      },
      description: "Clears the json cache so that changed json files on the client will reload again. Usage: hot_reload"
   });

   radiant.console.register('add_journal', {
      call: function(cmdobj, fn, args) {
         var journalType = args[0];
         return radiant.call('debugtools:add_journal_command', selected, journalType);
      },
      description: "Force add a journal entry for the selected hearthling. usage: add_journal dreams"
   });

   radiant.console.register('reproduce', {
      call: function(cmdobj, fn, args) {
         var journalType = args[0];
         return radiant.call('debugtools:pasture_reproduce_command', selected);
      },
      description: "Select a pasture and force that pasture to reproduce an animal. usage: reproduce"
   });

   radiant.console.register('grow', {
      call: function(cmdobj, fn, args) {
         return radiant.call('debugtools:evolve_command', selected);
      },
      description: "Tells the selected entity to grow. Ex: Make a lamb grow into a sheep. usage: grow"
   });

   radiant.console.register('renew', {
      call: function(cmdobj, fn, args) {
         return radiant.call('debugtools:renew_resource_command', selected);
      },
      description: "Tells the selected entity to renew its resource. Ex: Make sheep grow wool again or depleeted silkweed grow. usage: renew"
   });

});
