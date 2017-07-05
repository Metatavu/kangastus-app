/* jshint esversion: 6 */
/* global $, moment, LocalFileSystem*/
(function() {
  'use strict';
  
  $.widget("custom.kangastusImage", {
    
    options: {
    },
    
    _create : function() {
      this.fs = null;
      window.requestFileSystem(LocalFileSystem.TEMPORARY, 5 * 1024 * 1024, (fs) => {
        console.log('File system open');
        this.fs = fs;
      }, (err) => {
        console.log('Error loading file system', err);
      });
      
    },
    
    downloadAndSave: function(url, filename) {
      return new Promise((resolve, reject)=> {
        if (!this.fs) {
          reject('File system not ready');
        } else {
          this.fs.root.getFile(filename, { create: true, exclusive: false }, (fileEntry) => {
            this._download(fileEntry, url)
              .then((fileUrl) => {
                resolve(fileUrl);
              })
              .catch(reject);
          }, reject);
        }
      });
    },
    
    _download: function(fileEntry, url) {
      return new Promise((resolve, reject) => {
        const fileTransfer = new FileTransfer();
        const fileURL = fileEntry.toURL();

        fileTransfer.download(
          url,
          fileURL,
          (entry) => {
            resolve(entry.toURL());
          },
          reject,
          null,
          {}
        );
      });
    }
    
  });
  
  
}).call(this);