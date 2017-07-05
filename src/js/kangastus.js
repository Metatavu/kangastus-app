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
      
      $(document.body).on("databaseInitialized", $.proxy(this._onDatabaseInitialized, this));
      $(document.body).on("touchend", '.index .kangastus-item', $.proxy(this._onIndexKangastusItemTouchEnd, this));
      //$(document.body).on("touchstart", '.index .kangastus-item', $.proxy(this._onIndexKangastusItemTouchStart, this));
      
      $(document.body).kangastusWordpress();    
      $(document.body).kangastusDatabase();
      $(document.body).kangastusAnimation();
      $(document.body).kangastusWeather(getConfig().weather);
      $(document.body).kangastusClock();

      this.targetPage = null;
      this.swiper = null;
      this._resetSwiper((swiper) => {
        this._onIndexSlideVisible(swiper);
      });
    },

    _onIndexSlideVisible: function(swiper) {
      swiper.lockSwipes();
      $('.footer-container').show();
      $('.swiper-pagination').hide();
      $('.swiper-button-next').hide();
      $('.swiper-button-prev').hide();
    },
    
    _onContentSlideVisible: function() {
      $('.footer-container').hide();
      $('.swiper-pagination').show();
      $('.swiper-button-next').show();
      $('.swiper-button-prev').show();
    },

    _resetSwiper: function(callback) {
      if (this.swiper) {
        this.swiper.destroy();
      }
      
      this.swiper = new Swiper('.swiper-container', {
        pagination: '.swiper-pagination',
        paginationType: 'custom',
        paginationClickable: false,
        paginationCustomRender: function (swiper, current, total) {
          return `${current - 1} / ${total - 1}`;
        },
        nextButton: '.swiper-button-next',
        prevButton: '.swiper-button-prev',
        slidesPerView: 1,
        centeredSlides: true,
        spaceBetween: 30,
        onSlideChangeEnd: (swiper) => {
          const slideIndex = $('.swiper-slide-active').attr("data-swiper-slide-index");
          if (!slideIndex || slideIndex == 0) {
            this._onIndexSlideVisible(swiper);
          }
        },
        loop: true,
        loopedSlides: 0
      });
      
      if (typeof callback === 'function') {
        callback(this.swiper);
      }
    },

    _renderSlidesByTag: function(tag) {      
      $(document.body).kangastusDatabase('listKangastusItemsByTag', tag)
        .then((items) => {

          const slides = [];
          items.forEach((item) => {
            slides.push(this._preProcessPage(pugKangastusPage({
              item: item
            })));
          });

          const slideCount = this.swiper.slides.length;
          if (slideCount > 1) {
            const slidesToRemove = [];
            for(let i = 1; i < slideCount; i++) {
              slidesToRemove.push(i);
            }
            this.swiper.removeSlide(slidesToRemove);
          }

          this.swiper.appendSlide(slides);
          this._resetSwiper(() => {
            this.swiper.unlockSwipes();
            this.swiper.slideNext();
            this._onContentSlideVisible();
            this._postProcessContents();
          });

        })
        .catch((err) => {
          console.log('ERROR:' + err);
        });
    }, 
    
    _postProcessContents: function () {
      $('.qrcode-link-unprocessed').each((index, qrLink) => {
        $(qrLink).removeClass('qrcode-link-unprocessed').addClass('qrcode-link');
        
        const text = $(qrLink).attr('data-text');
        const link = $(qrLink).attr('data-link');
        
        $(qrLink).kangastusQr({
          text: text,
          link: link
        });
      });
    },
    
    _preProcessPage: function (html) {
      const pageContents = $(html);
      $.each(pageContents.find('a'), function(index, element) {
        const text = $(element).text();
        const link = $(element).attr('href');
        
        const container = $('<div>').addClass('qrcode-link-unprocessed')
          .attr({
            'data-text': text,
            'data-link': link
          });
          
        $(element).replaceWith(container);
      });

      return pageContents[0].outerHTML;
    },
    
    _renderIndex: function () {
      $(document.body).kangastusDatabase('listKangastusItemsByTag', 'etusivu')
        .then((items) => {
          const indexHtml = pugKangastusIndex({
            items: items
          });
          
          if ($('.index').length > 0) {
            $('.index').replaceWith($(indexHtml));
          } else {
            $('.content-container').append($(indexHtml));
          }
          
          this.swiper.update();
        })
        .catch((err) => {
          console.log(err);
        });
    },
    
    _update: function () {
      $(document.body).kangastusWordpress('listKangastusItems')
        .then((items) => {
          for (let i = 0; i < items.length; i++) {
            let item = items[i];
            item.order = i;
            $(document.body).kangastusDatabase("upsertKangastusItem", item.id, item);
          }
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
      
      this._renderSlidesByTag(targetPage);
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
