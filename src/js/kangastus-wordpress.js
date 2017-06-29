/* jshint esversion: 6 */
/* global getConfig, StatusBar, WPAPI */

(function(){
  'use strict';
  
  $.widget("custom.kangastusWordpress", {
    
    options: {
      host: 'info-local.metatavu.io',
      port: 1234,
      secure: false
    },
    
    _create : function() {
      
    },
    
    listKangastusItems() {
      return new Promise((resolve, reject) => {
        $.ajax({
          url: 'http://info-local.metatavu.io:1234/wp-json/wp/v2/kangastus/',
          success: (data) => {
            resolve(data);
          },
          error: function (jqXHR, text, err) {
            reject(err);
          }
        });
      }); 
    }
  });

})();