/* jshint esversion: 6 */
/* global getConfig, StatusBar, WPAPI */

(function(){
  'use strict';
  
  $.widget("custom.kangastusDatabase", {
    
    options: {
      drop: false,
      browser: true
    },
    
    _create : function() {
      if (this.options.browser) {
        this.items = {};
        console.log('Database running in browser mode, for debugging purposes only.')
        $(document.body).trigger("databaseInitialized");
      } else {
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
      }
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
      this.executeTx('CREATE TABLE IF NOT EXISTS Kangastus (id, data, parent)')
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
      if (this.options.browser) {
        this.items[id] = data;
        return;
      }
      
      this.findKangastusItem(id)
        .then((item) => {
          if (item) {
            return this.updateKangastusItem(id, JSON.stringify(data), data.parent);
          } else {
            return this.insertKangastusItem(id, JSON.stringify(data), data.parent);
          }
        });
    },
    
    insertKangastusItem: function(id, data, parent) {
      return new Promise((resolve, reject) => {
        this.executeTx('INSERT INTO Kangastus (id, data, parent) values (?, ?, ?)', [id, data, parent])
          .then((rs) => {
            resolve(null);
          })
          .catch(reject);
      });
    },
    
    updateKangastusItem: function(id, data, parent) {
      return new Promise((resolve, reject) => {
        this.executeTx('UPDATE Kangastus set data = ?, parent = ? where id = ?', [data, parent, id])
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
    
    listKangastusItemsByParent: function(parent) {
      return new Promise((resolve, reject) => {
        if (this.options.browser) {
          const kangastusIds = Object.keys(this.items);
          const data = [];
          for (let i = 0; i < kangastusIds.length; i++) {
            if (parent == this.items[kangastusIds[i]].parent) {
              data.push(this.items[kangastusIds[i]]);
            }
          }
          
          if (data.length > 0) {
            resolve(data.sort((a, b) => {
              if (a.order > b.order) {
                return 1;
              } else if(b.order > a.order) {
                return -1;
              }
              return 0;
            })); 
          }
          
          data.length > 0 ? resolve(data) : resolve(null);
          
        } else {
          this.executeTx('SELECT * from Kangastus where parent = ?', parent)
            .then((rs) => {
              if (rs.rows) {
                const result = [];

                for (let i = 0; i < rs.rows.length; i++) {
                  result.push(JSON.parse(rs.rows.item(i).data));
                }
                result.sort((a, b) => {
                  if (a.order > b.order) {
                    return 1;
                  } else if(b.order > a.order) {
                    return -1;
                  }

                  return 0;
                });
                resolve(result);
              } else {
                resolve(null);
              }
            })
            .catch(reject);
        }
      });
    }
    
  });

})();