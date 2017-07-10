/* jshint esversion: 6 */
/* global $, KioskPlugin*/

(function(){
  'use strict';
  
  $.widget("custom.stopRoutine", {
    
    options: {
      password: 'secret'
    },
    
    _create : function() {
      this.closeBtn = $('<div>')
        .css('width', '10px')
        .css('height', '10px')
        .css('top', '0')
        .css('left', '0')
        .css('position', 'absolute')
        .css('background', 'transparent')
        .css('z-index', '99999');
                        
      this.closeBtn.on('touchstart', $.proxy(this._onCloseBtnTouchStart, this));
      this.closeBtn.on('touchend', $.proxy(this._onCloseBtnTouchEnd, this));
      this.closeTimer = null;
      this.closeBtn.appendTo($(this.element));
    },
    
    _onCloseBtnTouchStart: function(e) {
      if (this.closeTimer) {
        clearTimeout(this.closeTimer);
      }
      this.closeTimer = setTimeout(() => {
        this._onCloseTimeout();
      }, 20000);
    },
    
    _onCloseBtnTouchEnd: function(e) {
      if (this.closeTimer) {
        clearTimeout(this.closeTimer);
        this.closeTimer = null;
      }
    },
    
    _onCloseTimeout: function() {
       const password = prompt("???", "");
       if (password == this.options.password) {
        KioskPlugin.exitKiosk();
       }
    }
    
  });

})();