/* jshint esversion: 6 */
/* global getConfig, _, QRCode */

(function(){
  'use strict';
  
  $.widget("custom.kangastusQr", { 
    options: {
      size: 200,
      text: '',
      link: ''
    },
    
    _create : function() {
      const label = $('<label>')
        .text(this.options.text)
        .appendTo(this.element);

      const imageContainer =  $('<div>')
        .addClass('qrlink-image-container')
        .appendTo(this.element);
      
      this.qrcode = new QRCode(imageContainer[0], {
        width: this.options.size,
        height: this.options.size
      });
      
      this.qrcode.makeCode(this.options.link);
    }
  });

})();