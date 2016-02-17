$(document).on('stonehearthReady', function(){
   App.debugDock.addToDock(App.StonehearthPerfmonIcon);
});

App.StonehearthPerfmonIcon = App.View.extend({
   templateName: 'perfmonIcon',
   classNames: ['debugDockIcon'],

   didInsertElement: function() {
      $('#perfmonIcon').tooltipster();
      this.$().click(function() {
         App.debugView.addView(App.StonehearthPerfmonView)
      })
   }
});

App.StonehearthPerfmonView = App.View.extend({
   templateName: 'Perfmon',
   objectHtml: "",
   loading: false,
   history: [],
   forwardHistory: [],

   init: function() {
      var self = this;

      self._defaultPrecision = 2;

      self._defaultSuffixes = {
         '-3': 'n',
         '-2': 'u',
         '-1': 'm',
          '0': '',
          '1': 'K',
          '2': 'M',
          '3': 'G',
          '4': 'T',
          '5': 'P'
       };

      self._timeSuffixes = {
        '-2': 'n',
        '-1': 'u',
         '0': 'm', // milliseconds is the default scale
         '1': '',
         '2': 'mins',
         '3': 'hrs',
         '4': 'days'
      };

      // the key of the timeScale corresponds to the key of the timeSuffix
      self._timeScales = {
         'min': 2,
         '2': 1000*60,       // milliseconds/min
         '3': 1000*60*60,    // milliseconds/hr
         '4': 1000*60*60*24, // milliseconds/day
         'max': 4
      };

      self._formatFunctions = {
         memory: function(value) {
            return self._formatNormalized(value, 'B', 1024);
         },

         time: function(value) {
            var timeScales = self._timeScales;
            var absValue = Math.abs(value);

            for (var i = timeScales.max; i >= timeScales.min; i--) {
               if (absValue >= timeScales[i]) {
                  value /= timeScales[i];
                  value = value.toFixed(self._defaultPrecision);
                  return value + ' ' + self._timeSuffixes[i];
               }
            }

            return self._formatNormalized(value, 's', 1000, self._timeSuffixes)
         },

         default: function(value) {
            return self._formatNormalized(value);
         },
      },

      self._perf_trace = new RadiantTrace();
      self._super();
   },

   didInsertElement: function() {
      var self = this;

      this.$().draggable();

      this.$('.close').click(function() {
         self.destroy();
      });

      self._srv_perf_trace = radiant.call('radiant:game:get_perf_counters')
         .progress(function(data) {
            self._updateCounters(data, 'server');
         });
      self._client_perf_trace = radiant.call('radiant:client:get_perf_counters')
         .progress(function(data) {
            self._updateCounters(data, 'client');
         });

      self.$('.button').tooltipster({
         theme: 'tooltipster-shdt',
         arrow: true,
      });
   },

   destroy: function() {
      if (this._perf_trace) {
         // XXX, I would really like to destroy this, but _perf_trace apparently
         // doesn't have a destroy method, at least that's what the chrome debugger claims
         //this._perf_trace.destroy();
         this._perf_trace = null;
      }
      this._super();
   },

   _formatNormalized: function(value, unit, base, suffixes, precision) {
      var self = this;
      unit = unit || '';
      suffixes = suffixes || self._defaultSuffixes;

      var result = self._normalize(value, base, precision);
      var suffix = suffixes[result.scale] + unit;
      return result.value + ' ' + suffix;
   },

   // works for negative numbers and numbers < 1
   _normalize: function(value, base, precision) {
      var self = this;
      // This is harder to read but works when arg is boolean:
      //    arg = (typeof arg === 'undefined') ? 1000 : arg;
      base = base || 1000;
      precision = precision || self._defaultPrecision;
      var epsilon = 0.000001;
      var scale = 0;

      var absValue = Math.abs(value)                               // handle negative numbers
      if (absValue > epsilon) {                                    // treat rounding errors near 0 as 0
         scale = Math.floor(Math.log(absValue) / Math.log(base));  // find the exponent for the base
         value /= Math.pow(base, scale);                           // normalize the value
      }

      if (scale != 0) {
         value = value.toFixed(precision);
      }
      
      return { value: value, scale: scale }
   },

   _formatCounter: function(data) {
      var formatFn = this._formatFunctions[data.type];

      if (!formatFn) {
         formatFn = this._formatFunctions.default;
      }

      return formatFn(data.value);
   },

   _updateCounters: function (data, counterType) {
      // this should not be necessary, but the trace is not being destroyed properly
      if (!this._perf_trace) {
         return
      }

      var self = this;
      var counters = [];

      $.each(data, function(i, d) {
         var entry = {
            name : d.name,
            value : self._formatCounter(d)
         };
         counters.push(entry)
      });

      counters.sort(function(l, r) {
         if (l.name < r.name) {
            return -1;
         }
         if (l.name > r.name) {
            return 1;
         }
         return 0;
      });

      this.set('counters_' + counterType, counters);
   },

   actions: {
      toggleLongTickProfile: function() {
         radiant.call('radiant:toggle_profile_long_ticks');
      }
   }

});

