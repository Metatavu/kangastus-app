/* jshint esversion: 6 */
/* global getConfig, StatusBar, WPAPI */

(function(){
  'use strict';
  
  $.widget("custom.kangastusAnimation", {
    
    options: {
      animationEnd: 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend'
    },
    
    _create : function() { },
    
    animate: function(element, animation, complete) {
      if($(element).hasClass('animated')) {
        return;
      }
      
      $(element).addClass('animated ' + animation).one(this.options.animationEnd, (e) => {
          if(!$(e.target).is($(element))) {
             return;
          }
          
          $(element).removeClass('animated ' + animation);
          if (typeof complete === 'function') {
            complete();
          }
      });
    }
  });
    
})();