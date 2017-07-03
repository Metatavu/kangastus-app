/* jshint esversion: 6 */
/* global getConfig, StatusBar, WPAPI, _ */

(function(){
  'use strict';
  
  $.widget("custom.kangastusWeather", { 
    options: {
      apiKey: '',
      weatherUrl: '',
      place: ''
    },
    
    _create : function() {
      this.updateTemperature();
      
      setInterval(() => {
        this.updateTemperature();
      }, 1000 * 60 * 30 );
    },
    
    getWeatherData: function() {
      return new Promise((resolve, reject) => {
        $.getJSON(`${this.options.weatherUrl}/data/2.5/weather?q=${this.options.place}&APPID=${this.options.apiKey}`, (res) => {
          resolve(res.main);
        })
        .fail((err) => {
         reject(err);
        });
      });
    },
    
    updateTemperature: function () {
      this.getWeatherData()
        .then((weather) => {
          const kelvin = weather.temp;
          const celsius = Math.round(kelvin - 273.15);
          const displayTemp = ( celsius < 0 ? '' : '+') + celsius;
          $(this.element).find('.temp-display').text(`${displayTemp}°C`);
        })
        .catch((err) => {
          console.log("ERROR: " + err);
        });
    }
  });

})();