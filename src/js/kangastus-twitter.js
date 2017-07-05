/* jshint esversion: 6 */
/* global getConfig, StatusBar, WPAPI */

(function(){
  'use strict';
  
  $.widget("custom.kangastusTwitter", {
    
    options: {
      hashes: ['trump', 'food'],
      refreshRate: 25000,
      showRate: 30000,
      viewTime: 15000
    },
    
    _create : function() { 
      this._viewing = true;
      this._codebird = new Codebird();
      this._codebird.setUseProxy(false);
      this._codebird.setConsumerKey(getConfig().twitter.apiKey, getConfig().twitter.apiSecret);
      this._codebird.setToken(getConfig().twitter.token, getConfig().twitter.tokenSecret);
      
      setInterval(this.refreshTweets.bind(this), this.options.refreshRate);
      setInterval(this.showTweet.bind(this), this.options.showRate);
    },
    
    startViewing: function () {
      this._viewing = true;
    },
    
    stopViewing: function () {
      this._viewing = false;
    },
    
    refreshTweets() {
      this._codebird.__call("search_tweets", { q: this.options.hashes.join(' OR ') }, (reply) => {
        if (reply && reply.httpstatus === 200) {
          _.forEach(reply.statuses, (status) => {
            const created = Date.parse(status['created_at']);
            const id = status.id;
            
            $(document.body).kangastusDatabase('upsertTweet', id, created, status)
              .then((tweet) => {
              })
              .catch((err) => {
                console.log(" upsertTweet error:" + err);
              });
          });
        } else {
          console.log("Twitter errored", reply);
        }
      });
    },
    
    showTweet() {
      if (!this._viewing) {
        return;
      }
      
      $(document.body).kangastusDatabase('findOldestTweet')
        .then((tweet) => {
          if (tweet) {
            $('#tweet').hide().html(pugTweet(Object.assign(tweet, {
              userImage: tweet.user.profile_image_url_https.replace(/_normal/g,''),
              hashTags: _.map(tweet.entities.hashtags, (hashTag) => {
                return '#' + hashTag.text;
              }).join(' ')
            })));
            
            $('#tweet').slideDown();
            
            setTimeout(() => {
              $('#tweet').slideUp();
            }, this.options.viewTime);
          }
        })
        .catch((err) => {
          console.log("find tweet error:" + err);
        });
    }
    
  });
    
})();