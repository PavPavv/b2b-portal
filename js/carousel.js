'use strict';

//=====================================================================================================
// Запуск инициализации карусели(ей):
//=====================================================================================================

function startCarouselInit(obj, start) {
  if (obj.length) {
    obj.forEach(el => startCarouselInit(el));
  } else {
    return new Carousel(obj, start);
  }
}

//=====================================================================================================
// Конструктор карусели с настройками по умолчанию:
//=====================================================================================================

function Carousel(obj, start) {

  // НАСТРОЙКИ ПО УМОЛЧАНИЮ:

  this.settings = {
    isNav: false,            // Наличие навигации (точек или картинок под каруселью)
    navType: 'img',         // Тип навигации ('img' или 'dot')
    isInfinitie: true,       // Бесконечное зацикливание карусели
    isAnimate: true,         // Анимация смены слайдов (анимировать смену слайдов или нет)
    toggleAmount: 1,         // Количество перелистываемых слайдов за раз
    isCenter: false,         // Активная картинка всегда по центру карусели (работает только для бесконечной карусели)
    isHoverToggle: false,    // Листание при наведении на картинку (если false, то будет листание по клику)
    durationBtns: 600,       // Продолжительность анимации при переключении кнопками вперед/назад (мc)
    durationNav: 400,        // Продолжительность анимации при переключении миниатюрами/индикаторами(мс)
    animateFunc: 'ease',     // Эффект анимации
    isAvtoScroll: false,     // Автоматическая прокрутка
    interval: 6000,          // Интервал между автоматической прокруткой (мс)
    avtoDirection: 'next',   // Направление автоматической прокрутки ('prev' или 'next')
    isStopAvtoScroll: false, // Остановка автоматической прокрутки при наведении мыши на карусель
    isLoupe: false,          // Эффект лупы при наведении на изображение
    isLoupeOutside: false,   // Лупа как отдельный блок
    loupeWidth: 200,         // Ширина лупы (если лупа - отдельны блок)
    loupeHeight: 200         // Высота лупы (если лупа - отдельны блок)
  };

  // ЭЛЕМЕНТЫ:

  this.carousel = obj;
  this.carouselType = obj.dataset.type;
  this.galleryWrap = obj.querySelector('.carousel-gallery-wrap');
  this.gallery = obj.querySelector('.carousel-gallery');
  this.itemsGallery = this.gallery.querySelectorAll('.carousel-item');
  this.imgCount = this.itemsGallery.length;
  this.nav = obj.querySelector('.carousel-nav');
  this.leftBtn = obj.querySelector('.left-btn');
  this.rightBtn = obj.querySelector('.right-btn');

  // КОНСТАНТЫ:

  this.visibleImg = Math.round(this.gallery.clientWidth / this.itemsGallery[0].clientWidth);
  this.offset = 0;

  // ПЕРЕМЕННЫЕ:

  this.curImg = 0;
  this.itemWidth = parseFloat(window.getComputedStyle(this.itemsGallery[0]).width);
  this.galleryMargin = 0;
  this.direction;
  this.touchPrev = true;
  this.touchNext = true;
  this.isMoveSlide = false;
  this.scrollTimeout;
  this.imgIndex;
  this.i;
  this.oldEl;
  this.newEl;
  this.diffNum;
  this.img;
  this.imgDimentions;
  this.galleryDimentions;
  this.imgWidth;
  this.imgHeight;
  this.halfImgWidth;
  this.halfImgHeight;
  this.offsetX;
  this.offsetY;

  // ФУНКЦИИ:

  // Установка обработчиков событий:

  this.setEventListeners = function() {
    this.leftBtn.addEventListener('click', event => this.startMoveImg('prev', event));
    this.rightBtn.addEventListener('click', event => this.startMoveImg('next', event));

    this.galleryWrap.addEventListener('touchstart', event => this.touchStart(event));
    this.galleryWrap.addEventListener('touchend', event => this.touchEnd(event));

    if (this.settings.isNav) {
      if (this.settings.isHoverToggle) {
        this.itemsNav.forEach(el => el.addEventListener('mouseenter', event => this.startMoveImg(event.currentTarget.dataset.numb, event)));
      } else {
        this.itemsNav.forEach(el => el.addEventListener('click', event => this.startMoveImg(event.currentTarget.dataset.numb, event)));
      }
    }

    if (this.settings.isAvtoScroll && this.settings.isStopAvtoScroll) {
      this.galleryWrap.addEventListener('mouseenter', () => this.stopAvtoScroll());
      this.galleryWrap.addEventListener('mouseleave', () => this.setAvtoScroll());
    };

    if (this.settings.isLoupe) {
      this.itemsGallery.forEach(item => item.addEventListener('mouseenter', event => this.initLoupe(event)));
      this.itemsGallery.forEach(item => item.addEventListener('mousemove', event => this.moveLoupe(event)));
      // this.itemsGallery.forEach(item => item.addEventListener('mouseleave', event => this.closeLoupe(event)));
    }
  };

  // Создание навигации миниатюрами:

  this.createNav = function() {
    if (this.nav) {
      this.carousel.removeChild(this.nav);
    }
    this.nav = document.createElement('div');
    this.nav.classList.add('carousel-nav');
    this.itemsGallery.forEach((el, index) => {
      if (this.settings.navType === 'dot') {
        this.newEl = document.createElement('div');
        this.newEl.dataset.numb = index;
      } else {
        this.newEl = el.cloneNode(true);
      }
      this.nav.appendChild(this.newEl);
    });
    this.carousel.appendChild(this.nav);
    if (this.settings.navType === 'dot') {
      this.itemsNav = this.nav.querySelectorAll('div');
    } else {
      this.itemsNav = this.nav.querySelectorAll('.carousel-item');
    }
  };

  // Инициализация кнопок карусели:

  this.initBtns = function() {
    if (this.imgCount <= this.visibleImg) {
      this.leftBtn.style.visibility = 'hidden';
      this.rightBtn.style.visibility = 'hidden';
      this.touchPrev = false;
      this.touchNext = false;
    }
    if (!this.settings.isInfinitie) {
      if (this.curImg == 0) {
        this.leftBtn.style.visibility = 'hidden';
        this.touchPrev = false;
      }
    }
  };

  // Переключение активности кнопок карусели:

  this.toggleDisplayBtns = function() {
    if (this.curImg == 0) {
      this.leftBtn.style.visibility = 'hidden';
      this.touchPrev = false;
    } else {
      this.leftBtn.style.visibility = 'visible';
      this.touchPrev = true;
    }
    if (this.imgCount - this.curImg == this.visibleImg) {
      this.rightBtn.style.visibility = 'hidden';
      this.touchNext = false;
    } else {
      this.rightBtn.style.visibility = 'visible';
      this.touchNext = true;
    }
  };

  // Запуск автоматической прокрутки:

  this.setAvtoScroll = function() {
    this.scrollTimeout = setTimeout(() => this.startMoveImg(this.settings.avtoDirection), this.settings.interval);
  };

  // Остановка автоматической прокрутки:

  this.stopAvtoScroll = function() {
    clearTimeout(this.scrollTimeout);
  };

  // Установка активной картинки по центру:

  this.setImgToCenter = function() {
    if (this.imgCount > 1) {
      this.numb = Math.floor(this.visibleImg / 2);
      this.direction = 'prev';
      this.copyImgs();
      this.removeImgs();
      this.offset = this.numb;
      if (this.visibleImg % 2 === 0) {
        this.galleryMargin = - ((this.itemWidth / 2) / (parseFloat(window.getComputedStyle(this.gallery).width)) * 100);
        this.gallery.style.marginLeft = this.galleryMargin + '%';
      }
    }
  }

  // Получение начальных координат тач-события:

  this.touchStart = function(event) {
    this.xCoord = event.touches[0].clientX;
  };

  // Получение конечных координат тач-события и запуск переключения изображений:

  this.touchEnd = function(event) {
    this.xDiff = event.changedTouches[0].clientX - this.xCoord;
    if (Math.abs(this.xDiff) > 15) {
      if (this.xDiff > 0 && this.touchPrev) {
        this.startMoveImg('prev', event);
      }
      if (this.xDiff < 0 && this.touchNext) {
        this.startMoveImg('next', event);
      }
    }
  };

  // Запуск переключения изображения:

  this.startMoveImg = function(direction, event) {
    if (this.isMoveSlide) {
      return;
    }
    if (this.settings.isAvtoScroll) {
      this.stopAvtoScroll();
    }

    this.curImg = parseInt(this.carousel.dataset.img, 10);
    this.itemWidth = parseFloat(window.getComputedStyle(this.gallery.querySelector('.carousel-item')).width);

    if (direction === 'prev' || direction === 'next') {
      this.direction = direction;
      this.numb = this.settings.toggleAmount;
      this.duration = this.settings.durationBtns;
      if (direction === 'prev') {
        this.targetImg = this.curImg - this.numb;
        if (this.settings.isInfinitie) {
          this.targetImg = this.targetImg < 0 ? this.imgCount + this.targetImg : this.targetImg;
        } else {
          this.targetImg = this.targetImg < 0 ? this.targetImg = 0 : this.targetImg;
        }
      }
      if (direction === 'next') {
        this.targetImg = this.curImg + this.numb;
        if (this.settings.isInfinitie) {
          this.targetImg = this.targetImg > this.imgCount - 1 ? this.targetImg - this.imgCount : this.targetImg;
        } else {
          this.targetImg = this.imgCount - this.targetImg < this.visibleImg ? this.targetImg - (this.visibleImg - (this.imgCount - this.targetImg)) : this.targetImg;
        }
      }
    } else {
      this.targetImg = parseInt(direction, 10);
      this.diffNum = this.targetImg - this.curImg;
      this.numb = Math.abs(this.diffNum);
      this.duration = this.settings.durationNav;
      if (this.diffNum < 0) {
        this.direction = 'prev';
        if (!this.settings.isInfinitie) {
          this.targetImg = this.targetImg < 0 ? this.targetImg = 0 : this.targetImg;
        }
      } else if (this.diffNum > 0) {
        this.direction = 'next';
        if (!this.settings.isInfinitie) {
          this.targetImg = this.imgCount - this.targetImg < this.visibleImg ? this.targetImg - (this.visibleImg - (this.imgCount - this.targetImg)) : this.targetImg;
        }
      } else {
        this.isMoveSlide = false;
        return;
      }
    }

    if (this.settings.isAnimate && (!event || event.type != 'mouseenter') && (!start || start == 0)) {
      this.moveAnimate();
    } else {
      start = null;
      this.move();
    }

    this.curImg = this.targetImg;
    this.carousel.dataset.img = this.curImg;

    if (this.settings.isNav) {
      this.toggleNav();
    }
    if (!this.settings.isInfinitie) {
      this.toggleDisplayBtns();
    }
    if (this.settings.isInfinitie && this.settings.isAvtoScroll) {
      this.setAvtoScroll();
    }
  };

  // Переключение изображений бесконечной карусели:

  this.moveAnimate = function() {
    this.isMoveSlide = true;
    if (this.curImg == this.targetImg) {
      return;
    }
    var this$ = this;
    if (this.settings.isInfinitie) {
      if (this.direction == 'prev') {
        this.copyImgs();
        this.gallery.style.marginLeft = `calc(${this.galleryMargin}% - ${this.itemWidth * this.numb}px)`;
        window.getComputedStyle(this.gallery).marginLeft;
        this.gallery.style.transition = 'margin-left ' + this.duration + 'ms ' + this.settings.animateFunc;
        this.gallery.style.marginLeft = this.galleryMargin + '%';
        setTimeout(function() {
          this$.gallery.style.transition = 'none';
          this$.removeImgs();
          this$.isMoveSlide = false;
        }, this.duration);
      }
      if (this.direction == 'next') {
        this.copyImgs();
        this.gallery.style.marginLeft = `calc(${this.galleryMargin}% - ${this.itemWidth * this.numb}px)`;
        this.gallery.style.transition = 'margin-left ' + this.duration + 'ms ' + this.settings.animateFunc;
        setTimeout(function() {
          this$.gallery.style.transition = 'none';
          this$.removeImgs();
          this$.gallery.style.marginLeft = this$.galleryMargin + '%';
          this$.isMoveSlide = false;
        }, this.duration);
      }
    } else {
      this.gallery.style.marginLeft = -(this.itemWidth * this.targetImg) + 'px';
      this.gallery.style.transition = 'margin-left ' + this.duration + 'ms ' + this.settings.animateFunc;
      setTimeout(function() {
        this$.gallery.style.transition = 'none';
        this$.isMoveSlide = false;
      }, this.duration);
    }
  };

  // Переключение не зацикленной карусели:

  this.move = function() {
    if (this.curImg == this.targetImg) {
      return;
    }
    if (this.settings.isInfinitie) {
      this.copyImgs();
      this.removeImgs();
      window.getComputedStyle(this.gallery).marginLeft;
      this.gallery.style.marginLeft = this.galleryMargin + '%';
      this.isMoveSlide = false;
    } else {
      this.gallery.style.marginLeft = -(this.itemWidth * this.targetImg) + 'px';
      this.isMoveSlide = false;
    }
  };

  // Копирование изображений:

  this.copyImgs = function() {
    this.imgIndex = (this.curImg - this.offset) < 0 ? this.imgCount + (this.curImg - this.offset) : this.curImg - this.offset;
    this.i = 0;
    for (this.i ; this.i < this.numb; this.i++) {
      if (this.direction == 'prev') {
        this.imgIndex = this.imgIndex - 1 < 0 ? this.imgCount - 1 : this.imgIndex - 1;
      }
      if (this.direction == 'next') {
        if (this.i != 0) {
          this.imgIndex = this.imgIndex + 1 > this.imgCount - 1 ? 0 : this.imgIndex + 1;
        }
      }
      this.oldEl = this.itemsGallery[this.imgIndex];
      this.newEl = this.oldEl.cloneNode(true);
      if (this.direction == 'prev') {
        this.gallery.insertBefore(this.newEl, this.gallery.firstElementChild);
      }
      if (this.direction == 'next') {
        this.gallery.appendChild(this.newEl);
      }
      if (this.settings.isLoupe) {
        this.newEl.addEventListener('mouseenter', event => this.initLoupe(event));
        this.newEl.addEventListener('mousemove', event => this.moveLoupe(event));
        // this.newEl.addEventListener('mouseleave', event => this.closeLoupe(event));
      }
    }
  };

  // Удаление ранее скопированных изображений:

  this.removeImgs = function() {
    this.i = 0;
    for (this.i ; this.i < this.numb; this.i++) {
      if (this.direction == 'prev') {
        this.oldEl = this.gallery.lastElementChild;
      }
      if (this.direction == 'next') {
        this.oldEl = this.gallery.firstElementChild;
      }
      this.gallery.removeChild(this.oldEl);
    };
  };

  // Подсветка активной миниатюры / индикатора:

  this.toggleNav = function() {
    this.itemsNav.forEach(item => item.classList.remove('active'));
    this.imgIndex = this.curImg;
    if (this.settings.isCenter) {
      this.itemsNav[this.imgIndex].classList.add('active');
    } else {
      this.i = 0;
      for (this.i ; this.i < this.visibleImg; this.i++) {
        if (this.i != 0) {
          if (this.settings.isInfinitie) {
            this.imgIndex = this.imgIndex + 1 > this.imgCount - 1 ? 0 : this.imgIndex + 1;
          } else {
            this.imgIndex = this.imgIndex + 1;
          }
        }
        this.itemsNav[this.imgIndex].classList.add('active');
      }
    }
  };

  // Создание лупы:

  this.createLoupe = function() {
    if (this.settings.isLoupeOutside && document.body.querySelector('.loupe')) {
      document.body.removeChild(document.body.querySelector('.loupe'));
    }
    this.loupe = document.createElement('div');
    this.loupe.classList.add('loupe');
    this.bigImg = document.createElement('img');
    this.bigImg.classList.add('big-img');
    this.loupe.appendChild(this.bigImg);
    this.loupe.addEventListener('mousemove', event => this.moveLoupe(event));
    this.loupe.addEventListener('mouseleave',  () => this.closeLoupe());
    this.loupe.style.display = 'none';
    this.loupe.style.opacity = '0';
    if (this.settings.isLoupeOutside) {
      this.loupe.style.zIndex = '1000';
      this.loupe.style.borderRadius = '50%';
      document.body.appendChild(this.loupe);
    } else {
      this.galleryWrap.appendChild(this.loupe);
    }
  };

  // Инициализация изображения для лупы:

  this.initLoupe = function(event) {
    if ('ontouchstart' in window) {
      return;
    }
    if (this.img != event.currentTarget.querySelector('img')) {
			this.loupe.style.opacity = '0';
			this.img = event.currentTarget.querySelector('img');
      this.bigImg.src = this.img.dataset.src ? this.img.dataset.src : this.img.src ;
      this.bigImg.addEventListener('load', () => this.loupe.style.opacity = '1');
		}

    this.imgDimentions = this.img.getBoundingClientRect();
    this.galleryDimentions = this.galleryWrap.getBoundingClientRect();
    this.imgWidth = this.imgDimentions.width;
    this.imgHeight = this.imgDimentions.height;
    this.halfImgWidth = this.settings.loupeWidth / 2;
    this.halfImgHeight = this.settings.loupeHeight / 2;

    if (this.settings.isLoupeOutside) {
      this.loupe.style.width = this.settings.loupeWidth + 'px';
      this.loupe.style.height = this.settings.loupeHeight + 'px';
      this.loupe.style.backgroundColor = 'rgba(85,85,85, 0.25)';
    } else {
      this.loupe.style.width = this.imgWidth + 'px';
      this.loupe.style.height = this.imgHeight + 'px';
    }
    this.bigImg.style.width = this.imgWidth * 2 + 'px';
    this.bigImg.style.height = this.imgHeight * 2 + 'px';
  };

  // Работа лупы:

  this.moveLoupe = function(event) {
    var this$ = this;
    if ('ontouchstart' in window) {
      return;
    }
    if (this.isMoveSlide) {
      return;
    }
    this.imgDimentions = this.img.getBoundingClientRect();
    this.galleryDimentions = this.galleryWrap.getBoundingClientRect();
    this.offsetX = ((event.clientX - this.imgDimentions.left) / this.imgWidth);
    this.offsetY = ((event.clientY - this.imgDimentions.top) / this.imgHeight);

    if (event.clientX > this.imgDimentions.left + this.imgWidth ||
        event.clientX < this.imgDimentions.left ||
        event.clientY > this.imgDimentions.top + this.imgHeight ||
        event.clientY < this.imgDimentions.top) {
      this.loupe.style.display = 'none';
      return;
    }
    this.loupe.style.display = 'block';
    if (this.bigImg.clientHeight < 0) {
      this.loupe.style.opacity = '0';
    } else {
      setTimeout(() => this$.loupe.style.opacity = '1', 500);
    }

    if (this.settings.isLoupeOutside) {
      this.loupe.style.left = event.clientX  - this.halfImgWidth + 'px';
      this.loupe.style.top = event.clientY - this.halfImgHeight + 'px';
      this.bigImg.style.left = -(this.offsetX * this.bigImg.clientWidth - this.halfImgWidth) + 'px';
      this.bigImg.style.top = -(this.offsetY * this.bigImg.clientHeight - this.halfImgHeight) + 'px';
    } else {
      this.loupe.style.left = this.imgDimentions.left - this.galleryDimentions.left + 'px';
      this.loupe.style.top = this.imgDimentions.top - this.galleryDimentions.top + 'px';
      this.bigImg.style.left = -(this.offsetX * this.bigImg.clientWidth - this.offsetX * this.imgWidth) + 'px';
      this.bigImg.style.top = -(this.offsetY * this.bigImg.clientHeight - this.offsetY* this.imgHeight) + 'px';
    }
  };

  // Закрытие лупы:

  this.closeLoupe = function() {
    this.loupe.style.display = 'none';
  };

  // Инициализация карусели:

  this.initCarousel = function() {
    if (start && start === 0) {
      start = null;
    }
    this.carousel.dataset.img = 0;
    for (this.i = 0; this.i < this.imgCount; this.i++) {
      this.itemsGallery[this.i].dataset.numb = this.i;
    }
    if (this.carouselType) {
      var newSettings = window[this.carouselType + 'Carousel'];
      for (var key in newSettings) {
        this.settings[key] = newSettings[key];
      }
    }
    if (this.settings.toggleAmount > this.visibleImg) {
      this.settings.toggleAmount = this.visibleImg;
    }
    this.initBtns();
    if (this.imgCount < 2) {
      this.settings.isNav = false;
    }
    if (this.settings.isInfinitie && this.settings.isCenter) {
      this.setImgToCenter();
    }
    if (this.settings.isNav) {
      this.createNav();
    }
    if (this.settings.isLoupe) {
      this.createLoupe();
    }
    if (start > 0 && start < this.imgCount) {
      this.startMoveImg(start);
    } else {
      if (this.settings.isNav) {
        this.toggleNav();
      }
      if (this.settings.isInfinitie && this.settings.isAvtoScroll) {
        this.setAvtoScroll();
      }
    }

    this.setEventListeners();
    this.carousel.style.visibility = 'visible';
  };

  // ЗАПУСК ИНИЦИАЛИЗАЦИИ:

  this.initCarousel();
}
