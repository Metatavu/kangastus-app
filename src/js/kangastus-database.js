/* jshint esversion: 6 */
/* global getConfig, StatusBar, WPAPI */

(function(){
  'use strict';
  
  $.widget("custom.kangastusDatabase", {
    
    options: {
      drop: false
    },
    
    _create : function() {
      this.prepareDatabase()
        .then(() => {
          window.sqlitePlugin.openDatabase({ name: 'kangastus.db', location: 'default' }, (db) => {
            this.db = db;
            this.initializeDatabase();
            $(document.body).trigger("databaseOpen");
          });
        })
        .catch((err) => {
          console.error(err);
        });
    },
    
    prepareDatabase: function () {
      return new Promise((resolve, reject) => {
        if (this.options.drop) {
          window.sqlitePlugin.deleteDatabase({ name: 'kangastus.db', location: 'default' }, () => {
            console.log("db dropped");
            resolve();
          }, (err) => {
            reject(err);
          });
        } else {
          resolve();
        }
      });
    },
    
    initializeDatabase: function() {
      this.executeTx('CREATE TABLE IF NOT EXISTS Kangastus (id, data, tagsSearch)')
        .then(() => {
          console.log("db Initialized");
          $(document.body).trigger("databaseInitialized");
        })
        .catch(this.handleError);
    },
    
    handleError: function(error) {
      console.error(error);
    },
    
    executeTx(sql, params) {
      return new Promise((resolve, reject) => {
        this.db.transaction((tx) => {
          tx.executeSql(sql, params, (tx, rs) => {
            resolve(rs);
          }, (tx, error) => {
            reject(error);
          });
        }, (error) => {
          reject('Transaction ERROR: ' + error.message);
        }, () => {
        });
      });
    },
    
    upsertKangastusItem: function(id, data) {
      this.findKangastusItem(id)
        .then((item) => {
          if (item) {
            return this.updateKangastusItem(id, JSON.stringify(data), data.tagsSearch);
          } else {
            return this.insertKangastusItem(id, JSON.stringify(data), data.tagsSearch);
          }
        });
    },
    
    insertKangastusItem: function(id, data, tagsSearch) {
      return new Promise((resolve, reject) => {
        this.executeTx('INSERT INTO Kangastus (id, data, tagsSearch) values (?, ?, ?)', [id, data, tagsSearch])
          .then((rs) => {
            resolve(null);
          })
          .catch(reject);
      });
    },
    
    updateKangastusItem: function(id, data, tagsSearch) {
      return new Promise((resolve, reject) => {
        this.executeTx('UPDATE Kangastus set data = ?, tagsSearch = ? where id = ?', [data, tagsSearch, id])
          .then((rs) => {
            resolve(null);
          })
          .catch(reject);
      });
    },
    
    findKangastusItem: function(id) {
      return new Promise((resolve, reject) => {
        this.executeTx('SELECT * from Kangastus where id = ?', [id])
          .then((rs) => {
            if (rs.rows && rs.rows.length) {
              const row = rs.rows.item(0);
              resolve(row.data);
            } else {
              resolve(null);
            }
          })
          .catch(reject);
      });
    },
    
    listKangastusItemsByTag: function(tag) {
      return new Promise((resolve, reject) => {
        this.executeTx('SELECT * from Kangastus where (tagsSearch like ?)', [`%|${tag}|%`])
          .then((rs) => {
            if (rs.rows) {
              const result = [];
      
              for (let i = 0; i < rs.rows.length; i++) {
                result.push(JSON.parse(rs.rows.item(i).data));
              }
              
              resolve(result);
            } else {
              resolve(null);
            }
          })
          .catch(reject);
      });
    }
    
  });
  
  $(document).on("deviceready", () => {
    $(document.body).kangastus();      
  });

})();