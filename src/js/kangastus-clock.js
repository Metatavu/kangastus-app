/* jshint esversion: 6 */
/* global $, moment*/
(function() {
  'use strict';
  
  $.widget("custom.kangastusClock", {
    
    options: {
      displayFormat: 'H:mm'
    },
    
    _create : function() {
      setInterval(() => {
        this._updateTime();
      }, 500);
    },
    
    _updateTime: function() {
      $(this.element).find('.time-display').text(moment().format(this.options.displayFormat));
    }
    
  });
  
  
}).call(this);