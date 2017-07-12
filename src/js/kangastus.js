/* jshint esversion: 6 */
/* global getConfig, StatusBar, WPAPI, AndroidFullScreen */

(function(){
  'use strict';
  
  $.widget("custom.kangastus", {
    
    options: {
      peekTimeout: 40000,
      peekTime: 4000
    },
    
    _create : function() {
      this._peekTimer = setInterval(this._onPeekTimeout.bind(this), this.options.peekTimeout);
      StatusBar.hide();
      AndroidFullScreen.immersiveMode(() => {}, () => {});
      $(this.element).stopRoutine(getConfig().stoproutine);
      $(document.body).on("databaseInitialized", $.proxy(this._onDatabaseInitialized, this));
      $(document.body).on("touchend", '.index .kangastus-item', $.proxy(this._onIndexKangastusItemTouchEnd, this));
      $(document.body).on("touchend", '.home-btn-container', $.proxy(this._onHomeBtnTouchEnd, this));
      $(document.body).on("touchstart", $.proxy(this._onUserInteraction, this));
      $(document.body).on("touchend",  '.swiper-button-next,.swiper-button-prev', function() { $(this).trigger('click'); });
      //$(document.body).on("touchstart", '.index .kangastus-item', $.proxy(this._onIndexKangastusItemTouchStart, this));
      
      $(document.body).kangastusImage();
      $(document.body).kangastusWordpress();    
      $(document.body).kangastusDatabase();
      $(document.body).kangastusAnimation();
      $(document.body).kangastusWeather(getConfig().weather);
      $(document.body).kangastusClock();
      $(document.body).kangastusTwitter();

      this.maxRenderingTimer = null;
      this.prevRootIndex = null;
      this.targetPage = null;
      this.contentVisible = false;
      this.rendering = false;
      this.swiper = null;
      this.returnToHomeScreenTimer = null;
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
      this.contentVisible = false;
      this._unsetReturnToHomeScreenTimer();
      $(document.body).kangastusTwitter('startViewing');
    },
    
    _onContentSlideVisible: function() {
      $('.footer-container').hide();
      $('.header-container').show();
      $('.swiper-pagination').show();
      $('.swiper-button-next').show();
      $('.swiper-button-prev').show();
      this.contentVisible = true;
      this._setReturnToHomeScreenTimer();
      $(document.body).kangastusTwitter('stopViewing');
      this.rendering = false;
      this._clearMaxRenderingTimer();
      this.swiper.unlockSwipes();
    },

    _onUserInteraction: function() {
      if (this.contentVisible) {
        this._setReturnToHomeScreenTimer();
      }
    },

    _unsetReturnToHomeScreenTimer: function() {
      if (this.returnToHomeScreenTimer) {
        clearTimeout(this.returnToHomeScreenTimer);
        this.returnToHomeScreenTimer = null;
      }
    },

    _setReturnToHomeScreenTimer: function() {
      this._unsetReturnToHomeScreenTimer();
      this.returnToHomeScreenTimer = setTimeout(() => {
        this.swiper.slideTo(1, 400, true);
      }, 1000 * 60 * 5);
    },

    _resetSwiper: function(callback) {
      if (this.swiper) {
        this.swiper.destroy();
      }
      
      this.swiper = new Swiper('.swiper-container', {
        pagination: '.swiper-pagination',
        paginationType: 'custom',
        paginationClickable: false,
        longSwipesMs: 900,
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
      this.swiper.lockSwipes();
      if (typeof callback === 'function') {
        callback(this.swiper);
      }
    },

    _onHomeBtnTouchEnd: function() {
      this.swiper.slideTo(1, 400, true);
    },
    
    _openSlidesByParent: function (parentId, parentBg, parentTitle) {
      if (this.rendering) {
        return;
      } 
      this.rendering = true;
      $('.peek').remove();
      $('.header-container').attr('style', parentBg);
      $('.header-title').text(parentTitle);
      this._renderSlidesByParent(parentId);
    },

    _setMaxRenderingTimer: function() {
      if (this.maxRenderingTimer) {
        clearTimeout(this.maxRenderingTimer);
      }
      
      this.maxRenderingTimer = setTimeout(() => {
        this.rendering = false;
      }, 5000);
    },
    
    _clearMaxRenderingTimer: function() {
      if (this.maxRenderingTimer) {
        clearTimeout(this.maxRenderingTimer);
        this.maxRenderingTimer = null;
      }
    },

    _renderSlidesByParent: function(parent) {
      this._setMaxRenderingTimer();
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
        .catch((updateErr) => { console.log(JSON.stringify(updateErr)); });
    },
    
    _createColormakedBackground(localImageUrl, colorMask) {
      let background = '';
      
      if (colorMask) {
        background += `linear-gradient(${colorMask}, ${colorMask})`
      }

      if (localImageUrl) {
        if (colorMask) {
          background += ',';
        }
              
        background += `url(${localImageUrl})`;
      }
      
      return background;
    },
    
    _onPeekTimeout: function () {
      if (this.contentVisible) {
        return;
      }
      
      $(document.body).kangastusDatabase('listKangastusItemsByParent', 0)
        .then((rootItems) => {
          let rootIndex = Math.round(Math.random() * (rootItems.length - 1));
          do {
            rootIndex = Math.round(Math.random() * (rootItems.length - 1));
          } while (rootIndex == this.prevRootIndex);
          
          this.prevRootIndex = rootIndex;
          const rootItem = rootItems[rootIndex]; 
          
          $(document.body).kangastusDatabase('listKangastusItemsByParent', rootItem.id)
           .then((childItems) => {
             const childIndex = Math.round(Math.random() * (childItems.length - 1));
             const childItem = childItems[childIndex];
             
             const peekHtml = pugPeek({
               item: childItem
             });
             
             $('<div>')
               .css('top', ((rootIndex * 567) + (rootIndex * 10)) + 'px')
               .addClass('peek')
               .html(peekHtml)
               .appendTo(document.body)
               .hide()
               .show("slide", { direction: "down" }, 600)
               .on("touchend", () => {
                 const parentTitle = rootItem.title.rendered;
                 const parentBg = this._createColormakedBackground(rootItem.localImageUrl, rootItem.colorMask);
                 this._openSlidesByParent(rootItem.id, 'background: ' + parentBg, parentTitle);
               });
             
             setTimeout(() => {
               $(`.peek`).hide("slide", { direction: "down" }, 600, () => {
                 $('.peek').remove();
               });
             }, this.options.peekTime);
           });
        });
    },

    _onIndexKangastusItemTouchStart: function (e) {
      $(document.body).kangastusAnimation('animate', e.target, 'pulse');
    },
    
    _onIndexKangastusItemTouchEnd: function (e) {
      if (this.contentVisible) {
        return false;
      }
      const parent = $(e.target).closest('.kangastus-item');
      const parentId = $(parent).attr('data-id');
      const parentTitle = $(parent).find('.index-title').text();
      const parentBg = $(parent).attr('style');
      
      this._openSlidesByParent(parentId, parentBg, parentTitle);
    },

    _onDatabaseInitialized: function () {
      setInterval($.proxy(this._update, this), 7000);
      setInterval($.proxy(this._renderIndex, this), 5000);
    }
  });
  
  $(document).on("deviceready", () => {
    $(document.body).kangastus();      
  });

})();
