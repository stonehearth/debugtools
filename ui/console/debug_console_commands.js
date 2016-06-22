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
         var goldAmount = 100;
         if (args[0]) {
            goldAmount = JSON.parse(args[0]);
         }
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
      description: "Adds experience points to the currently selected entity's job. If no exp amount is given, will level up to the next level. Usage: add_exp 1000",
      test: function(entity) {
         var job = entity.get('stonehearth:job');
         if (job && job.job_uri != "stonehearth:jobs:worker") {
            return true;
         }
         return false;
      },
      debugMenuNameOverride: "Level Up"
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

   radiant.console.register('set_game_speed', {
      call: function(cmdobj, fn, args) {
         var val = parseInt(args[0]);
         if (val != NaN) {
            return radiant.call('debugtools:set_game_speed_command', val);
         }
         return false;
      },
      description: "Sets the game speed to the default game speed multiplied by the specified amount. Usage: set_game_speed 5"
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
      description: "Resets all the scores on the selected entity to their starting values. Usage: reset_scores",
      test: function(entity) {
         if (entity.get('stonehearth:score')) {
            return true;
         }
         return false;
      },
      debugMenuNameOverride: "Reset Morale"
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
      description: "Instantly drops on to the ground all items in the selected hearthling's backpack. Usage: dump_backpack",
      test: function(entity) {
         if (entity.get('stonehearth:storage') && entity.get('stonehearth:job')) {
            return true;
         }
         return false;
      },
      debugMenuNameOverride: "Dump Backpack"
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
      description: "Select a pasture and force that pasture to reproduce an animal. Usage: reproduce",
      test: function(entity) {
         if (entity.get('stonehearth:shepherd_pasture')) {
            return true;
         }
         return false;
      }
   });

   radiant.console.register('grow', {
      call: function(cmdobj, fn, args) {
         if (!selected) {
            return "must select something";
         }
         return radiant.call('debugtools:grow_command', selected);
      },
      description: "Tells the selected entity to grow. Either farm crops or animals Ex: Make a lamb grow into a sheep. Usage: grow",
      test: function(entity) {
         if (entity.get('stonehearth:evolve') || entity.get('stonehearth:growing')) {
            return true;
         }
         return false;
      }
   });

   radiant.console.register('renew', {
      call: function(cmdobj, fn, args) {
         if (!selected) {
            return "must select something";
         }
         return radiant.call('debugtools:renew_resource_command', selected);
      },
      description: "Tells the selected entity to renew its resource. Ex: Make sheep grow wool again or depleeted silkweed grow. Usage: renew",
      test: function(entity) {
         if (entity.get('stonehearth:renewable_resource_node')) {
            return true;
         }
         return false;
      }
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
         if (entity && entity.get('uri.entity_data.stonehearth:food_decay')) {
            return true;
         }
         return false;
      }
   });

   radiant.console.register('get_entity_info', {
      call: function(cmdobj, fn, args) {
         if (!args[0]) {
            return "must provide an entity id";
         }
         var id = parseInt(args[0]);
         return radiant.call_obj('debugtools.entity_tracker', 'get_entity_info_command', id);
      },
      description: "Return info about an entity, even if the entity has been destroyed. Pass in id of the entity. Usage: get_entity_info 82215"
   });

   radiant.console.register('get_score', {
      call: function(cmdobj, fn, args) {
         if (!args[0]) {
            return "must provide the name of the score you wish to retrieve";
         }
         var score_type = args[0];
         return radiant.call('debugtools:get_score_command', score_type);
      },
      description: "Get the town's score for specified score type. Usage: get_score military_strength"
   });

   radiant.console.register('make_hungry', {
      call: function(cmdobj, fn, args) {
         if (!selected) {
            return "must select something";
         }
         var attribute = 'calories';
         var val = 0;
         return radiant.call('debugtools:set_attr_command', selected, attribute, val);
      },
      description: "Makes the selected entity hungry if the entity has the calories attribute. The entity will try to eat if it has a calorie observer. Usage: make_hungry",
      test: function(entity) {
         var attributes = entity.get('stonehearth:attributes');
         if (attributes && attributes.attributes && attributes.attributes.calories) {
            return true;
         }
         return false;
      },
      debugMenuNameOverride: "Make Hungry"
   });

   radiant.console.register('make_full', {
      call: function(cmdobj, fn, args) {
         var attribute = 'calories';
         var val = 100;
         if (!selected) {
            return radiant.call('debugtools:set_attr_to_all_citizens_command', attribute, val);
         }
         return radiant.call('debugtools:set_attr_command', selected, attribute, val);
      },
      description: "Makes the selected entity full if the entity has the calories attribute. If no entity selected, sets attribute to every citizen in your town. Usage: make_full",
      test: function(entity) {
         var attributes = entity.get('stonehearth:attributes');
         if (attributes && attributes.attributes && attributes.attributes.calories) {
            return true;
         }
         return false;
      },
      debugMenuNameOverride: "Make Full"
   });

   radiant.console.register('make_sleepy', {
      call: function(cmdobj, fn, args) {
         if (!selected) {
            return "must select something";
         }
         var attribute = 'sleepiness';
         var val = 25;
         return radiant.call('debugtools:set_attr_command', selected, attribute, val);
      },
      description: "Makes the selected entity exhaustedly sleepy if the entity has the sleepiness attribute. The entity will try to sleep if it has a sleepiness observer. Usage: make_sleepy",
      test: function(entity) {
         var attributes = entity.get('stonehearth:attributes');
         if (attributes && attributes.attributes && attributes.attributes.sleepiness) {
            return true;
         }
         return false;
      },
      debugMenuNameOverride: "Make Sleepy"
   });

   radiant.console.register('hotload_mod', {
      call: function(cmdobj, fn, args) {
         var modName = args[0];
         if (!modName) {
            modName = "rayyas_children_ui";
         }

         return radiant.call('radiant:send_hotload_module_event', modName)
      },
      description: "hot load a mod",
   });

   radiant.console.register('load_entity_tracker', {
      call: function(cmdobj, fn, args) {
         return radiant.call_obj('debugtools.entity_tracker', 'load_entities_command');
      },
      description: "Tells the debugtools entity tracker to load up all the entities. you can then inspect them in the object browser after typing 'debugtools'"
   });

   radiant.console.register('make_hostile', {
      call: function(cmdobj, fn, args) {
         if (!selected) {
            return "must select something";
         }
         var amenity = 'hostile';
         return radiant.call_obj('stonehearth.player', 'debug_set_amenity_command', selected, amenity);
      },
      description: "Makes the player hostile with the selected entity's faction",
      debugMenuNameOverride: "Make Hostile",
      test: function(entity) {
         var player_id = entity.get('unit_info.player_id');
         if (player_id && player_id != "player_1") {
            return true;
         }
         return false;
      },
   });

   radiant.console.register('make_neutral', {
      call: function(cmdobj, fn, args) {
         if (!selected) {
            return "must select something";
         }
         var amenity = 'neutral';
         return radiant.call_obj('stonehearth.player', 'debug_set_amenity_command', selected, amenity);
      },
      description: "Makes the player hostile with the selected entity's faction",
      debugMenuNameOverride: "Make Neutral",
      test: function(entity) {
         var player_id = entity.get('unit_info.player_id');
         if (player_id && player_id != "player_1") {
            return true;
         }
         return false;
      },
   });

   radiant.console.register('make_friendly', {
      call: function(cmdobj, fn, args) {
         if (!selected) {
            return "must select something";
         }
         var amenity = 'friendly';
         return radiant.call_obj('stonehearth.player', 'debug_set_amenity_command', selected, amenity);
      },
      description: "Makes the player hostile with the selected entity's faction",
      debugMenuNameOverride: "Make Friendly",
      test: function(entity) {
         var player_id = entity.get('unit_info.player_id');
         if (player_id && player_id != "player_1") {
            return true;
         }
         return false;
      },
   });

   radiant.console.register('destroy_immediately', {
      call: function(cmdobjs, fn, args) {
         var entity;
         if (args.length > 0) {
            entity = 'object://game/' + args[0];
         } else {
            entity = selected;
         }
         return radiant.call('stonehearth:destroy_entity', entity);
      },
      description : "Destroy an entity immediately. Might not run other code that normally runs when someone is killed, like drop loot, etc. Arg 0 is id of the entity. If no argument is provided, destroys the currently selected entity. Usage: destroy_immediately 12345",
      test: function(entity) {
         if (entity) {
            return true;
         }
         return false;
      }
   });

   radiant.console.register('destroy_npc_stockpiles', {
      call: function(cmdobjs, fn, args) {
         return radiant.call('debugtools:destroy_npc_stockpiles', args[0])
      },
      description : "Destroys stockpiles of the npc player (Arg 0). If no argument is provided, destroys stockpiles of all npcs. Usage: destroy_npc_stockpiles goblins"
   });

   radiant.console.register('release', {
      call: function(cmdobjs, fn, args) {
         var entity;
         if (args.length > 0) {
            entity = 'object://game/' + args[0];
         } else {
            entity = selected;
         }
         return radiant.call('debugtools:call_component_function_command', entity, 'stonehearth:bait_trap', 'release');
      },
      description : "releases the pet in a bait trap",
      test: function(entity) {
         if (entity && entity.get('stonehearth:bait_trap')) {
            return true;
         }
         return false;
      }
   });

   radiant.console.register('get_global_vision', {
      call: function(cmdobjs, fn, args) {
         return radiant.call_obj('stonehearth.population', 'get_global_vision_command');
      },
      description : "Returns list of all objects in global vision of the caller's population"
   });

   radiant.console.register('ai_reconsider', {
      call: function(cmdobjs, fn, args) {
         if (!selected) {
            return "must select something";
         }
         return radiant.call('debugtools:ai_reconsider_entity_command', selected);
      },
      description : "Calls reconsider on the selected entity",
      test: function(entity) {
         return true;
      }
   });

   radiant.console.register('fill_storage', {
      call: function(cmdobjs, fn, args) {
         if (!selected) {
            return "must select something";
         }
         var uri = 'stonehearth:resources:wood:oak_log';
         if (args.length > 0) {
            uri = args[0];
         }
         return radiant.call('debugtools:fill_storage_command', selected, uri);
      },
      description : "Fills the selected storage with the specified uri. If no uri specified, defaults to oak logs. Usage: fill_storage stonehearth:resources:wood:oak_log",
      test: function(entity) {
         if (entity && entity.get('stonehearth:storage') && !entity.get('stonehearth:stockpile')) {
            return true;
         }
         return false;
      }
   });

   radiant.console.register('now', {
      call: function(cmdobjs, fn, args) {
         return radiant.call('debugtools:get_gamestate_now_command');
      },
      description : "Returns radiant.gamestate.now()",
   });

   radiant.console.register('spawn_encounter', {
      call: function(cmdobjs, fn, args) {
         for (var i=0; i<args.length; i++) {
            var result = args[i].trim();
            result = result.length === 0 ? null : result;
            args[i] = result;
         }
         var campaign = args[0];
         var name = args[1];
         var arc = args[2];
         if (!(campaign && name)) {
            return false;
         }
         return radiant.call('debugtools:spawn_encounter_command', campaign, name, arc);
      },
      description : "Spawns the encounter specified. WARNING: Only for testing purposes, may cause lasting issues if game is saved after using cmd. Arguments should be: campaign, encounter, arc. Usage: spawn_encounter ambient_threats create_necromancer_crypt trigger",
   });

   radiant.console.register('increase_city_tier', {
      call: function(cmdobjs, fn, args) {
         return radiant.call_obj('stonehearth.population', 'debug_increase_city_tier');
      },
      description : "Increases the city tier of the settlement by 1",
      test: function(entity) {
         if (entity.uri && entity.uri.__self && entity.uri.__self.indexOf('camp_standard') >= 0) {
            return true;
         }
         return false;
      }
   });

   radiant.console.register('fixup_components', {
      call: function(cmdobjs, fn, args) {
         return radiant.call('debugtools:fixup_components_command', selected);
      },
      description : "If there are any components missing on this entity, we will attempt to add them",
      test: function(entity) {
         return true;
      }
   });

   radiant.console.register('select_storage', {
      call: function(cmdobjs, fn, args) {
         return radiant.call('debugtools:select_storage_command', selected)
                  .done(function(response) {
                     if (response.container) {
                        radiant.call('stonehearth:select_entity', response.container);
                     }
                  });
      },
      description : "Select's the storage that contains the entity, if it has one."
   });
});
