/* jshint esversion: 6 */
/* global getConfig, StatusBar, WPAPI, Promise */

(function(){
  'use strict';
  
  $.widget("custom.kangastusWordpress", {
    
    options: {
      host: 'info-local.metatavu.io',
      port: 1234,
      secure: false
    },
    
    _create : function() {
      this.updateQueue = [];
    },
    
    _resolveFileName(imageObject) {
       const fileType = imageObject['source_url'].split('.').pop();
       return `${imageObject.id}.${fileType}`;
    },
    
    _processItem(item) {
      return new Promise((resolve, reject) => {
        if (item['better_featured_image'] && item['better_featured_image']['source_url']) {
          const url = item['better_featured_image']['source_url'];
          $(document.body).kangastusImage("downloadAndSave", url, this._resolveFileName(item['better_featured_image']))
            .then((fileUrl) => {
              item.localImageUrl = fileUrl;
              resolve(item);
            })
            .catch(reject);
        } else {
          resolve(item);
        }
      });
    },
    
    _fillQueue() {
      return new Promise((resolve, reject) => {
        $.ajax({
          url: 'https://hallinta-mikkeli.kunta-api.fi/wp-json/wp/v2/kangastus/?per_page=100',
          success: (data) => {
            this.updateQueue = data;
            resolve(data);
          },
          error: function (jqXHR, text, err) {
            reject(err);
          }
        });
      }); 
    },
    
    updateNext() {
      return new Promise((resolve, reject) => {
        if (this.updateQueue.length > 0) {
          this._processItem(this.updateQueue.shift())
            .then((item) => { resolve(item); })
            .catch(reject);
        } else {
          this._fillQueue()
            .then(() => { resolve(null); })
            .catch(reject);
        }
      });
    }
    
    
  });

})();