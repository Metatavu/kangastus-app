/* jshint esversion: 6 */
/* global getConfig, StatusBar, WPAPI */

(function(){
  'use strict';
  
  $.widget("custom.kangastus", {
    
    options: {
    },
    
    _create : function() {
      StatusBar.hide();
      $(document.body).kangastusWordpress();    
      $(document.body).kangastusDatabase();
      
      $(document.body).on("databaseInitialized", $.proxy(this._onDatabaseInitialized, this));
      $(document.body).on("click", '.index-container', $.proxy(this._onIndexContainerClick, this));
      $(document.body).on("click", '.page-container', $.proxy(this._onPageContainerClick, this));
      
      
    },
    
    _renderIndex: function () {
      $(document.body).kangastusDatabase('listKangastusItemsByTag', 'etusivu')
        .then((items) => {
          $('.index-container').html(pugKangastusIndex({
            items: items
          }));
        })
        .catch((err) => {
          console.log(err);
        });
        
      $(document.body).kangastusDatabase('listKangastusItemsByTag', 'eroa-kiireesta')
        .then((items) => {
          $('.page-container').html(pugKangastusPage({
            items: items
          }));
        })
        .catch((err) => {
          console.log('ERROR:' + err);
        });
    },
    
    _update: function () {
      $(document.body).kangastusWordpress('listKangastusItems')
        .then((items) => {
          items.forEach((item) => {
            $(document.body).kangastusDatabase("upsertKangastusItem", item.id, item);
          });
        });
    },
    
    _onIndexContainerClick: function () {
      $('.index-container').hide("slide", { direction: "left", complete: () => { } }, 300);
      $('.page-container').show("slide", { direction: "right", complete: () => { } }, 300);
    },
    
    _onPageContainerClick: function () {
      $('.page-container').hide("slide", { direction: "right", complete: () => { } }, 300);
      $('.index-container').show("slide", { direction: "left", complete: () => { } }, 300);
    },
    
    _onDatabaseInitialized: function () {
      setInterval($.proxy(this._update, this), 5000);
      setInterval($.proxy(this._renderIndex, this), 5000);
    }
  });
  
  $(document).on("deviceready", () => {
    $(document.body).kangastus();      
  });

})();