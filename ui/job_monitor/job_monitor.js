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
var Y_ORIGIN = 10;

var LARGE_LED_SIZE = 5;
var LARGE_LED_Y_OFFSET = -6;
var LARGE_FONT = '10px consolasregular';
var LARGE_FONT_LINE_SPACING = 9;
var LARGE_TEXT_LEFT_MARGIN = 4;

var SMALL_LED_SIZE = 3;
var SMALL_LED_Y_OFFSET = -5;
var SMALL_FONT = '8px consolasregular';
var SMALL_FONT_LINE_SPACING = 8;
var SMALL_TEXT_LEFT_MARGIN = 4;

var BFS_PATHFINDER_PROGRESS_BAR_LEFT = 200;
var BFS_PATHFINDER_PROGRESS_BAR_RIGHT = 450;
var BFS_PROGRESS_BAR_COLOR = 'rgb(0, 0, 255)';
var BFS_PROGRESS_BAR_BACKGROUND_COLOR = 'rgb(64, 64, 64)';

var DEFAULT_TEXT_COLOR = 'rgb(255, 255, 255)';
var INACTIVE_TEXT_COLOR = 'rgb(128, 128, 128)';
var EJS_INDENT_FOR_PATHFINDERS = 24;
var EJS_INDENT_FOR_ACTIVITY = BFS_PATHFINDER_PROGRESS_BAR_LEFT - EJS_INDENT_FOR_PATHFINDERS;
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
   },

   _addBox: function(x, y, w, h, color) {
      this._ctx.fillStyle = color;
      this._ctx.fillRect(x, y, w, h);
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

      var time_diff = this._now - obj.last_processed
      if (time_diff >= 0 && time_diff < ACTIVE_FADE_COLORS.length) {
         return ACTIVE_FADE_COLORS[time_diff];
      }
      return STARVED_COLOR;
   },

   _drawBFSPathfinder: function(cursor, name, bfs) {
      // Add the box in the left margin showing the activity of the bfs
      var activeColor = this._getLedColor(bfs);
      var textColor = activeColor ? DEFAULT_TEXT_COLOR : INACTIVE_TEXT_COLOR;
      if (activeColor) {
         this._addBox(cursor.x, cursor.y + SMALL_LED_Y_OFFSET, SMALL_LED_SIZE, SMALL_LED_SIZE, activeColor);
      }

      // Add the entity text.
      this._ctx.font = SMALL_FONT;
      this._addText(cursor.x + SMALL_LED_SIZE + SMALL_TEXT_LEFT_MARGIN,
                    cursor.y,
                    bfs.id + ': ' + name,
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
   },

   _drawAStarPathfinder: function(cursor, name, astar) {
      // Add the box in the left margin showing the activity of the astar
      var activeColor = this._getLedColor(astar);
      var textColor = activeColor ? DEFAULT_TEXT_COLOR : INACTIVE_TEXT_COLOR;
      if (activeColor) {
         this._addBox(cursor.x, cursor.y + SMALL_LED_Y_OFFSET, SMALL_LED_SIZE, SMALL_LED_SIZE, activeColor);
      }

      // Add the entity text.
      this._ctx.font = SMALL_FONT;
      this._addText(cursor.x + SMALL_LED_SIZE + SMALL_TEXT_LEFT_MARGIN,
                    cursor.y,
                    name,
                    textColor);

      this._addText(cursor.x + SMALL_LED_SIZE + BFS_PATHFINDER_PROGRESS_BAR_LEFT,
                    cursor.y,
                    astar.idle,
                    textColor);

      cursor.y = cursor.y + SMALL_FONT_LINE_SPACING;
   },

   _drawTasklet: function (cursor, name, tasklet) {
      if (tasklet.type == 'bfs') {
         this._drawBFSPathfinder(cursor, name, tasklet);
      } else if (tasklet.type == 'astar') {
         this._drawAStarPathfinder(cursor, name, tasklet);
      }
   },

   _checkEntityActivity : function (uri) {
      var self = this;

      if (this._entityActivities[uri]) {
         return this._entityActivities[uri];
      }

      if (!this._entityTraces[uri]) {
         this._entityTraces[uri] = true;
         var entityTrace = radiant.trace(uri);
         entityTrace.progress(function(o) {
            entityTrace.destroy();
            self._entityTraces[uri] = radiant.trace(o['stonehearth:ai'])
               .progress(function(ai) {
                  var activity = i18n.t(ai.status_text_key, { data: ai.status_text_data });
                  self._entityActivities[uri] = activity;
                  console.log('activity changed to ', activity)              
               });
         });
      }

      return '...';
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
      this._ctx.font = LARGE_FONT;
      this._addText(cursor.x + LARGE_LED_SIZE + LARGE_TEXT_LEFT_MARGIN,
                    cursor.y,
                    name,
                    textColor);

      // Say what they're doing...
      if (ejs.entity_uri) {
         var activity = self._checkEntityActivity(ejs.entity_uri);
         this._addText(cursor.x + EJS_INDENT_FOR_ACTIVITY,
                       cursor.y,
                       activity,
                       EJS_ACTIVITY_COLOR);
      }

      // Sort all the tasklets by priority to help with visualization
      var sortedTasklets = [];
      radiant.each(ejs.tasks, function(name, tasklet) {
         sortedTasklets.push({
            name: name,
            tasklet: tasklet,
         })
      });
      sortedTasklets.sort(function(l, r) {
         return r.tasklet.priority - l.tasklet.priority;
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
      radiant.each(tasks, function(name, ejs) {
         self._drawEntityJobScheduler(cursor, name, ejs);
         cursor.y += EJS_Y_MARGIN;
      });

   },

   didInsertElement: function() {
      var self = this;

      this._entityTraces = {};
      this._entityActivities = {}

      this._createCanvas();

      var first = true;

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
