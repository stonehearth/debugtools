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

   adjacency_flags: {
      'FRONT' : 1 << 0,
      'LEFT' : 1 << 2,
      'BACK' : 1 << 3,
      'RIGHT' : 1 << 4,
      'FRONT_LEFT' : 1 << 5,
      'FRONT_RIGHT' : 1 << 6,
      'BACK_LEFT' : 1 << 7,
      'BACK_RIGHT' : 1 << 8,
   },

   default_region: {
      min: {
         x: 0, y: 0, z: 0
      },
      max: {
         x: 1, y: 1, z: 1
      }
   },

   rotation: 0,

   didInsertElement: function() {
      var self = this;
            // for some reason $(top) here isn't [ Window ] like everywhere else.  Why?  Dunno.
      // So annoying!  Use the cached value of $(top) we got in 'stonehearthReady'
      topElement.on("radiant_selection_changed.object_browser", function (_, data) {
         var uri = data.selected_entity;
         if (uri) {
            self.set('uri', uri);
         }
      });

      var selected = App.stonehearthClient.getSelectedEntity();
      if (selected) {
         self.set('uri', selected);
      }

      $('h3').tooltipster();
      $('.has_tooltip').tooltipster();
      $('.button').tooltipster();
      
      self.$().draggable();
      self._jsonView = null;

      self.$("#auto_update_adjacent_checkbox").click(function() {
         self.updateEntityImmediately();
      })

      self.$("#adjacencyAutoUpdate").on('click', ":checkbox", function() {
         self.updateEntityImmediately();
      });
   },

   _updateRendererDebug: function() {
      var uri = this.get("uri");
      if (uri) {
         radiant.call("radiant:show_debug_shapes_for_entity", uri);
         App.setGameMode('build');
      }
   }.observes("uri"),

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

   _updateAdjacencyAutoUpdate: function() {
      var self = this;
      var isAutoUpdate = self.get('model.destination.auto_update_adjacent');
      if (isAutoUpdate) {
         $("#adjacencyAutoUpdate").show();
         $("#adjacentManualSpecify").hide();
      } else {
         $("#adjacencyAutoUpdate").hide();
         $("#adjacentManualSpecify").show();
      }
   }.observes('model.destination.auto_update_adjacent'),

   _updateAdjacencyFlags: function() {
      var self = this;
      var flag = self.get('model.destination.adjacency_flags');
      radiant.each(self.adjacency_flags, function(flag_name, flag_value) {
         self.set('adjacency_' + flag_name.toLowerCase(), (flag & flag_value) ? true : false);
      });

      $(".checkbox_adjacency").tooltipster();
   }.observes('model.destination.adjacency_flags'),

   _showHideDestination: function() {
      if (this.get('model.destination')) {
         $('#destination').show();
      } else {
         $('#destination').hide();
      }
   }.observes('model.destination'),

   _showHideCollision: function() {
      if (this.get('model.region_collision_shape')) {
         $('#collision').show();
      } else {
         $('#collision').hide();
      }
   }.observes('model.region_collision_shape'),

   _updateJsonView: function(description, stringJson) {
      if (!self._jsonView || self._jsonView.isDestroyed || self._jsonView.isDestroying) {
         self._jsonView = App.debugView.addView(App.DebugToolsEntityEditorJsonView, {description: description, json: stringJson});
      } else {
         self._jsonView.set('description', description);
         self._jsonView.set('json', stringJson);
      }
   },

   _getAdjacencyFlags: function() {
      var self = this;
      var flag = 0;
      radiant.each(self.adjacency_flags, function(flag_name, flag_value) {
         var set = $('#checkbox_adjacency_' + flag_name.toLowerCase()).is(':checked');
         if (set) {
            flag = flag | flag_value;
         }
      });

      return flag;
   },

   _getAdjacencyFlagsArray: function() {
      var self = this;
      var flags = [];
      radiant.each(self.adjacency_flags, function(flag_name, flag_value) {
         var lowerCase = flag_name.toLowerCase()
         var set = $('#checkbox_adjacency_' + lowerCase).is(':checked');
         if (set) {
            flags.push(lowerCase);
         }
      });

      return flags;
   },

   _getXYZ: function( prefix) {
      var x = parseFloat($(prefix + '_x').val());
      var y = parseFloat($(prefix + '_y').val());
      var z = parseFloat($(prefix + '_z').val());
      return {x:x, y: y, z:z};
   },

   _getRegions: function(regionName) {
      var regionViews = this.get('childViews');
      var allRegions = [];
      radiant.each(regionViews, function(name, regionView) {
         if (regionView.get("regionClass") == regionName) {
            var min = regionView.getRegionMin();
            var max = regionView.getRegionMax();
            if (min && max) {
               allRegions.push({min: min, max: max});
            }
         }
      })
      return allRegions;
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

      if (self.get('model.destination')) {
         var destinationUpdates = {};
         if (self.get('model.destination.region')) {
            destinationUpdates['region_updates'] = self._getRegions('destinationRegion');
         }
         if ($('#auto_update_adjacent_checkbox').is(':checked')) {
            destinationUpdates['adjacency_flags'] = self._getAdjacencyFlags();
         } else {
            destinationUpdates['adjacency_region_updates'] = self._getRegions('adjacencyRegion');
         }
         updates['destination'] = destinationUpdates;
      }

      if (self.get('model.region_collision_shape')) {
         var collisionUpdates = {};
         if (self.get('model.region_collision_shape.region')) {
            collisionUpdates['region_updates'] = self._getRegions('collisionRegion');
         }
         updates['region_collision_shape'] = collisionUpdates;
      }

      return updates;
   },

   updateEntityImmediately: function() {
      radiant.call('debugtools:update_entity_command', this.get('uri'), this._getUpdates()); 
   },

   actions: {
      close: function () {
         this.destroy();
      },
      updateEntity: function () {
         this.updateEntityImmediately();
      },
      addDestinationRegion: function () {
         var self = this;
         var updates = {};
         var destinationUpdates = {};
         var regions = self._getRegions('destinationRegion');
         var existing_region = regions[regions.length - 1];
         if (!existing_region) {
            existing_region = self.default_region;
         }
         var newMin = {x:existing_region.max.x, y:0, z: existing_region.max.z};
         var newMax = {x:existing_region.max.x + 1, y:1, z: existing_region.max.z + 1};
         regions.push({min: newMin, max: newMax});
         destinationUpdates['region_updates'] = regions;
         updates['destination'] = destinationUpdates;
         radiant.call('debugtools:update_entity_command', self.get('uri'), updates); 
      },
      addCollisionRegion: function () {
         var self = this;
         var updates = {};
         var collisionUpdates = {};
         var regions = self._getRegions('collisionRegion');
         var existing_region = regions[regions.length - 1];
         if (!existing_region) {
            existing_region = self.default_region;
         }
         var newMin = {x:existing_region.max.x, y:0, z: existing_region.max.z};
         var newMax = {x:existing_region.max.x + 1, y:1, z: existing_region.max.z + 1};
         regions.push({min: newMin, max: newMax});
         collisionUpdates['region_updates'] = regions;
         updates['region_collision_shape'] = collisionUpdates;
         radiant.call('debugtools:update_entity_command', self.get('uri'), updates); 
      },
      addAdjacencyRegion: function() {
         var self = this;
         var updates = {};
         var destinationUpdates = {};
         var regions = self._getRegions('adjacencyRegion');
         var existing_region = regions[regions.length - 1];
         if (!existing_region) {
            existing_region = self.default_region;
         }
         var newMin = {x:existing_region.max.x, y:0, z: existing_region.max.z};
         var newMax = {x:existing_region.max.x + 1, y:1, z: existing_region.max.z + 1};
         regions.push({min: newMin, max: newMax});
         destinationUpdates['adjacency_region_updates'] = regions;
         updates['destination'] = destinationUpdates;
         radiant.call('debugtools:update_entity_command', self.get('uri'), updates); 
      },
      showMobJson: function() {
         var self = this;
         var description = i18n.t("debugtools:entity_editor.mob.json_description");

         var mobJson = {};
         var mob = {};
         var align_to_grid = [];
         
         var axisAlignedX = $('#axis_alignment_x').is(':checked');
         var axisAlignedZ = $('#axis_alignment_z').is(':checked');
         if (axisAlignedX) {
            align_to_grid.push("x");
         }
         if (axisAlignedZ) {
            align_to_grid.push("z");
         }
         if (align_to_grid.length > 0) {
            mob["align_to_grid"] = align_to_grid;
         }

         var modelOrigin = self._getXYZ('#model_origin');
         var regionOrigin = self._getXYZ('#region_origin');
         mob["model_origin"] = modelOrigin;
         mob["region_origin"] = regionOrigin;

         mobJson["mob"] = mob;

         var stringJson = JSON.stringify(mobJson, null, 3);
         stringJson = stringJson.substring(2).substring(0, stringJson.length - 4); // remove the opening and closing brackets
         var description = i18n.t("debugtools:entity_editor.mob.json_description");
         self._updateJsonView(description, stringJson);
      },
      showDestinationJson: function() {
         var self = this;
         var overallJson = {};
         if (self.get('model.destination')) {
            var destinationComponent = {};
            if (self.get('model.destination.region')) {
               var regions = self._getRegions('destinationRegion');
               if (regions.length > 0) {
                  destinationComponent['region'] = regions;
               }
            }
            if ($('#auto_update_adjacent_checkbox').is(':checked')) {
               var adjacencyFlags = self._getAdjacencyFlags();
               var defaultFlags = self.adjacency_flags.FRONT | self.adjacency_flags.BACK | self.adjacency_flags.LEFT | self.adjacency_flags.RIGHT;
               if (adjacencyFlags != defaultFlags) {
                  destinationComponent['adjacency_flags'] = self._getAdjacencyFlagsArray();
               }
            } else {
               destinationComponent['adjacent'] = self._getRegions('adjacencyRegion');
            }

            overallJson['destination'] = destinationComponent;
         }

         if (self.get('model.region_collision_shape')) {
            var collisionRegions = {};
            if (self.get('model.region_collision_shape.region')) {
               var regions = self._getRegions('collisionRegion');
               if (regions.length > 0) {
                  collisionRegions['region'] = regions;
               }
            }
            overallJson['region_collision_shape'] = collisionRegions;
         }

         var stringJson = JSON.stringify(overallJson, null, 3);
         stringJson = stringJson.substring(2).substring(0, stringJson.length - 4); // remove the opening and closing brackets
         var description = i18n.t("debugtools:entity_editor.destination.json_description");
         self._updateJsonView(description, stringJson);
      },
      rotateEntity: function() {
         var self = this;
         self.rotation = self.rotation + 90;
         if (self.rotation >= 360) {
            self.rotation = self.rotation - 360;
         }
         radiant.call('debugtools:rotate_entity_command', self.get('uri'), self.rotation);
      }
   },

   destroy: function() {
      topElement.off("radiant_selection_changed.object_browser");
      radiant.call("radiant:show_debug_shapes_for_entity", '');
      this._super();
   },

});

App.DebugToolsRegionItemView = App.View.extend({
   classNames: ['regionItem'],
   templateName: 'regionEditor',

   didInsertElement: function() {
      var self = this;
      $('.has_tooltip').tooltipster();
      self._deleted = false;
   },

   _getXYZ: function(prefix) {
      var x = parseFloat(this.$(prefix + '_x').val());
      var y = parseFloat(this.$(prefix + '_y').val());
      var z = parseFloat(this.$(prefix + '_z').val());
      return {x:x, y: y, z:z};
   },

   getRegionMin: function() {
      if (this._deleted) {
         return null;
      }
      return this._getXYZ('#region_min');
   },

   getRegionMax: function() {
      if (this._deleted) {
         return null;
      }
      return this._getXYZ('#region_max');
   },
   
   _canIncrement: function(first, second) {
      var existingValue = this.get(first);
      existingValue = existingValue + 1;
      var testValue = this.get(second);
      if (existingValue >= testValue) {
         return "disabled";
      }
      return "enabled";
   },

   _canDecrement: function(first, second) {
      var existingValue = this.get(first);
      existingValue = existingValue - 1;
      var testValue = this.get(second);
      if (existingValue <= testValue) {
         return "disabled";
      }
      return "enabled";
   },

   can_increment_min_x: function() {
      return this._canIncrement("shape.min.x", "shape.max.x");
   }.property("shape.min.x", "shape.max.x"),

   can_increment_min_y: function() {
      return this._canIncrement("shape.min.y", "shape.max.y");
   }.property("shape.min.y", "shape.max.y"),

   can_increment_min_z: function() {
      return this._canIncrement("shape.min.z", "shape.max.z");
   }.property("shape.min.z", "shape.max.z"),

   can_decrement_max_x: function() {
      return this._canDecrement("shape.max.x", "shape.min.x");
   }.property("shape.max.x", "shape.min.x"),

   can_decrement_max_y: function() {
      return this._canDecrement("shape.max.y", "shape.min.y");
   }.property("shape.max.y", "shape.min.y"),

   can_decrement_max_z: function() {
      return this._canDecrement("shape.max.z", "shape.min.z");
   }.property("shape.max.z", "shape.min.z"),

   actions: {
      deleteRegion: function (e) {
         var self = this;
         self._deleted = true;
         self.$().hide();
      },
      decrement: function (id) {
         id = "#" + id;
         var existingValue = parseFloat(this.$(id).val());
         existingValue = existingValue - 1;
         if (id.indexOf("max") >= 0) {
            // check to see if this would put us <= min
            var min_id = id.replace("max", "min");
            var minValue = parseFloat(this.$(min_id).val());
            if (existingValue <= minValue) {
               return;
            }
         }
         this.$(id).val(existingValue);
         this.entityEditor.updateEntityImmediately();
      },
      increment: function (id) {
         id = "#" + id;
         var existingValue = parseFloat(this.$(id).val());
         existingValue = existingValue + 1;
         if (id.indexOf("min") >= 0) {
            // check to see if this would put us >= max
            var max_id = id.replace("min", "max");
            var maxValue = parseFloat(this.$(max_id).val());
            if (existingValue >= maxValue) {
               return;
            }
         }
         this.$(id).val(existingValue);
         this.entityEditor.updateEntityImmediately();
      }
   }
});

App.DebugToolsEntityEditorJsonView = App.View.extend({
   classNames: ['entityJson'],
   templateName: 'entityEditorJson',
   json: "{}",
   didInsertElement: function() {
      var self = this;
      self.$().draggable();
      self.$('#jsonTextArea').val(self.json);
      self.$('#jsonTextArea').focus(function(e) {
         radiant.call('stonehearth:enable_camera_movement', false)
      }).blur(function (e) {
         radiant.call('stonehearth:enable_camera_movement', true)
      })

      self.$('#copyButton').click(function() {
         self.$('#jsonTextArea')[0].select();
         document.execCommand('copy');
         window.getSelection().removeAllRanges();
      });
   },

   _updateJson: function() {
      var self = this;
      var textArea = self.$('#jsonTextArea');
      if (textArea) {
         textArea.val(self.json);
      }
   }.observes('json'),

   actions: {
      close: function () {
         this.destroy();
      }
   }
});