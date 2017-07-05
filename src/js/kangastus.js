/* jshint esversion: 6 */
/* global getConfig, StatusBar, WPAPI, AndroidFullScreen */

(function(){
  'use strict';
  
  $.widget("custom.kangastus", {
    
    options: {
    },
    
    _create : function() {
      StatusBar.hide();
      AndroidFullScreen.immersiveMode(() => {}, () => {});
      $(document.body).on("databaseInitialized", $.proxy(this._onDatabaseInitialized, this));
      $(document.body).on("touchend", '.index .kangastus-item', $.proxy(this._onIndexKangastusItemTouchEnd, this));
      $(document.body).on("touchend", '.home-btn-container', $.proxy(this._onHomeBtnTouchEnd, this));
      //$(document.body).on("touchstart", '.index .kangastus-item', $.proxy(this._onIndexKangastusItemTouchStart, this));
      
      $(document.body).kangastusImage();
      $(document.body).kangastusWordpress();    
      $(document.body).kangastusDatabase();
      $(document.body).kangastusAnimation();
      $(document.body).kangastusWeather(getConfig().weather);
      $(document.body).kangastusClock();
      $(document.body).kangastusTwitter();

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
      $('.header-container').hide();
      $(document.body).kangastusTwitter('startViewing');
    },
    
    _onContentSlideVisible: function() {
      $('.footer-container').hide();
      $('.header-container').show();
      $('.swiper-pagination').show();
      $('.swiper-button-next').show();
      $('.swiper-button-prev').show();
      $(document.body).kangastusTwitter('stopViewing');
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

    _onHomeBtnTouchEnd: function() {
      this.swiper.slideTo(1, 400, true);
    },

    _renderSlidesByParent: function(parent) {
      $(document.body).kangastusDatabase('listKangastusItemsByParent', parseInt(parent))
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
      $(document.body).kangastusDatabase('listKangastusItemsByParent', 0)
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
      $(document.body).kangastusWordpress('updateNext')
        .then((item) => {
          if (item) {
            let background = '';
            item.background = null;

            if (item.colorMask) {
              background += `linear-gradient(${item.colorMask}, ${item.colorMask})`
            }

            if (item.localImageUrl) {
              if (item.colorMask) {
                background += ',';
              }
              background += `url(${item.localImageUrl})`;
            }

            if (background && background.length > 0) {
              item.background = `background: ${background};`;  
            }

            item.order = item['menu_order'];
            $(document.body).kangastusDatabase("upsertKangastusItem", item.id, item);
          }
        })
        .catch((updateErr) => { console.log('Error updating item', updateErr); })
        .then(() => { setTimeout(() => { this._update() }, 1000 ); });
    },

    _onIndexKangastusItemTouchStart: function (e) {
      $(document.body).kangastusAnimation('animate', e.target, 'pulse');
    },
    
    _onIndexKangastusItemTouchEnd: function (e) {
      let targetPage = '';
      const parent = $(e.target).closest('.kangastus-item');
      const parentId = $(parent).attr('data-id');
      const parentTitle = $(parent).find('.index-title').text();
      const parentBg = $(parent).attr('style');
      $('.header-container').attr('style', parentBg);
      $('.header-title').text(parentTitle);
      this._renderSlidesByParent(parentId);
    },

    _onDatabaseInitialized: function () {
      this._update();
      setInterval($.proxy(this._renderIndex, this), 5000);
    }
  });
  
  $(document).on("deviceready", () => {
    $(document.body).kangastus();      
  });

})();
