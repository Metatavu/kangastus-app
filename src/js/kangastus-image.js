/* jshint esversion: 6 */
/* global $, moment, LocalFileSystem*/
(function() {
  'use strict';
  
  $.widget("custom.kangastusImage", {
    
    options: {
    },
    
    _create : function() {
      this.fs = null;
      window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, (fs) => {
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
          window.resolveLocalFileSystemURL(`${cordova.file.dataDirectory}${filename}`, (fileEntry) => {
            console.log('Skipping download since file exists');
            resolve(fileEntry.toURL());
          }, () => {
            this.fs.root.getFile(`${filename}.temp`, { create: true, exclusive: false }, (tempFileEntry) => {
              this._download(tempFileEntry, url, filename)
                .then((fileUrl) => {
                  resolve(fileUrl);
                })
                .catch(reject);
            }, reject);
          });
        }
      });
    },
    
    _download: function(fileEntry, url, originalName) {
      return new Promise((resolve, reject) => {
        const fileTransfer = new FileTransfer();
        const fileURL = fileEntry.toURL();
        fileTransfer.download(
          url,
          fileURL,
          (entry) => {
            window.resolveLocalFileSystemURL(cordova.file.dataDirectory, (dirEntry) => {
              entry.moveTo(dirEntry, originalName, (movedEntry) => {
                resolve(movedEntry.toURL());
              }, reject);
            }, reject);
          },
          reject,
          null,
          {}
        );
      });
    }
    
  });
  
  
}).call(this);