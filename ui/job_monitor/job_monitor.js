var topElement;
$(document).on('stonehearthReady', function(){
   topElement = $(top);
   App.debugDock.addToDock(App.StonehearthJobMonitorIcon);
});

App.StonehearthJobMonitorIcon = App.View.extend({
   templateName: 'jobMonitorIcon',
   classNames: ['debugDockIcon'],

   didInsertElement: function() {
      $('#jobMonitorIcon').tooltipster();
      this.$().click(function() {
         App.debugView.addView(App.StonehearthJobMonitorView);
      })
   }

});

var X_ORIGIN = 10;
var Y_ORIGIN = 20;

var LARGE_LED_SIZE = 5;
var LARGE_LED_Y_OFFSET = -6;
var LARGE_FONT = '10px consolasregular';
var LARGE_FONT_LINE_SPACING = 9;
var LARGE_TEXT_LEFT_MARGIN = 4;

var SMALL_LED_SIZE = 3;
var SMALL_LED_Y_OFFSET = -5;
var SMALL_FONT = '10px consolasregular';
var SMALL_FONT_LINE_SPACING = 10;
var SMALL_TEXT_LEFT_MARGIN = 4;

var BFS_PATHFINDER_PROGRESS_BAR_LEFT = 350;
var BFS_PATHFINDER_PROGRESS_BAR_RIGHT = 450;
var BFS_PROGRESS_BAR_COLOR = 'rgb(0, 0, 255)';
var BFS_PROGRESS_BAR_BACKGROUND_COLOR = 'rgb(64, 64, 64)';
var ASTAR_PROGRESS_BAR_COLOR = 'rgb(255, 215, 0)';

var DEFAULT_TEXT_COLOR = 'rgb(255, 255, 255)';
var INACTIVE_TEXT_COLOR = 'rgb(128, 128, 128)';
var EJS_INDENT_FOR_PATHFINDERS = 24;
var EJS_INDENT_FOR_ACTIVITY = EJS_INDENT_FOR_PATHFINDERS + BFS_PATHFINDER_PROGRESS_BAR_LEFT;
var EJS_Y_MARGIN = 12;
var EJS_ACTIVITY_COLOR = '#93ef26';

App.StonehearthJobMonitorView = App.View.extend({
   templateName: 'jobMonitor',
   uriProperty: 'model',

   _createCanvas: function() {      
      this._canvas = document.getElementById('jobMonitorCanvas');
      this._canvas.width = 500;
      this._canvas.height = this._canvas.parentNode.clientHeight - 20; // xxx:fudge

      this._ctx = this._canvas.getContext('2d');
      this._ctx.font = LARGE_FONT;
      this._ctx.fillStyle = DEFAULT_TEXT_COLOR;
      this._ctx.strokeStyle = DEFAULT_TEXT_COLOR;
   },

   _clear: function() {
      this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
   },

   _addText: function(x, y, text, color) {
      this._ctx.fillStyle = color;
      this._ctx.fillText(text, x, y);

      if (y > this._canvas.height) {
         this._canvas.height = y + 20;
      }
   },

   _addBox: function(x, y, w, h, color) {
      this._ctx.fillStyle = color;
      this._ctx.fillRect(x, y, w, h);

      if ((y + h) > this._canvas.height) {
         this._canvas.height = y + h + 20;
      }
   },

   _getLedColor: function(obj) {
      var ACTIVE_FADE_COLORS = [
         "rgb(0, 255, 0)",
         "rgb(0, 192, 0)",
         "rgb(0, 128, 0)",
         "rgb(0, 64, 0)",
         "rgb(0, 32, 0)",
      ];
      var STARVED_COLOR = 'rgb(255, 0, 0)';

      if (obj.status != 'active') {
         return undefined;
      }

      var time_diff = this._now - obj.last_ticked
      if (time_diff >= 0 && time_diff < ACTIVE_FADE_COLORS.length) {
         return ACTIVE_FADE_COLORS[time_diff];
      }
      return STARVED_COLOR;
   },

   _drawBFSPathfinder: function(cursor, name, bfs) {
      // Add the box in the left margin showing the activity of the bfs
      var self = this;
      var activeColor = this._getLedColor(bfs);
      var textColor = activeColor ? DEFAULT_TEXT_COLOR : INACTIVE_TEXT_COLOR;
      if (activeColor) {
         this._addBox(cursor.x, cursor.y + SMALL_LED_Y_OFFSET, SMALL_LED_SIZE, SMALL_LED_SIZE, activeColor);
      }

      // Add the entity text.
      this._ctx.font = SMALL_FONT;
      this._addText(cursor.x + SMALL_LED_SIZE + SMALL_TEXT_LEFT_MARGIN,
                    cursor.y,
                    bfs.id + ': ' + name + ' (pri:' + bfs.priority + ')',
                    textColor);

      // Draw the progress bar.
      var r = Math.min(1.0, bfs.explored_distance / bfs.max_travel_distance);
      var barWidth = BFS_PATHFINDER_PROGRESS_BAR_RIGHT - BFS_PATHFINDER_PROGRESS_BAR_LEFT;
      var progressWidth = barWidth * r;
      this._addBox(cursor.x + BFS_PATHFINDER_PROGRESS_BAR_LEFT,
                   cursor.y,
                   barWidth,
                   SMALL_LED_SIZE,
                   BFS_PROGRESS_BAR_BACKGROUND_COLOR);
      this._addBox(cursor.x + BFS_PATHFINDER_PROGRESS_BAR_LEFT,
                   cursor.y,
                   progressWidth,
                   SMALL_LED_SIZE,
                   BFS_PROGRESS_BAR_COLOR);

      cursor.y = cursor.y + SMALL_FONT_LINE_SPACING;

      if (bfs.metrics && bfs.metrics.status == 'active') {
         this._drawAStarPathfinder(cursor, '  astar: ' + bfs.metrics.name, bfs.metrics, true);
      }

      var sorted = [];
      radiant.each(bfs.searches, function(id, search) {
         sorted.push({
            description: search.description,
            search: search,
         })
      });
      sorted.sort(function(l, r) {
         if (l.description < r.description) {
            return -1;
         }
         if (l.description > r.description) {
            return 1;
         }
         return 0;
      })

      // Add all the tasks indented under the ejs.
      cursor.x += EJS_INDENT_FOR_PATHFINDERS;
      radiant.each(sorted, function(i, o) {
        self._addText(cursor.x + SMALL_TEXT_LEFT_MARGIN,
                      cursor.y,
                      o.description,
                      textColor);
        cursor.y = cursor.y + SMALL_FONT_LINE_SPACING;
      });
      cursor.x -= EJS_INDENT_FOR_PATHFINDERS;
      
      cursor.y = cursor.y + LARGE_FONT_LINE_SPACING;      
   },

   _drawAStarPathfinder: function(cursor, name, astar, ignoreLabel) {
      // Add the entity text.
      if (!ignoreLabel) {
         this._ctx.font = SMALL_FONT;
         this._addText(cursor.x + SMALL_LED_SIZE + SMALL_TEXT_LEFT_MARGIN,
                       cursor.y,
                       astar.id + ': ' + name,
                       astar.stats == 'idle' ? INACTIVE_TEXT_COLOR : DEFAULT_TEXT_COLOR);
      }

      // Draw the progress bar.
      var current = astar.travel_distance;
      var remaining = astar.eta;
      if (remaining >= 0) {
         var r = Math.min(1.0, current / (current + remaining));
         var barWidth = BFS_PATHFINDER_PROGRESS_BAR_RIGHT - BFS_PATHFINDER_PROGRESS_BAR_LEFT;
         var progressWidth = barWidth * r;
         this._addBox(cursor.x + BFS_PATHFINDER_PROGRESS_BAR_LEFT,
                      cursor.y,
                      barWidth,
                      SMALL_LED_SIZE,
                      BFS_PROGRESS_BAR_BACKGROUND_COLOR);
         this._addBox(cursor.x + BFS_PATHFINDER_PROGRESS_BAR_LEFT,
                      cursor.y,
                      progressWidth,
                      SMALL_LED_SIZE,
                      ASTAR_PROGRESS_BAR_COLOR);
      }

      cursor.y = cursor.y + SMALL_FONT_LINE_SPACING;
   },

   _drawTasklet: function (cursor, name, tasklet) {
      if (tasklet.type == 'bfs') {
         this._drawBFSPathfinder(cursor, name, tasklet);
      } else if (tasklet.type == 'astar') {
         this._drawAStarPathfinder(cursor, name, tasklet);
      }
   },

   _getAiForEntity : function (uri) {
      var self = this;

      if (this._entityAi[uri]) {
         return this._entityAi[uri];
      }

      if (!this._entityTraces[uri]) {
         this._entityTraces[uri] = true;
         var entityTrace = radiant.trace(uri);
         entityTrace.progress(function(o) {
            entityTrace.destroy();
            self._entityTraces[uri] = radiant.trace(o['stonehearth:ai'])
               .progress(function(ai) {
                  self._entityAi[uri] = ai;
               });
         });
      }
      return undefined;
   },

   _drawEntityJobScheduler: function (cursor, name, ejs) {
      var self = this;

      // Add the box in the left margin showing the activity of the ejs
      var activeColor = this._getLedColor(ejs);
      var textColor = activeColor ? DEFAULT_TEXT_COLOR : INACTIVE_TEXT_COLOR;
      if (activeColor) {
         this._addBox(cursor.x, cursor.y + LARGE_LED_Y_OFFSET, LARGE_LED_SIZE, LARGE_LED_SIZE, activeColor);
      }

      // Add the entity text.
      var ai = self._getAiForEntity(ejs.entity_uri);
      if (ai) {
         name = name + ' (pri:' + ejs.priority + ' ticks:' + ejs.total_ticks + ' spin:' + ai.spin_count + ')';
      }

      this._ctx.font = LARGE_FONT;
      this._addText(cursor.x + LARGE_LED_SIZE + LARGE_TEXT_LEFT_MARGIN,
                    cursor.y,
                    name,
                    textColor);

      // Say what they're doing...
      if (ejs.entity_uri) {
         var ai = self._getAiForEntity(ejs.entity_uri);
         if (ai) {
            var activity = i18n.t(ai.status_text_key, { data: ai.status_text_data });                  
            this._addText(cursor.x + EJS_INDENT_FOR_ACTIVITY,
                          cursor.y,
                          activity,
                          EJS_ACTIVITY_COLOR);
         }
      }

      // Sort all the tasklets by name to help with visualization
      var sortedTasklets = [];
      radiant.each(ejs.tasks, function(id, tasklet) {
         sortedTasklets.push({
            name: tasklet.name,
            tasklet: tasklet,
         })
      });
      sortedTasklets.sort(function(l, r) {
         if (l.name < r.name) {
            return -1;
         }
         if (l.name > r.name) {
            return 1;
         }
         return 0;
      })

      // Add all the tasks indented under the ejs.
      cursor.y = cursor.y + LARGE_FONT_LINE_SPACING;      
      cursor.x += EJS_INDENT_FOR_PATHFINDERS;
      radiant.each(sortedTasklets, function(i, o) {
         self._drawTasklet(cursor, o.name, o.tasklet);
      });
      cursor.x -= EJS_INDENT_FOR_PATHFINDERS;
   },

   _drawRoundRobinTasks: function(tasks) {
      var self = this;
      var cursor = { x: X_ORIGIN, y: Y_ORIGIN }
      var idleTotal = 0;
      radiant.each(tasks, function(id, ejs) {
         var activity;
         var ai = self._getAiForEntity(ejs.entity_uri);
         if (ai) {
            activity = i18n.t(ai.status_text_key, { data: ai.status_text_data });
            if (activity == 'idle') {
               idleTotal = idleTotal + 1;
            }
         }

         var render;
         if (self._selectedEntity) {
            render = ejs.entity_uri == self._selectedEntity;
         } else {
            render = activity == 'idle';
         }
         if (render) {
            self._drawEntityJobScheduler(cursor, ejs.name, ejs);
            cursor.y += EJS_Y_MARGIN;
         }
      });
      this._ctx.font = LARGE_FONT;
      this._addText(0, 8, 'idle count: ' + idleTotal, 'rgb(255, 0, 0)');
   },

   actions: {
      close: function () {
         this.destroy();
      }
   },

   didInsertElement: function() {
      var self = this;

      this._entityTraces = {};
      this._entityAi = {}

      this._createCanvas();

      var first = true;

      topElement.on("radiant_selection_changed.object_browser", function (_, data) {
         self._selectedEntity = data.selected_entity;
      });

      radiant.call('radiant:game:get_job_metrics')
               .progress(function(obj) {
                  self._now = obj.now;

                  if (first) {
                     //console.log(JSON.stringify(obj, null, 2));
                     first = false;
                  }
                  self._clear();
                  self._drawRoundRobinTasks(obj.metrics.tasks);
               });

   },
});
