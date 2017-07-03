/* jshint esversion: 6 */
/* global getConfig, StatusBar, WPAPI */

(function(){
  'use strict';
  
  $.widget("custom.kangastus", {
    
    options: {
      availableTags: ['eroa-kiireesta', 'matkalla-mikkelissa', 'miksei-mikkeli']
    },
    
    _create : function() {
      StatusBar.hide();
      $(document.body).kangastusWordpress();    
      $(document.body).kangastusDatabase();
      $(document.body).kangastusAnimation();
      $(document.body).kangastusWeather(getConfig().weather);
      
      $(document.body).on("databaseInitialized", $.proxy(this._onDatabaseInitialized, this));
      $(document.body).on("touchend", '.index .kangastus-item', $.proxy(this._onIndexKangastusItemTouchEnd, this));
      $(document.body).on("touchstart", '.index .kangastus-item', $.proxy(this._onIndexKangastusItemTouchStart, this));
      
      this.swipers = {};
      this.activeSwiper = null;
      this.updateIndex = 0;
      this.options.availableTags.forEach((tag) => {
        let containerSelector = `.swiper-container[data-tag="${tag}"]`;
        this.swipers[tag] = new Swiper(containerSelector, {
            pagination: '.swiper-pagination',
            paginationClickable: true,
            nextButton: '.swiper-button-next',
            prevButton: '.swiper-button-prev',
            spaceBetween: 30,
            onReachEnd: (swiper) => {
              if(swiper.container.attr('data-tag') === this.activeSwiper) {
                this._hidePageContainer(); 
              }
            },
            loop: true
        });
        
        $(containerSelector).hide();
      });
      
      $(document.body).kangastusWeather('getTemperature')
         .then((temperature) => {
           console.log(temperature);
        })
        .catch((err) => {
          console.log("ERROR: " + err);
        });
    },
    
    
    _renderSlidesByTag: function(tag) {
      if (tag === this.activeSwiper) {
        return;
      }
      
      $(document.body).kangastusDatabase('listKangastusItemsByTag', tag)
        .then((items) => {
          if (tag === this.activeSwiper) {
            return;
          }
          const slides = [];
          items.forEach((item) => {
            slides.push(pugKangastusPage({
              item: item
            }));
          });
          
          if (tag !== this.activeSwiper) {
            this.swipers[tag].removeAllSlides();
            this.swipers[tag].prependSlide(slides);
          }
        })
        .catch((err) => {
          console.log('ERROR:' + err);
        });
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
    },
    
    _update: function () {
      $(document.body).kangastusWordpress('listKangastusItems')
        .then((items) => {
          items.forEach((item) => {
            $(document.body).kangastusDatabase("upsertKangastusItem", item.id, item);
          });
        });
    },

    _onIndexKangastusItemTouchStart: function (e) {
      $(document.body).kangastusAnimation('animate', e.target, 'pulse');
    },
    
    _onIndexKangastusItemTouchEnd: function (e) {
      let targetPage = '';
      const tag = $(e.target).closest('.kangastus-item').attr('data-tag');
      switch (tag) {
        case 'item-0':
          targetPage = 'matkalla-mikkelissa';
        break;
        case 'item-1':
          targetPage = 'eroa-kiireesta';
        break;
        case 'item-2':
          targetPage = 'miksei-mikkeli';
        break;
        default:
          console.log('target page not found');
        return;
      }
      
      $(document.body).kangastusAnimation('animate', '.index-container', 'slideOutLeft', () => {
        $('.index-container').hide();
      });
      
      $('.page-container').show();
      $(`.swiper-container[data-tag="${targetPage}"]`).show();
      this.swipers[targetPage].update(true);
      this.activeSwiper = targetPage;

      $(document.body).kangastusAnimation('animate', '.page-container', 'slideInRight');
    },
    
    _hidePageContainer: function() {
      $(document.body).kangastusAnimation('animate', '.index-container', 'slideInRight');
      $('.index-container').show();
      
      $(document.body).kangastusAnimation('animate', '.page-container', 'slideOutLeft', () => {
        $('.page-container').hide();
        $(`.swiper-container[data-tag="${this.activeSwiper}"]`).hide();
        this.activeSwiper = null;
      });
    },
    
    _onDatabaseInitialized: function () {
      setInterval($.proxy(this._update, this), 5000);
      setInterval(() => {
        this._renderSlidesByTag(this.options.availableTags[this.updateIndex]);
        this.updateIndex = (this.updateIndex + 1) % this.options.availableTags.length;
      }, 2000);
      setInterval($.proxy(this._renderIndex, this), 5000);
    }
  });
  
  $(document).on("deviceready", () => {
    $(document.body).kangastus();      
  });

})();