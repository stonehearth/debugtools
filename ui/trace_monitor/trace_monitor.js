var topElement;
$(document).on('stonehearthReady', function(){
   topElement = $(top);
   App.debugDock.addToDock(App.StonehearthTraceMonitorIcon);
});

App.StonehearthTraceMonitorIcon = App.View.extend({
   templateName: 'traceMonitorIcon',
   classNames: ['debugDockIcon'],

   didInsertElement: function() {
      $('#traceMonitorIcon').tooltipster();
      this.$().click(function() {
         App.debugView.addView(App.StonehearthTraceMonitorView);
      })
   }

});

App.StonehearthTraceMonitorView = App.View.extend({
   templateName: 'traceMonitor',

   didInsertElement: function() {
      var self = this;

      this.$('.close').click(function() {
         self.destroy();
      });

      self.timer = window.setInterval(function() {
        var data = radiant.map_to_array(radiant.get_tracer_map_stats(), function(k, v) {
          return {
            uri : k,
            progress: v.progress,
            done: v.done,
            fail: v.fail
          };
        });

        data.sort(function(a, b) {
          if (a.progress != b.progress) {
            if (a.progress > b.progress) {
              return -1;
            } else {
              return 1;
            }
          }

          if (a.done != b.done) {
            if (a.done > b.done) {
              return -1;
            } else {
              return 1;
            }
          }

          if (a.fail > b.fail) {
            return -1;
          } else {
            return 1;
          }
          return 0;
        });

        // Top 30 is probably for the best?
        data.splice(30);

        var table = self.$('#traceMonitorTable');
        table.empty();

        $('<tr>')
          .append($('<td>').text('uri'))
          .append($('<td>').text('# progress'))
          .append($('<td>').text('# done'))
          .append($('<td>').text('# fail'))
          .appendTo(table);


        radiant.each(data, function(k, v) {
          $('<tr>')
            .append($('<td>').text(v.uri))
            .append($('<td>').text(v.progress))
            .append($('<td>').text(v.fail))
            .append($('<td>').text(v.done))
            .appendTo(table);
        });

      }, 1000);
   },

   willDestroyElement: function() {
    window.clearInterval(self.timer);
   }
});
