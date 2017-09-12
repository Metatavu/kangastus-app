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
      const protocol = this.options.secure ? 'https://' : 'http://';
      this.wordpressUrl = `${protocol}${this.options.host}:${this.options.port}/wp-json/wp/v2/kangastus/`;
      this.updateQueue = [];
      this.checkRemovedQueue = [];
    },

    _resolveFileName(imageObject) {
       const fileType = imageObject['source_url'].split('.').pop();
       return `${imageObject.id}.${fileType}`;
    },

    _checkRemoved(id) {
      return new Promise((resolve, reject) => {
        $.ajax({
          url: `${this.wordpressUrl}${id}`,
          success: (data) => {
            resolve(true);
          },
          error: function (jqXHR, text, err) {
            if (jqXHR.status === 404 || jqXHR.status === 403) {
              resolve(false);
            } else {
              reject(err);
            }
          }
        });
      }); 
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

    _fillCheckRemovedQueue() {
      $(document.body).kangastusDatabase('listAllKangastusItems')
      .then((kangastusItems) => {
        for (let i = 0; i < kangastusItems.length; i++) {
          this.checkRemovedQueue.push(kangastusItems[i].id);
        }
      });
    },

    _fillQueue() {
      return new Promise((resolve, reject) => {
        $.ajax({
          url: `${this.wordpressUrl}?per_page=100`,
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

    checkRemovedNext() {
      return new Promise((resolve, reject) => {
        if (this.checkRemovedQueue.length > 0) {
          const pageId = this.checkRemovedQueue.shift();
          this._checkRemoved(pageId)
            .then((found) => { 
              if (!found) {
                resolve(pageId);
              } else {
                resolve(null);
              }
            })
            .catch(reject);
        } else {
          this._fillCheckRemovedQueue()
            .then(() => { resolve(null); })
            .catch(reject);
        }
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