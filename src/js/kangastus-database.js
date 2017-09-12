/* jshint esversion: 6 */
/* global getConfig, StatusBar, WPAPI, Promise */

(function(){
  'use strict';
  
  $.widget("custom.kangastusDatabase", {
    
    options: {
      drop: false,
      browser: false
    },
    
    _create : function() {
      if (this.options.browser) {
        this.items = {};
        this.tweets = {};
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
      Promise.all([
         this.executeTx('CREATE TABLE IF NOT EXISTS Kangastus (id, data, parent)'),
         this.executeTx('CREATE TABLE IF NOT EXISTS Tweet (id, created, data)')
      ])
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

    
    deleteKangastusItem: function(id) {
      return new Promise((resolve, reject) => {
        this.executeTx('DELETE from Kangastus where id = ?', [id])
          .then(() => {
            resolve();
          })
          .catch(reject);
      });
    },
    
    listAllKangastusItems: function() {
      return new Promise((resolve, reject) => {
        this.executeTx('SELECT * from Kangastus')
          .then((rs) => {
            const result = [];
            if (rs.rows) {
              for (let i = 0; i < rs.rows.length; i++) {
                result.push(JSON.parse(rs.rows.item(i).data));
              }
            }
            resolve(result);
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
          this.executeTx('SELECT * from Kangastus where parent = ?', [parent])
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
    },
    
    upsertTweet: function(id, created, data) {
      if (this.options.browser) {
        this.tweets[id] = JSON.stringify(data);
        
        return new Promise((resolve) => {
          resolve();
        });
      }
      
      return this.findTweet(id)
        .then((tweet) => {
          if (tweet) {
            return this.updateTweet(id, created, JSON.stringify(data));
          } else {
            return this.insertTweet(id, created, JSON.stringify(data));
          }
        });
    },
    
    findOldestTweet: function () {
      if (this.options.browser) {
        return new Promise((resolve) => {
          const ids = Object.keys(this.tweets);
          const id = ids && ids.length ? ids[0] : null;
          const tweet = this.tweets[id];
          delete this.tweets[id];
          resolve(tweet);
        });
      } else {
        return new Promise((resolve, reject) => {
          this.executeTx('SELECT * from Tweet order by created desc limit 1')
            .then((rs) => {
              if (rs.rows && rs.rows.length) {
                const row = rs.rows.item(0);
                const data = row.data;
                
                this.executeTx('DELETE FROM Tweet where id = ?', [row.id])
                  .then(() => {
                    resolve(JSON.parse(data));
                  })
                  .catch(reject);
              } else {
                resolve(null);
              }
            })
            .catch(reject);
        });
      }
    },
    
    insertTweet: function(id, created, data) {
      return new Promise((resolve, reject) => {
        this.executeTx('INSERT INTO Tweet (id, created, data) values (?, ?, ?)', [id, created, data])
          .then((rs) => {
            resolve(null);
          })
          .catch(reject);
      });
    },
    
    updateTweet: function(id, created, data) {
      return new Promise((resolve, reject) => {
        this.executeTx('UPDATE Tweet set data = ?, created = ? where id = ?', [data, created, id])
          .then((rs) => {
            resolve(null);
          })
          .catch(reject);
      });
    },
    
    findTweet: function(id) {
      return new Promise((resolve, reject) => {
        this.executeTx('SELECT * from Tweet where id = ?', [id])
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
    }
    
  });

})();