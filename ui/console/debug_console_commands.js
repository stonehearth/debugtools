$(document).ready(function(){
   var selected;
   var shiftHeld = false;
   var objectBrowserView = null;
   var mouseClickPosX = null;
   var mouseClickPosY = null;

   var showDebugMenu = function() {
      // Display debug commands available for the selected object
      if (objectBrowserView && !objectBrowserView.isDestroying && !objectBrowserView.isDestroyed) {
         objectBrowserView.destroy();
         objectBrowserView = null;
      }

      if (!objectBrowserView || objectBrowserView.isDestroying || objectBrowserView.isDestroyed) {
         objectBrowserView = App.debugView.addView(App.stonehearthObjectBrowserDebugCommandsView, { uri: selected, posX: mouseClickPosX, posY: mouseClickPosY });
      }
   }

   $(top).on("radiant_selection_changed.unit_frame", function (_, data) {
      selected = data.selected_entity;

      if (!selected) {
         if (objectBrowserView && !objectBrowserView.isDestroying && !objectBrowserView.isDestroyed) {
            objectBrowserView.destroy();
            objectBrowserView = null;
         }
      } else if (shiftHeld && selected) {
         showDebugMenu();
      }
   });

   $(document).click(function(e) {
      if (e.shiftKey) {
         shiftHeld = true;
         mouseClickPosX = e.screenX;
         mouseClickPosY = e.screenY;
         if (selected) {
            showDebugMenu();
         }
      } else {
         shiftHeld = false;
      }
   });

   $(top).on('mode_changed', function(_, mode) {
      if (mode != 'zones') {
         if (self._propertyView) {
            self._propertyView.destroyWithoutDeselect();
         }
      }
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
         if (selected) {
            return radiant.call('debugtools:add_exp_command', selected, xpAmount);
         }
         return false;
      },
      description: "Adds experience points to the currently selected entity's job. If no exp amount is given, will level up to the next level. Usage: add_exp 1000"
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

   radiant.console.register('set', {
      call: function(cmdobj, fn, args) {
         var attribute = args[0];
         var val = parseInt(args[1]);
         if (selected && attribute && val != NaN) {
            return radiant.call('debugtools:set_attr_command', selected, attribute, val);
         }
         return false;
      },
      description: "Sets the attribute on the selected entity to the specified value. Usage: set health 10"
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
            if (buffUri.indexOf(':') < 0) {
               buffUri = "stonehearth:buffs:" + buffUri;
            }
            return radiant.call('debugtools:add_buff_command', selected, buffUri);
         }
         return false;
      },
      description: "Add the specified buff uri to the currently selected entity. Usage: add_buff stonehearth:buffs:starving"
   });

   radiant.console.register('remove_buff', {
      call: function(cmdobj, fn, args) {
         var buffUri = args[0];
         if (selected) {
            if (buffUri.indexOf(':') < 0) {
               buffUri = "stonehearth:buffs:" + buffUri;
            }
            return radiant.call('debugtools:remove_buff_command', selected, buffUri);
         }
         return false;
      },
      description: "Remove the specified buff uri from the currently selected entity. Usage: remove_buff stonehearth:buffs:starving"
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
         radiant.call("debugtools:hot_reload_server");
         radiant.call("debugtools:hot_reload_client");
         radiant.call("radiant:debug_clear_rm_json_cache");
      },
      description: "Clears the json cache so that changed json files on the client will reload again. Usage: hot_reload"
   });

   radiant.console.register('add_journal', {
      call: function(cmdobj, fn, args) {
         if (!selected) {
            return "must select something";
         }

         var journalType = args[0];
         return radiant.call('debugtools:add_journal_command', selected, journalType);
      },
      description: "Force add a journal entry for the selected hearthling. Usage: add_journal dreams"
   });

   radiant.console.register('reproduce', {
      call: function(cmdobj, fn, args) {
         if (!selected) {
            return "must select something";
         }
         return radiant.call('debugtools:pasture_reproduce_command', selected);
      },
      description: "Select a pasture and force that pasture to reproduce an animal. Usage: reproduce"
   });

   radiant.console.register('grow', {
      call: function(cmdobj, fn, args) {
         if (!selected) {
            return "must select something";
         }
         return radiant.call('debugtools:grow_command', selected);
      },
      description: "Tells the selected entity to grow. Either farm crops or animals Ex: Make a lamb grow into a sheep. Usage: grow"
   });

   radiant.console.register('renew', {
      call: function(cmdobj, fn, args) {
         if (!selected) {
            return "must select something";
         }
         return radiant.call('debugtools:renew_resource_command', selected);
      },
      description: "Tells the selected entity to renew its resource. Ex: Make sheep grow wool again or depleeted silkweed grow. Usage: renew"
   });

   radiant.console.register('show_item_ids', {
      call: function(cmdobj, fn, args) {
         debug_itemPaletteShowItemIds = !debug_itemPaletteShowItemIds;
      },
      description: "Makes it so item palettes will show a list of all the item ids in its list of items. Usage: show_item_ids"
   });

   radiant.console.register('decay', {
      call: function(cmdobj, fn, args) {
         if (!selected) {
            return "must select something";
         }
         return radiant.call('debugtools:decay_command', selected);
      },
      description: "Make a food decay immediately. Usage: decay",
      test: function(entity) {
         if (entity && entity.get('uri.entity_data.stonehearth:food_container.decay')) {
            return true;
         }
         return false;
      }
   });
});
