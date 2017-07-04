/* jshint esversion: 6 */
/* global getConfig, _, QRCode */

(function(){
  'use strict';
  
  $.widget("custom.kangastusQr", { 
    options: {
      size: 200,
      text: ''
    },
    
    _create : function() {
      this.qrcode = new QRCode(this.element[0], {
        text: this.text,
        width: this.options.size,
        height: this.options.size,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
      });
    }
  });

})();