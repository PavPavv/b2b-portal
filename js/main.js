'use strict';

//=====================================================================================================
// Полифиллы:
//=====================================================================================================

(function() {
  // проверяем поддержку
  if (!Element.prototype.closest) {
    // реализуем
    Element.prototype.closest = function(css) {
      var node = this;
      while (node) {
        if (node.matches(css)) {
          return node;
        } else {
          node = node.parentElement;
        }
      }
      return null;
    };
  }
})();

//=====================================================================================================
// Первоначальные данные для работы:
//=====================================================================================================

// Константы:

var website = document.body.dataset.website,
    pageId = document.body.id,
    isCart = document.body.dataset.cart,
    urlRequest = {
      main: 'https://new.topsports.ru/api.php',
      new: 'https://new.topsports.ru/',
      api: 'https://api.topsports.ru/'
    },
    loader,
    alerts,
    upBtn,
    items;

// Динамически изменяемые переменные:

var pageUrl = pageId,
    currentElem = null,
    tooltip = null,
    scrollTop;

if (isCart) {
  var cartId = pageId,
      cartTotals = [],
      cart = {},
      userData = {};
}

// Настройки каруселей:

var fullCardCarousel = {
  isNav: true,
  durationNav: 400,
  isLoupe: true
};

var fullImgCarousel = {
  isNav: true,
  navType: 'dot',
  durationNav: 400
};

// Используемые для проверки регулярные выражения:

var cyrilRegExp = /^[АаБбВвГгДдЕеЁёЖжЗзИиЙйКкЛлМмНнОоПпРрСсТтУуФфХхЦцЧчШшЩщЭэЮюЯя][АаБбВвГгДдЕеЁёЖжЗзИиЙйКкЛлМмНнОоПпРрСсТтУуФфХхЦцЧчШшЩщъыьЭэЮюЯя]+$/;
var emailRegExp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
var dateRegExp = /^(((0[1-9]|[12]\d|3[01])\/(0[13578]|1[02])\/((19|[2-9]\d)\d{2}))|((0[1-9]|[12]\d|30)\/(0[13456789]|1[012])\/((19|[2-9]\d)\d{2}))|((0[1-9]|1\d|2[0-8])\/02\/((19|[2-9]\d)\d{2}))|(29\/02\/((1[6-9]|[2-9]\d)(0[48]|[2468][048]|[13579][26])|((16|[2468][048]|[3579][26])00))))$/;
var telRegExp = /^([\+]*[7|8])(\(*\d{3}\)*)(\d{3}-*)(\d{2}-*)(\d{2})$/;
var finTelRegExp = /^\+[7]\s\(\d{3}\)\s\d{3}\-\d{2}\-\d{2}$/;
var nicknameRegExp =/^\w+@*\w+\.*\w*$/;
var nameRegExp = /^[a-zA-Z ]|[АаБбВвГгДдЕеЁёЖжЗзИиЙйКкЛлМмНнОоПпРрСсТтУуФфХхЦцЧчШшЩщъыьЭэЮюЯя ]{2,30}$/;

// Запускаем рендеринг страницы:

startPage();

//=====================================================================================================
// Обязательные функции для всех страниц:
//=====================================================================================================

// Запуск страницы:

function startPage() {
  addModules();
  setPaddingToBody();
  window.addEventListener('resize', setPaddingToBody);
  if (isCart) {
    window.addEventListener('focus', updateCartTotals);
    getTotals()
    .then(result => {
      renderTotals();
    }, reject => {
      console.log(reject);
      renderTotals();
    });
  }
}

// Выход из авторизации:

function logOut(event) {
  event.preventDefault();
  sendRequest(urlRequest.main, {action: 'logout'})
  .then(result => {
    clearLocal();
    document.location.href = '/';
  })
}

// Отображение/скрытие мобильного меню (адаптивного хедера):

function toggleMobMenu() {
  getEl('#header').classList.toggle('mobile');
  getEl('#mob-menu').classList.toggle('active');
}

//=====================================================================================================
// Построение страницы:
//=====================================================================================================

// Добавление обязательных модулей при загрузке страницы:

function addModules(path) {
  if (getEl('#modules')) {
    return;
  }
  var path = location.pathname.replace('index.html', '').replace(/\//g, ''),
      url = (path === '' || path === 'registr') ? '../modules/modules_short.html' : '../modules/modules_full.html',
      modules = document.createElement('div');
  modules.id = 'modules';
  modules.dataset.html = url;
  document.body.insertBefore(modules, document.body.firstChild);
  includeHTML();
  if (path !== '' && path !== 'registr') {
    initModules();
    loader.show();
  }
}

// Добавление html из других файлов:

function includeHTML(target) {
  var url;
  if (target) {
    target = getEl(target);
    url = target.dataset.html;
    loadHTML(target, url);
  } else {
    document.body.querySelectorAll('[data-html]').forEach(el => {
      url = el.dataset.html;
      loadHTML(el, url);
    });
  }
}

// Непосредственно получение и вставка html:

function loadHTML(target, url) {
  target = getEl(target);
  if (!target || !url) {
    return;
  }
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url , false);
  try {
    xhr.send();
    if (xhr.status != 200) {
      console.log(`Ошибка ${xhr.status}: ${xhr.statusText}`);
      new Error(`Ошибка ${xhr.status}: ${xhr.statusText}`);
    } else {
      if (xhr.response) {
        target.innerHTML = xhr.responseText;
        target.removeAttribute('data-html');
      }
    }
  } catch(err) {
    console.log(err);
  }
}

//=====================================================================================================
// Инициализация модулей страницы:
//=====================================================================================================

// Запуск инициализации всех имеющихся модулей страницы:

function initModules() {
  fillUserInfo();
  initNotifications();
  initLoader();
  initAlerts();
  initUpBtn();
  initTooltips();
  initPopUps();
  initInputFiles();
}

// Вывод информации о пользователе в шапке страницы:

function fillUserInfo() {
  if (window.userInfo) {
    fillTemplate({
      area: '#profile',
      items: {
        login: userInfo.login,
        username: userInfo.name + ' ' + userInfo.lastname
      }
    });
    fillTemplate({
      area: '#mob-profile',
      items: {
        login: userInfo.login,
        username: userInfo.name + ' ' + userInfo.lastname
      }
    });
  } else {
    // if (location.pathname !== '/') {
    //   location.href = '/';
    // }
  }
}

//=====================================================================================================
// Запросы на сервер:
//=====================================================================================================

// Отправка запросов на сервер:

function sendRequest(url, data, type = 'application/json; charset=utf-8') {
  return new Promise((resolve, reject) => {
    var request = new XMLHttpRequest();
    request.addEventListener('error', () => reject(new Error('Ошибка сети')));
    request.addEventListener('load', () => {
      if (request.status !== 200) {
        reject(new Error(request.status + ':' + request.statusText));
      }
      resolve(request.response);
    });
    if (data) {
      if (type === 'application/json; charset=utf-8') {
        data = JSON.stringify(data);
      }
      request.open('POST', url);
      request.setRequestHeader('Content-type', type);
      request.send(data);
    } else {
      request.open('GET', url);
      request.send();
    }
  });
}

// Получение данных об итогах всех корзин с сервера:

function getTotals() {
  return new Promise((resolve, reject) => {
    sendRequest(urlRequest.main, {action: 'get_total'})
    // sendRequest('../json/cart_totals_data.json')
    .then(
      result => {
        if (!result || JSON.parse(result).err) {
          reject('Итоги не пришли');
        }
        if (JSON.stringify(cartTotals) === result) {
          reject('Итоги не изменились');
        } else {
          console.log('Итоги обновились');
          cartTotals = JSON.parse(result);
          resolve();
        }
      }
    )
    .catch(error => {
      reject(error);
    })
  });
}

// Получение данных конкретной корзины с сервера:

function getCart() {
  return new Promise((resolve, reject) => {
    sendRequest(urlRequest.main, {action: 'get_cart', data: {cart_type: cartId}})
    // sendRequest(`../json/cart_${document.body.id}_data.json`)
    .then(
      result => {
        if (!result || JSON.parse(result).err) {
          reject('Корзина и данные для заказа не пришли');
        }
        result = JSON.parse(result);
        if (!result.cart || result.cart === null) {
          result.cart = {};
        }
        if (JSON.stringify(cart) === JSON.stringify(result.cart)) {
          if (JSON.stringify(userData.contr) !== JSON.stringify(result.user_contr) || JSON.stringify(userData.address) !== JSON.stringify(result.user_address_list)) {
            console.log('Адреса или контрагенты обновились');
            userData.contr = result.user_contr,
            userData.address = result.user_address_list;
            resolve();
          } else {
            reject('Корзина не изменилась');
          }
        } else {
          console.log('Корзина обновилась');
          cart = result.cart;
          userData.contr = result.user_contr,
          userData.address = result.user_address_list;
          resolve('cart');
        }
      }
    )
    .catch(error => {
      reject(error);
    })
  });
}

// Получение данных о товарах/товаре по id:

function getItems(id) {
  return new Promise((resolve, reject) => {
    var data = {
      action: 'items',
      data: {cat_type: cartId}
    }
    if (id) {
      data.data.list = id;
    }
    sendRequest(urlRequest.main, data)
    .then(result => {
      var data = JSON.parse(result);
      resolve(data);
    })
    .catch(error => {
      console.log(error);
      reject(error);
    })
  });
}

// Получение данных о товаре по артикулу:

function getItem(articul) {
  return new Promise((resolve, reject) => {
    var data = {
      action: 'item',
      data: {articul: articul}
    }
    sendRequest(urlRequest.main, data)
    .then(result => {
      var data = JSON.parse(result);
      console.log(data);
      resolve(data);
    })
    .catch(error => {
      console.log(error);
      reject(error);
    })
  });
}

//=====================================================================================================
// Работа с данными корзины:
//=====================================================================================================

// Обновление итогов корзины при возвращении на страницу:

function updateCartTotals() {
  getTotals()
  .then(result => {
    renderTotals();
  }, reject => {
    console.log(reject);
  });
}

// Создание списков каталогов и корзин в шапке сайта:

function renderTotals() {
  if (!isCart || !cartTotals.length) {
    return;
  }

  renderCartInHeader('#header-cart', 'cart');
  renderCartInHeader('#catalogs', 'catalogs');
  renderCartInHeader('#mob-catalogs', 'catalogs');
}

// Создание списка каталогов/корзин в шапке сайта:

function renderCartInHeader(area, type) {
  area = getEl(area);
  if (!area) {
    return;
  }
  var data = getDataFromTotals(type);
  fillTemplate({
    area: area,
    items: data,
    sub: type === 'cart' ? [{area: '.item', items: 'items'}] : null
  });
}

// Подготовка данных для создания списка каталогов/корзин:

function getDataFromTotals(type) {
  var data = JSON.parse(JSON.stringify(cartTotals)),
      sum = 0;
  data.forEach((el, index) => {
    if (!el.id) {
      data.splice(index, 1);
      return;
    }
    if (el.qty > 0) {
      el.isFull = 'full';
      if (el.qty > 99) {
        el.qty = type === 'cart' ? '99' : '99+';
      }
    } else {
      el.isFull = '';
    }

    if (type === 'cart') {
      sum += el.sum;
    }
    el.sum = convertPrice(el.sum, false);
    if (document.body.id && document.body.id === el.id) {
      el.isFunc = 'openPage(event)';
      if (type === 'cart') {
        data.unshift(data.splice(index, 1)[0]);
      }
    } else {
      el.isFunc = '';
    }
  });
  if (type === 'cart') {
    data = {
      sum: convertPrice(sum, false),
      items: data
    };
  }
  return data;
}

//=====================================================================================================
// Работа со storage и cookie:
//=====================================================================================================

// Получение данных о странице по ключу:

function getInfo(key, type = 'localStorage') {
  var info = getFromLocal(key, type);
  return info[key];
}

// Сохранение данных о странице по ключу:

function saveInfo(key, data, type = 'localStorage') {
  var info = getFromLocal(key, type);
  info[key] = data;
  saveInLocal(info, type);
}

// Удаление всех данных о странице по ключу:

function removeInfo(key, type = 'localStorage') {
  var info = getFromLocal(key, type);
  info[key] = {};
  saveInLocal(info, type);
}

// Сохранение данныx в storage или cookie:

function saveInLocal(data, type) {
  var stringData = JSON.stringify(data);
  if (storageAvailable(type)) {
    window[type][website] = stringData;
  }
  else {
    if (getCookie(website)) {
      deleteCookie(website);
    }
    setCookie(website, stringData);
  }
}

// Получение данных из storage или cookie:

function getFromLocal(key, type) {
  var info = {};
  if (storageAvailable(type)) {
    if (window[type][website]) {
      try {
        info = JSON.parse(window[type][website]);
      } catch(error) {
        console.log(error);
      }
    }
  }
  else {
    if (getCookie(website)) {
      try {
        info = JSON.parse(getCookie(website));
      } catch(error) {
        console.log(error);
      }
    }
  }
  if (!info[key]) {
    info[key] = {};
  }
  return info;
}

// Очистка данных storage и cookie:

function clearLocal() {
  window.localStorage.clear();
  window.sessionStorage.clear();
  if (getCookie(website)) {
    deleteCookie(website);
  }
}

// Проверка доступности storage:

function storageAvailable(type) {
  var storage, test;
	try {
		storage = window[type];
    test = '__storage_test__';
		storage.setItem(test, test);
		storage.removeItem(test);
		return true;
	}
	catch(error) {
		return false;
	}
}

// Сохранение данных в cookie:

function saveCookie(key, data) {
  var stringData = JSON.stringify(data);
  if (getCookie(key)) {
    deleteCookie(key);
  }
  setCookie(key, stringData);
}

// Получение данных из cookie:

function readCookie(key) {
  var info;
  if (getCookie(key)) {
    try {
      info = JSON.parse(getCookie(key));
    } catch(error) {
      console.log(error);
    }
  }
  return info;
}

// Запись cookie:

function setCookie(key, value, options = {}) {
  options = {
    path: '/',
    expires: getDateExpires(30),
    ...options
  };
  var expires = options.expires;

  if (typeof expires == "number" && expires) {
    var date = new Date();
    date.setTime(date.getTime() + expires * 1000);
    expires = options.expires = date;
  }
  if (expires && expires.toUTCString) {
    options.expires = expires.toUTCString();
  }

  value = encodeURIComponent(value);
  var updatedCookie = key + '=' + value;

  for (let key in options) {
    updatedCookie += "; " + key;
    var propValue = options[key];
    if (propValue !== true) {
      updatedCookie += "=" + propValue;
    }
  }
  document.cookie = updatedCookie;
}

// Функция для установки срока хранения cookie:

function getDateExpires(days) {
  var date = new Date;
  date.setDate(date.getDate() + days);
  return date;
}

// Чтение cookie:

function getCookie(key) {
  var matches = document.cookie.match(new RegExp(
    '(?:^|; )' + key.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'
  ));
  return matches ? decodeURIComponent(matches[1]) : undefined;
}

// Удаление cookie:

function deleteCookie(key) {
  setCookie(key, '', {expires: -1});
}

//=====================================================================================================
// Функции для работы с контентом на странице:
//=====================================================================================================

// Установка отступов документа:

function setPaddingToBody() {
  var headerHeight = getEl('#header').clientHeight;
  var footerHeight = getEl('#footer').clientHeight;
  document.body.style.paddingTop = `${headerHeight}px`;
  document.body.style.paddingBottom = `${footerHeight + 20}px`;
}

// Проверка загруженности всех изображений карусели и отображение карусели:

function renderCarousel(carousel, curImg = 0) {
  return new Promise((resolve, reject) => {
    var imgs = carousel.querySelectorAll('img');

    imgs.forEach((img, index) => {
      if (index === imgs.length - 1) {
        img.addEventListener('load', () => {
          setTimeout(() => render(carousel), 100);
        });
        img.addEventListener('error', () => {
          img.parentElement.remove();
          setTimeout(() => render(carousel), 100);
        });
      } else {
        img.addEventListener('error', () => {
          img.parentElement.remove();
        });
      }
    });

    function render(carousel) {
      if (carousel.querySelectorAll('img').length === 0) {
        getEl('.carousel-gallery', carousel).insertAdjacentHTML('beforeend', '<div class="carousel-item"><img src="../img/no_img.jpg"></div>');
        startCarouselInit(carousel, curImg);
      }
      startCarouselInit(carousel, curImg);
      resolve('карусель готова');
    }
  });
}

// Проверка загружено ли изображение и вставка заглушки при отсутствии изображения:

function checkImg(element) {
  getEl('img', element).addEventListener('error', (event) => {
    event.currentTarget.src = '../img/no_img.jpg';
  });
}

// Показ элемента:

function showElement(el, style = 'block') {
  el = getEl(el);
  if (el) {
    el.style.display = style;
  }
}

// Скрытие элемента:

function hideElement(el) {
  el = getEl(el);
  if (el) {
    el.style.display = 'none';
  }
}

// Получение текущей прокрутки документа:

function getDocumentScroll() {
  scrollTop = window.pageYOffset || document.documentElement.scrollTop;
}

// Установка прокрутки документа:

function setDocumentScroll(top = scrollTop) {
  document.documentElement.scrollTop = top;
  document.body.scrollTop = top;
}

// Удаление значения из инпута при его фокусе:

function onFocusInput(input) {
  if (input.value != '') {
    input.value = '';
  }
}

// Возвращение значения в инпут при потере им фокуса:

function onBlurInput(input) {
  input.value = input.dataset.value;
}

// Отображение количества знаков, оставшихся для заполнения в textarea:

function textareaCounter(textarea) {
  var maxLength = textarea.getAttribute('maxlength');
  if (maxLength) {
    var counter = getEl(`[data-count="${textarea.getAttribute('name')}"] span`);
    if (counter) {
      counter.textContent = parseInt(maxLength, 10) - textarea.value.length;
    }
  }
}

//=====================================================================================================
// Функции сворачивания/разворачивания контейнеров:
//=====================================================================================================

// Свернуть/развернуть контейнер:

function toggleEl(el, className = 'close') {
  el = getEl(el);
  if (el) {
    el.classList.toggle(className);
  }
}

// Свернуть/развернуть содержимое контейнера:

function switchContent(event) {
  var container = event.currentTarget.closest('.switch');
  if (!container || container.classList.contains('disabled')) {
    return;
  }
  var toggleIcon = getEl('.switch-icon', container);
  if (!toggleIcon || getComputedStyle(toggleIcon).display === 'none') {
    return;
  }
  container.classList.toggle('close');
  if (container.id && container.classList.contains('save')) {
    if (container.classList.contains('close')) {
      savePosition(container.id, 'close');
    } else {
      savePosition(container.id, 'open');
    }
  }
}

// Сохранение данных о состоянии контейнера (открыт/закрыт):

function savePosition(key, value) {
  var positions = getInfo('positions', 'sessionStorage');
  if (!positions[pageUrl]) {
    positions[pageUrl] = {};
  }
  positions[pageUrl][key] = value;
  saveInfo('positions', positions, 'sessionStorage');
}

// Удаление данных о состоянии контейнеров (открыты/закрыты):

function removePositions() {
  var positions = getInfo('positions', 'sessionStorage');
  positions[pageUrl] = {};
  saveInfo(`positions`, positions, 'sessionStorage');
}

// Проверка сохраненных положений контейнеров (открыты/закрыты):

function checkPositions() {
  var positions = getInfo('positions', 'sessionStorage')[pageUrl],
      el;
  for (var key in positions) {
    el = getEl(key);
    if (el) {
      if (positions[key] === 'close') {
        el.classList.add('close');
      } else {
        el.classList.remove('close');
      }
    }
  }
}

//=====================================================================================================
// Вспомогательные функции:
//=====================================================================================================

// Получение элемента по id или селектору:

function getEl(el, area = document) {
  if (typeof el === 'string') {
    el = el.trim();
    area = typeof area === 'string' ? getEl(area): area;
    var wordCount = el.split(' ');
    if (el[0] === '#' && wordCount.length === 1) {
      el = document.getElementById(el.substr(1));
    } else {
      el = area.querySelector(el);
    }
  }
  return el || undefined;
}

// Проверка пустой ли объект:

function isEmptyObj(obj) {
  if (Object.keys(obj).length) {
    return false;
  }
  return true;
}

// Нахождение суммы элементов массива:

function arraySum(arr) {
  var sum = 0;
  for (var i = 0; i < arr.length; i++) {
    sum += arr[i];
  }
  return sum;
}

// Получение сколько процентов составляет часть в целом:

function getPercent(item, all) {
  if (!item) {
    return 0;
  }
  return parseInt(+item) * 100 / all;
}

// Изменение первой буквы строки на заглавную:

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Изменение свойств css непосредственно в css-документе:

function changeCss(selector, key, value) {
  var docStyles = Array.from(document.styleSheets),
      docPath = location.href.replace('index.html', '').replace(/\?.*/gi, '') + 'index.css',
      curStyle = docStyles.find(el => el.href === docPath);
  if (curStyle) {
    var rules = curStyle.cssRules || curStyle.rules,
        rule;
    for (var el of rules) {
      if (el.selectorText === selector) {
        rule = el;
        break;
      }
    }
    if (!rule) {
      curStyle.insertRule(selector + '{}', curStyle.rules.length);
      rule = rules[rules.length - 1];
    }
    if (Array.isArray(key)) {
      key.forEach(curKey => rule.style[curKey] = value);
    } else if (typeof key === 'string') {
      rule.style[key] = value;
    }
  }
}

// Ограничение частоты вызова функций:

function throttle(callback) {
  let isWaiting = false;
    return function () {
    if (!isWaiting) {
      callback.apply(this, arguments);
      isWaiting = true;
      requestAnimationFrame(() => {
        isWaiting = false;
    });
    }
  }
}

// Динамическая загрузка скриптов:

function loadScript(url) {
  return new Promise((resolve, reject) => {
    var script = document.createElement('script');
    script.src = url;
    script.onload = resolve();
    script.onerror = reject();
    document.body.appendChild(script);
  });
}

//=====================================================================================================
// Сортировка массива объектов:
//=====================================================================================================

// Сортировка массива объектов по указанному полю:

function sortBy(key, type) {
  var sortOrder = 1;
  if (key[0] === "-") {
      sortOrder = -1;
      key = key.substr(1);
  }

  function getValue(item) {
    var value = item[key];
    if (value === '&ndash;') {
      return null;
    }
    switch (type) {
      case 'text':
        return '' + value;
      case 'numb':
        value = value.replace(/\s/, '').replace(/\u00A0/g, '');
        return parseFloat(value);
      case 'date':
        return getDateObj(value, 'dd.mm.yy');
    }
  }

  var result;
  return function (a, b) {
    a = getValue(a);
    b = getValue(b);
    switch (type) {
      case 'text':
        result = (a < b) ? -1 : (a > b) ? 1 : 0;
        break;
      case 'numb':
        result = a - b;
        break;
      case 'date':
        result = b - a;
        break;
    }
    return result * sortOrder;
  }
}

//=====================================================================================================
// Сортировка объектов:
//=====================================================================================================

// Сортировка по ключу:

function sortObjByKey(obj, type = 'string') {
  var arrayObj = Object.keys(obj),
      sortedObj = {};
  switch (type) {
    case 'string':
      arrayObj = arrayObj.sort();
      break;
    case 'number':
      arrayObj = arrayObj.sort((a,b) =>  a - b);
      break;
    case 'number from string':
      arrayObj = arrayObj.sort((a,b) => parseInt(a, 10) - parseInt(b, 10));
      break;
  }
  arrayObj.forEach(key => sortedObj[key] = obj[key]);
  return sortedObj;
}

// Сортировка по значению:

function sortObjByValue(obj, type = 'string') {
  var arrayObj = Object.keys(obj),
      sortedObj = {};
  switch (type) {
    case 'string':
      arrayObj = arrayObj.sort((a,b) => {
        if (obj[a] < obj[b]) {
          return -1;
        }
        if (obj[a] > obj[b]) {
          return 1;
        }
        return 0;
      });
    case 'number':
      arrayObj = arrayObj.sort((a,b) => obj[a] - obj[b]);
      break;
    case 'number from string':
      arrayObj = arrayObj.sort((a,b) => parseInt(obj[a], 10) - parseInt(obj[b], 10));
      break;
  }
  arrayObj.forEach(key => sortedObj[key] = obj[key]);
  return sortedObj;
}

//=====================================================================================================
// Работа с датами:
//=====================================================================================================

// Создание объекта даты из строки:

function getDateObj(value, format) {
  if (format === 'yy-mm-dd') {
    value = value.replace(/(\d+)-(\d+)-(\d+)/, '$2/$3/$1');
  } else if (format === 'dd.mm.yy'){
    value = value.replace(/(\d+).(\d+).(\d+)/, '$2/$1/$3');
  }
  return new Date(value);
}


// Проверка актуальности даты в периоде (принимает объекты даты):

function checkDate(date, start, end) {
  if (!start && !end) {
    return true;
  }
  if (!date) {
    date = new Date();
  }
  if (!start) {
    start = new Date();
    start.setDate(date.getDate() - 1);
  }
  if (!end) {
    end = new Date();
    end.setDate(date.getDate() + 1);
  }
  if (date > start && date < end) {
    return true;
  } else {
    return false;
  }
}

//=====================================================================================================
// Конвертирующие функции:
//=====================================================================================================

// Кросс-браузерная функция для получения символа из события keypress:

function getChar(event) {
  if (event.which == null) { // IE
    if (event.keyCode < 32) {
      return null; // спец. символ
    }
    return String.fromCharCode(event.keyCode);
  }
  if (event.which != 0 && event.charCode != 0) { // все кроме IE
    if (event.which < 32) {
      return null; // спец. символ
    }
    return String.fromCharCode(event.which); // остальные
  }
  return null; // спец. символ
}

// Конвертация всей вложенности свойств объекта в строку:

function convertToString(obj) {
  var objProps = '';
  crossObj(obj);
  return objProps;

  function crossObj(obj) {
    var prop;
    for (let k in obj) {
      prop = obj[k];
      if (typeof prop === 'string') {
        objProps += prop + ',';
      } else if (typeof prop === 'object') {
        crossObj(prop);
      }
    }
  }
}

// Выбор правильного склонения слова в соответствии с числительным:

function declOfNum(number, titles) {
  var cases = [2, 0, 1, 1, 1, 2];
  return titles[ (number%100>4 && number%100<20)? 2 : cases[(number%10<5)?number%10:5]];
}

// Функция преобразования цены к формату с пробелами:

function convertPrice(price, isFixed = true) {
  if (isNaN(Number(price))) {
    return price;
  }
  price = Number(price).toFixed(2);
  price = (price + '').replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, '$1 ');
  if (isFixed) {
    return price.replace('.', ',');
  } else {
    return price.replace(/\.\d\d/g, '');
  }
  // второй вариант (менее кросс-браузерный):
  // return Number(price).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Функция преобразования строки с годами к укороченному формату:

function convertYears(stringYears) {
  var years = stringYears.split(',');
  var resultYears = [];
  var curYear, nextYear, prevYear;

  if (years.length <= 2) {
    return stringYears.replace(/\,/gi, ', ');
  }

  for (let i = 0; i < years.length; i++) {
    curYear = parseInt(years[i].trim(), 10);
    nextYear = parseInt(years[i + 1], 10);
    prevYear = parseInt(years[i - 1], 10);

    if (curYear + 1 != nextYear) {
      if (i === years.length -  1) {
        resultYears.push(curYear);
      } else {
        resultYears.push(curYear + ', ');
      }
    } else if (curYear - 1 !== prevYear) {
      resultYears.push(curYear);
    } else if (curYear + 1 === nextYear && resultYears[resultYears.length - 1] !== ' &ndash; ') {
      resultYears.push(' &ndash; ');
    }
  }
  return resultYears = resultYears.join('');
}

//=====================================================================================================
// Переход на другие страницы:
//=====================================================================================================

// Переход на страницу заказа:

function showOrder(event, id) {
  if (event.target.closest('.download.icon')) {
    return;
  }
  window.open(`../order/?${id}`);
}

// Переход на страницу рекламации:

function showReclm(id) {
  location.href = '/reclamation/?recl_id=' + id;
}

//=====================================================================================================
// Универсальное заполнение данных по шаблону:
//=====================================================================================================

// В каком виде данные нужно передавать в функцию fillTemplate:
//
// * - обязательное поле, остальные можно пропускать
//
// var data = {
//   area *: элемент / селектор элемента,               Откуда будет браться шаблон, можно передать:
//                                                      - переменная, в которой хранится уже найденный в DOM элемент
//                                                      - селектор, по которому нужно найти элемент в DOM
//
//   items *: массив объектов / объект / массив         Данные для заполнения шаблона, они могут быть такие:
//                                                      - массив или объект с ключами 0,1,2.. содержащий массивы и/или объекты
//                                                      - объект (ключ: значение)
//                                                      - массив содержащий строки и/или цифры
//
//   type: 'list' / 'vars' / 'obj'                     Тип данных (по умолчанию - определится по типу переданных данных):
//                                                      - 'list' - массив или объект, содержащий массивы и/или объекты (для создания множества элементов на основе шаблона)
//                                                      - 'vars' - массив содержащий строки и/или цифры (для создания множества элементов на основе простейшего шаблона)
//                                                      - 'obj' - объект (ключ: значение) (для создания одного элемента на основе шаблон)
//
//    source: 'inner' / 'outer',                       Как получать шаблон из DOM (по умолчанию - 'inner'):
//                                                      - весь тег целиком, т.е. с помощью outerHTML
//                                                      - внутреннюю часть тега, т.е. с помощью innerHTML
//
//    target: селектор элемента,                       Куда нужно вставить шаблон (по умолчанию - data.area, т.е. туда, откуда взяли):
//                                                     - селектор области куда будет вставляться результат
//
//    sign: '#' / '@@' / другой,                       Символ для поиска мест замены в html (по умолчанию - '#'):
//                                                     - # (тогда в html прописываем #...#)
//                                                     - @@ (тогда в html прописываем @@...@@)
//                                                     - можно применять и другие символы
//
//    sub: [{                                          Данные о подшаблонах (по умолчанию подшаблонов нет).
//      area: селектор элемента                        Вносить только в виде массива объектов, даже если объект один.
//      items: название ключа из data.items            Каждый объект аналогичен объекту data, который мы сейчас учимся заполнять.
//      sub : (если есть подшаблон) [{                 Каждый объект содержит (обязательны только area и items):
//        area: id / селектор                          - area * - id или селектор, по которому нужно найти подшаблон в шаблоне
//        items: название ключа из sub.items           - items * - ключ, по которому в данных необходимо взять информацию для заполнения подшаблона
//      }],                                            - sub - если есть подшаблон у этого подшаблона, то здесь указывается такая же структура массива объектов
//      sign: '#' / '@@' / другой,                     - sign - cимвол для поиска места замены, если отличен от того, что в родительском шаблоне
//      iterate: 'temp' / 'data'                       - iterate - как производить перебор при замене, если метод отличен от метода в родительском шаблоне
//    }, {
//      area: id / селектор
//      items: название ключа из data.items
//    }...]
//
//    action: 'replace' / return',                     Действие с данными (по умолчанию - 'replace'):
//                                                     - replace - вставит заполненный шаблон на страницу
//                                                     - return - вернет строку с заполненным шаблоном
//
//    method: 'inner' /                                Метод вставки шаблона на страницу (по умолчанию - 'inner'):
//            'beforebegin' / 'afterbegin' /           - inner - замена содержимого елемента
//            'beforeend' / 'afterend'                 - beforebegin - до самого елемента (до открывающего тега)
//                                                     - afterbegin - перед первым потомком елемента
//                                                     - beforeend - после последнего потомка елемента
//                                                     - afterend - после самого елемента (после закрывающего тега)
//
//    iterate: 'temp' / 'data'                         Как производить перебор при замене данных в шаблоне (по умолчанию - 'temp'):
// }                                                   - перебором всех мест замены (#...#) в шаблоне:
//                                                       * берем каждое место замены
//                                                       * если в данных есть ключ с таким названием, то производим замену
//                                                       * удобно, если в данных много лишних ключей
//                                                     - перебором всех ключей в данных:
//                                                       * берем каждый ключ
//                                                       * если есть место замены с таким названием, то производим замену
//                                                       * удобно если в данных нет ничего лишнего, а места замены наоборот повторяют содержимое
//
//
// Пример данных:
//
// var data = {
//   area: 'big-card',
//   items: items,
//   type: 'list',
//   source: 'outer',
//   target: 'gallery',
//   sign: '#',
//   sub: [{
//     area: '.carousel-gallery',
//     items: 'images'
//   }, {
//     area: '.card-sizes',
//     items: 'sizes'
//   }, {
//     area: '.card-options',
//     items: 'options'
//   }, {
//     area: '.manuf-row',
//     items: 'manuf_table'
//   }],
//   action: 'replace',
//   method: 'inner'
//   iterate: 'temp'
// }

// Универсальная функция заполнения данных по шаблону:

function fillTemplate(data) {
  if (!data.area || !data.items) {
    return;
  }

  if (typeof data.area === 'string') {
    data.areaName = (data.parentAreaName || '') + data.area;
    data.area = getEl(data.area, data.parentArea);
  } else {
    data.areaName = data.area.id || data.area.classList[0];
  }

  var temp = window[`${data.areaName}Temp`]; // шаблон
  if (!temp) {
    if (!data.area) {
      if (data.parentTemp) {
        return data.parentTemp;
      }
      return;
    }
    if (data.source && data.source === 'outer') {
      temp = window[`${data.areaName}Temp`] = data.area.outerHTML;
    } else {
      temp = window[`${data.areaName}Temp`] = data.area.innerHTML;
    }
  }

  if (!data.sign) {
    data.sign = '#';
  }

  var txt = fillTemp(data, data.items, temp);
  if (data.parentTemp) {
    return data.parentTemp.replace(temp, txt);
  } else {
    if (data.action && data.action === 'return') {
      return txt;
    } else {
      var targetEl = data.area;
      if (data.target) {
        var target = getEl(data.target);
        if (target) {
          targetEl = target;
        }
      }
      insertText(targetEl, txt, data.method);
    }
  }
}

// Определение функции для замены данных:

function fillTemp(data, items, temp) {
  var txt = '';
  if (typeof items === 'object') { // данные - это всегда массив или объект
    if (data.type === 'list' || (items[0] && typeof items[0] === 'object')) { //данные - массив или объект, содержащий массивы и/или объекты
      txt = fillList(data, items, temp);
    } else if (data.type === 'vars' || Array.isArray(items)) { //данные - массив (строк или чисел)
      txt = fillList(data, items, temp);
    } else if (data.type === 'obj' || !Array.isArray(items)) { //данные - объект (ключ: значение)
      txt = fillEl(data, items, temp);
    }
  }
  return txt;
}

// Создание нескольких элементов на основе данных:

function fillList(data, items, temp) {
  var result = '',
      newEl;
  for (var arrKey in items) {
    newEl = fillEl(data, items[arrKey], temp);
    result += newEl;
  }
  return result;
}

// Создание одного элемента на основе данных:

function fillEl(data, items, temp) {
  if (data.sub) { // Если есть подшаблоны
    temp = fillSubTemp(data, items, temp);
  }

  if (typeof items === 'string' || typeof items === 'number') { //Данные - строка/число
    temp = replaceInTemp(null, items, temp, data.sign);
  } else if (data.iterate && data.iterate === 'data') {
    for (var key in items) {
      temp = replaceInTemp(key, items, temp, data.sign);
    }
  } else {
    var regEx = new RegExp(`${data.sign}[^${data.sign}]+${data.sign}`, 'gi'),
        props = temp.match(regEx);
    props = props || [];
    props = props.reduce((unique, el) => {
      var reg = new RegExp(`${data.sign}`, 'g');
      el = el.replace(reg, '');
      if (unique.indexOf(el) === -1) {
        unique.push(el);
      }
      return unique;
    }, []);
    props.forEach(key => temp = replaceInTemp(key, items, temp, data.sign));
  }
  return temp;
}


// Заполнение подшаблонов:

function fillSubTemp(data, items, temp) {
  var subData;
  for (var sub of data.sub) {
    subData = {
      area: sub.area,
      items: items[sub.items] ? items[sub.items] : [],
      sub: sub.sub,
      parentArea: data.area,
      parentAreaName: data.areaName,
      parentTemp: temp,
      type: sub.type,
      source: sub.source || 'outer',
      sign: sub.sign || data.sign,
      iterate: sub.iterate || data.iterate,
    };
    temp = fillTemplate(subData);
  }
  return temp;
}

// Подстановка данных в шаблон:

function replaceInTemp(key, items, temp, sign) {
  var value = key ? items[key] : items;
      value = value === null ? '' : value;
  if (value !== undefined && typeof value !== 'object') {
    var regex = new RegExp(sign + (key || 'item') + sign, 'gi');
    temp = temp.replace(regex, value);
  }
  return temp;
}

// Вставка заполненного шаблона в документ:

function insertText(target, txt, method = 'inner') {
  target.classList.remove('template');
  txt = txt.replace(/template/gi, '');
  if (!method || method === 'inner') {
    target.innerHTML = txt;
  } else {
    if ((method === 'afterbegin' || method === 'beforeend') && (target.childNodes.length === 1 && target.firstChild.classList.contains('template'))) {
      target.innerHTML = txt;
    }
    target.insertAdjacentHTML(method, txt);
  }
}

//=====================================================================================================
// Функции степпера:
//=====================================================================================================

// Запрет на ввод в инпут любого значения кроме цифр:

function onlyNumb(event) {
  if (event.ctrlKey || event.altKey || event.metaKey) {
    return;
  }
  var chr = getChar(event);
  if (chr == null) {
    return;
  }
  if (chr < '0' || chr > '9') {
    return false;
  }
}

// Изменение количества степпером:

function changeQty(event, maxQty, minQty = 0) {
  if (minQty === maxQty) {
    return;
  }
  var current = event.currentTarget;
  if (current.closest('.qty-box.disabled')) {
    return;
  }
  var sign = undefined,
      qtyWrap = current.closest('.qty'),
      input = getEl('.choiced-qty', qtyWrap),
      qty = parseInt(input.value, 10);
  if (input.hasAttribute('disabled')) {
    return;
  }
  if (event.currentTarget.classList.contains('minus')) {
    sign = '-';
  }
  if (event.currentTarget.classList.contains('plus')) {
    sign = '+';
  }
  qty = countQty(sign, qty, maxQty, minQty);
  input.value = qty;
  input.dataset.value = qty;
  changeColors(qtyWrap, qty);
  return qty;
}

// Подсчет количества:

function countQty(sign, qty, maxQty, minQty) {
  if (sign) {
    if (sign == '-') {
      if (qty > minQty) {
        qty--;
      }
    } else if (sign == '+') {
      if (qty < maxQty) {
        qty++;
      }
    } else if (sign == 'Удалить') {
      qty = 0;
    } else {
      qty = 1;
    }
  } else {
    if (isNaN(qty)) {
      qty = minQty;
    }
    if (qty < minQty) {
      qty = minQty;
    }
    if (qty > maxQty) {
      qty = maxQty;
    }
  }
  return qty;
}

// Изменение цвета элементов степпера:

function changeColors(el, qty) {
  if (el) {
    if (qty == 0) {
      el.classList.remove('added');
    } else {
      el.classList.add('added');
    }
  }
}

//=====================================================================================================
// Работа всплывающих подсказок:
//=====================================================================================================

// Включение работы подсказок:

function initTooltips() {
  document.addEventListener('mouseover', event => showTooltip(event));
  document.addEventListener('mouseout', event => hideTooltip(event));
}

// Отображение подсказки:

function showTooltip(event) {
  if (currentElem) {
    return;
  }
  var target = event.target.closest('[data-tooltip]');
  if (!target) {
    return;
  }
  var tooltipHtml = target.dataset.tooltip;
  if (target.classList.contains('disabled') || target.hasAttribute('disabled') || target.closest('.disabled') || !tooltipHtml) {
    return;
  }
  currentElem = target;
  if (tooltip) {
    hideTooltip();
  }
  createTooltip(target, tooltipHtml);
}

// Создание подсказки:

function createTooltip(element, tooltipHtml) {
  tooltip = document.createElement('div');
  tooltip.classList.add('tooltip');

  var textAlign = element.getAttribute('text'),
      help = element.hasAttribute('help');
  if (textAlign) {
    tooltip.setAttribute('text', textAlign);
  }
  if (help) {
    tooltip.setAttribute('help', '');
  }
  tooltip.innerHTML = tooltipHtml;
  document.body.append(tooltip);
  positionTooltip(element);
}

// Позиционирование подсказки:

function positionTooltip(element, flow) {
  var flow = element.getAttribute('flow'),
      coords = element.getBoundingClientRect(),
      windowWidth = window.innerWidth + window.pageXOffset,
      windowHeight = window.innerHeight + window.pageYOffset;

  var x, y;
  if (!flow || flow === 'up' || flow === 'down') {
    // Позиционирование сверху:
    if (!flow || flow === 'up') {
      y = coords.top - tooltip.offsetHeight - 7;
      // Если подсказка не помещается сверху, то отображать её снизу:
      if (y < 0) {
        y = coords.bottom + 7;
        tooltip.setAttribute('flow', 'down');
      } else {
        tooltip.setAttribute('flow', 'up');
      }
    // Позиционирование снизу:
    } else {
      y = coords.bottom + 7;
      // Если подсказка не помещается снизу, то отображать её сверху:
      if (y + tooltip.offsetHeight > windowHeight) {
        y = coords.top - tooltip.offsetHeight - 7;
        tooltip.setAttribute('flow', 'up');
      } else {
        tooltip.setAttribute('flow', 'down');
      }
    }
    var x = coords.left + (element.offsetWidth - tooltip.offsetWidth) / 2;
    // Не заезжать за левый край окна:
    if (x < 0) {
      x = 0;
    }
    // Не заезжать за правый край окна:
    if (x + tooltip.offsetWidth > windowWidth) {
      x = windowWidth - tooltip.offsetWidth;
    }
  } else if (flow === 'left' || flow === 'right') {
    // Позиционирование слева:
    if (flow === 'left') {
      x = coords.left - tooltip.offsetWidth - 7;
      // Если подсказка не помещается слева, то отображать её справа:
      if (x < 0) {
        x = coords.right + 7;
        tooltip.setAttribute('flow', 'right');
      } else {
        tooltip.setAttribute('flow', 'left');
      }
    // Позиционирование справа:
    } else {
      x = coords.right + 7;
      // Если подсказка не помещается справа, то отображать её слева:
      if (x + tooltip.offsetWidth > windowWidth) {
        x = coords.left - tooltip.offsetWidth - 7;
        tooltip.setAttribute('flow', 'left');
      } else {
        tooltip.setAttribute('flow', 'right');
      }
    }
    var y = coords.top + (element.offsetHeight - tooltip.offsetHeight) / 2;
    // Не заезжать за верхний край окна:
    if (y < 0) {
      y = 0;
    }
    // Не заезжать за нижний край окна:
    if (y + tooltip.offsetHeight > windowHeight) {
      y = windowHeight - tooltip.offsetHeight;
    }
  }
  tooltip.style.left = x + 'px';
  tooltip.style.top = y + 'px';
}

// Скрытие подсказки:

function hideTooltip() {
  if (!currentElem || !tooltip) {
    return;
  }
  var relatedTarget = event.relatedTarget;
  while (relatedTarget) {
    if (relatedTarget == currentElem) {
      return;
    }
    relatedTarget = relatedTarget.parentNode;
  }
  tooltip.remove();
  currentElem = null;
  tooltip = null;
}

//=====================================================================================================
// Работа кнопки "Наверх страницы":
//=====================================================================================================

// Инициализация работы кнопки "Наверх страницы":

function initUpBtn() {
  upBtn = getEl('#up-btn');
  if (upBtn) {
    window.addEventListener('scroll', toggleBtnGoTop);
  }
}

// Отображение/скрытие кнопки "Наверх страницы":

function toggleBtnGoTop() {
  var scrolled = window.pageYOffset,
      coords = window.innerHeight / 2;

  if (scrolled > coords) {
    upBtn.classList.add('show');
  }
  if (scrolled < coords) {
    upBtn.classList.remove('show');
  }
}

// Вернуться наверх страницы:

function goToTop() {
  var scrolled = window.pageYOffset;
  if (scrolled > 0 && scrolled <= 5000) {
    window.scrollBy(0, -80);
    setTimeout(goToTop, 0);
  } else if (scrolled > 5000) {
    window.scrollTo(0, 5000);
    goToTop();
  }
}

//=====================================================================================================
// Работа всплывающих окон:
//=====================================================================================================

function initPopUps() {
  document.addEventListener('keydown', (event) => closePopUp(event));
  document.querySelectorAll('.pop-up-container').forEach(el => el.addEventListener('click', (event) => closePopUp(event)));
}

// Открытие всплывающего окна:

function openPopUp(el) {
  if (event) {
    if (event.currentTarget.classList.contains('disabled') || event.currentTarget.hasAttribute('disabled')) {
      return;
    }
  }
  el = getEl(el);
  if (el) {
    if (!getEl('.pop-up-container.open')) {
      getDocumentScroll();
      el.scrollTop = 0;
      document.body.classList.add('no-scroll');
    }
    el.classList.add('open');
  }
}

// Закрытие всплывающего окна:

function closePopUp(el) {
  if (event && el == event) {
    if (event.type === 'keydown') {
      if (event.code === 'Escape') {
        el = getEl('.pop-up-container.open');
      } else {
        return;
      }
    } else {
      if (event.target.closest('.pop-up') && !event.target.closest('.pop-up-title .close')) {
        return;
      }
      el = event.currentTarget;
    }
  } else {
    el = getEl(el);
  }
  if (el) {
    loader.hide();
    el.classList.remove('open');
    if (!document.querySelector('.pop-up-container.open')) {
      document.body.classList.remove('no-scroll');
      setDocumentScroll();
    }
    return true;
  }
}

//=====================================================================================================
// Работа окна уведомлений:
//=====================================================================================================

// Инициализация работы окна уведомлений:

function initNotifications() {
  // sendRequest(urlRequest.main, {action: 'notifications'})
  sendRequest(`../json/notifications_data.json`)
  .then(result => {
    var data = JSON.parse(result),
        notifications = getEl('#notifications');
    if (notifications) {
      var body = getEl('.pop-up-body', notifications);
      fillTemplate({
        area: body,
        items: data
      });
      getEl('.loader', notifications).style.display = 'none';
    }
  })
  .catch(err => {
    console.log(err);
  });
}

//=====================================================================================================
// Работа c полной карточкой товара и изображением на весь экран:
//=====================================================================================================

// Отображение полной карточки товара:

function showFullCard(id) {
  event.preventDefault();
  loader.show();
  var fullCardContainer = getEl('#full-card-container');
  fullCardContainer.style.opacity = 0;
  openPopUp(fullCardContainer);

  fillTemplate({
    area: fullCardContainer,
    items: items.find(item => item.object_id == id),
    sub: [{
      area: '.carousel-item',
      items: 'images'
    }, {
      area: '.card-size',
      items: 'sizes'
    }, {
      area: '.card-option',
      items: 'options'
    }, {
      area: '.manuf-row',
      items: 'manuf_table'
    }, {
      area: '.switch',
      items: 'describe'
    },]
  });
  checkCart(getEl('.full-card'));
  addActionTooltip(getEl('.full-card'));

  var curCarousel = getEl('.carousel', fullCardContainer);
  renderCarousel(curCarousel)
  .then(
    result => {
      if (getEl('img', curCarousel).src.indexOf('/no_img.jpg') === -1) {
        getEl('.carousel-gallery-wrap', curCarousel).addEventListener('click', (event) => showFullImg(event, id));
        getEl('.maximize', curCarousel).addEventListener('click', (event) => showFullImg(event, id));
      }
    }
  );
  fullCardContainer.style.opacity = 1;
  loader.hide();
}

// Открытие картинки полного размера:

function showFullImg(event, id) {
  if (event.target.classList.contains('left-btn') || event.target.classList.contains('right-btn')) {
    return;
  }
  loader.show();
  var fullImgContainer = getEl('#full-img-container');
  fullImgContainer.style.opacity = 0;
  openPopUp(fullImgContainer);

  fillTemplate({
    area: fullImgContainer,
    items: items.find(item => item.object_id == id),
    sub: [{
      area: '.carousel-item',
      items: 'images'
    }]
  });

  var curCarousel = getEl('.carousel', fullImgContainer),
      curImg = event.currentTarget.closest('.carousel').dataset.img;

  renderCarousel(curCarousel, curImg)
  .then(
    result => {
      getEl('#full-card-container').style.opacity = 0;
      fullImgContainer.style.opacity = 1;
      loader.hide();
    }
  );
}

// Закрытие картинки полного размера:

function closeFullImg(event) {
  if (closePopUp(event)) {
    getEl('#full-card-container').style.opacity = 1;
  }
}

//=====================================================================================================
// Работа полей для загрузки файлов:
//=====================================================================================================

function initInputFiles() {
  document.querySelectorAll('input[type="file"]').forEach(el => el.addEventListener('change', event => showSelectFiles(event)));
}

// Отображение выбранных файлов:

function showSelectFiles(event) {
  var wrap = event.currentTarget.closest('.file-wrap'),
      fileName = getEl('.file-name', wrap),
      filePreview = getEl('.file-preview', wrap),
      files = event.currentTarget.files,
      imageTypeRegExp = /^image\//,
      file;
  if (fileName) {
    var text = '';
    if (files && files.length > 1) {
      text = `Выбрано ${files.length} ${declOfNum(files.length, ['файл', 'файла', 'файлов'])}`;
    } else if (files.length) {
      text = event.currentTarget.value.split('\\').pop();
    } else {
      text = 'Файл не выбран';
    }
    fileName.textContent = text;
  }
  if (filePreview) {
    var reader;
    for (var i = 0; i < files.length; i++) {
      file = files[i];
      if (!imageTypeRegExp.test(file.type)) {
        return;
      }
      var reader = new FileReader();
      reader.addEventListener('load', function(event) {
        var img = document.createElement('img');
        img.src = event.target.result;
        filePreview.innerHTML = '';
        filePreview.insertBefore(img, null);
      });
      if (file) {
        wrap.classList.add('added');
        reader.readAsDataURL(file);
      }
    }
    if (!files || !files.length) {
      wrap.classList.remove('added');
      filePreview.innerHTML = '';
    }
  }
}

//=====================================================================================================
// Работа прелоадера:
//=====================================================================================================

// Инициализация работы лоадера страницы:

function initLoader() {
  loader = getEl('#page-loader');
  if (loader) {
    loader = new Loader(loader);
  } else {
    console.log(loader);
    loader = {};
  }
}

// Объект лоадера страницы:

function Loader(obj) {
  this.loader = obj;
  this.text = getEl('.text', obj);

  // Отображение лоадера (можно с текстом):
  this.show = function(text = '') {
    this.text.textContent = text;
    showElement(this.loader, 'flex');
  }

  // Скрытие лоадера:
  this.hide = function() {
    hideElement(this.loader);
  }
}

//=====================================================================================================
// Работа системного окна сообщений:
//=====================================================================================================

// Инициализация работы системного окна сообщений:

function initAlerts() {
  alerts = getEl('#alerts');
  if (alerts) {
    alerts = new Alerts(alerts);
  } else {
    alerts = {};
  }
}

// Объект системного окна сообщений (обязательно передавать текст):

function Alerts(obj) {
  // Элементы для работы:
  this.alerts = obj;
  this.text = getEl('.text', obj);

  // Динамические переменные:
  this.callback;

  // Установка обработчиков событий:
  this.setEventListeners = function() {
    this.alerts.querySelectorAll('.btn').forEach(el => el.addEventListener('click', (event) => this.confirmHandler(event)));
  }
  this.setEventListeners();

  // Отображение окна сообщений:
  this.show = function(text, timer) {
    if (!text) {
      return;
    }
    this.text.innerHTML = text;
    openPopUp(this.alerts);
    if (timer) {
      setTimeout(() => {
        closePopUp(this.alerts);
      }, timer);
    }
  }

  // Отображение окна сообщений c вопросом:
  this.confirm = function(question, callback) {
    this.callback = callback;
    this.alerts.classList.add('confirm');
    this.show(question);
  }

  // Обработчик событий для кнопок согласия/отмены:
  this.confirmHandler = function(event) {
    event.stopPropagation();
    if (event.currentTarget.classList.contains('accept')) {
      this.callback();
    }
    this.alerts.classList.remove('confirm');
    this.hide();
  };

  // Скрытие окна сообщений:
  this.hide = function() {
    closePopUp(this.alerts);
  }
}

//=====================================================================================================
// Работа с формами:
//=====================================================================================================

// Инициализация формы:

function initForm(el, callback) {
  var el = getEl(el);
  if (el && el.id) {
    window[`${el.id}Form`] = new Form(el, callback);
  }
}

// Очистка формы:

function clearForm(el) {
  var el = getEl(el);
  if (window[`${el.id}Form`]) {
    window[`${el.id}Form`].clear();
  }
}

// Заполнение формы данными:

function fillForm(el, data) {
  var el = getEl(el);
  if (!el || !data) {
    return;
  }
  clearForm(el);
  console.log(data);
  var fields = [], type;
  for (var key in data) {
    fields = el.querySelectorAll(`[name="${key}"]`);
    fields.forEach(el => {
      type = el.getAttribute('type');
      console.log(type);
      if (type === 'radio' || type === 'checkbox') {
        if (el.value.toLowerCase() === data[key].toLowerCase()) {
          el.setAttribute('checked', 'checked');
        }
      } else {
        if (type === 'hidden' && el.closest('.activate')) {
          setValueDropDown(el.closest('.activate').id, data[key]);
        }
        el.value = data[key];
      }
    });
  }
}

// Проверка инпута на валидность:

function checkInput(input) {
  var type = input.dataset.type,
      value = input.value,
      regEx;
  if (!value.length) {
    return true;
  }
  if (type === 'cyril') {
    regEx = cyrilRegExp;
  } else if (type === 'date') {
    regEx = dateRegExp;
  } else if (type === 'tel') {
    var test = telRegExp.test(value);
    if (!test) {
      test = finTelRegExp.test(value);
    }
    return test;
  } else if (type === 'email') {
    regEx = emailRegExp;
  } else if (type === 'nickname') {
    regEx = nicknameRegExp;
  } else if (type === 'name') {
    regEx = nameRegExp;
  } else if (type === 'inn') {
    if (value.length >= 10 && value.length <= 12) {
      return true;
    } else {
      return false;
    }
  } else {
    return true;
  }
  return regEx.test(value);
}

// Объект формы:

function Form(obj, callback) {
  // Элементы для работы:
  this.form = obj;
  this.submitBtn = getEl('input[type="submit"]', obj);
  this.dropDowns = this.form.querySelectorAll('.activate');
  this.dates = this.form.querySelectorAll('input[data-type="date"]');
  this.ranges = this.form.querySelectorAll('input[data-type="range"]');

  // Динамические переменные:
  this.isSubmit = false;

  // Инициализация выпадающих списков (если они есть):
  this.dropDowns.forEach((el, index) => {
    this[`dropDown${index}`] = new DropDown(el);
  });

  // Инициализация календарей (если они есть):
  this.dates.forEach(el => new Calendar(el));
  this.ranges.forEach(el => new Calendar(el));

  // Установка обработчиков событий:
  this.setEventListeners = function() {
    this.form.querySelectorAll('input[data-type]').forEach(el => {
      el.addEventListener('input', event => this.checkInput(event));
    });
    this.form.querySelectorAll('[required]').forEach(el => {
      el.querySelectorAll('textarea').forEach(el => el.addEventListener('input', () => this.checkSubmit()));
      el.querySelectorAll('.activate').forEach(el => el.addEventListener('change', () => this.checkSubmit()));
      el.querySelectorAll('input[type="radio"]').forEach(el => el.addEventListener('change', () => this.checkSubmit()));
      el.querySelectorAll('input[type="checkbox"]').forEach(el => el.addEventListener('change', () => this.checkSubmit()));
      el.querySelectorAll('input[type="file"]').forEach(el => el.addEventListener('change', () => this.checkSubmit()));
      // el.querySelectorAll('.choiced-qty').forEach(el => el.addEventListener('change', () => this.checkSubmit())); - не работает, нужно как-то генерить событие
      // el.querySelectorAll('input[data-type="date"]').forEach(el => el.addEventListener('change', () => this.checkSubmit())); - не работает, нужно как-то генерить событие календаря
      // el.querySelectorAll('input[data-type="range"]').forEach(el => el.addEventListener('change', () => this.checkSubmit())); - не работает, нужно как-то генерить событие календаря
      el.querySelectorAll('input:not([data-type]):not([type="radio"]):not([type="checkbox"]):not([type="file"]):not(.choiced-qty)').forEach(el => el.addEventListener('input', () => this.checkSubmit()));
    });
  }
  this.setEventListeners();

  // Определение типа поля и его проверка по соответствующему регулярному выражению:
  this.checkInput = function(event) {
    var input = event.currentTarget,
        isValid = checkInput(input),
        type = input.dataset.type;
    if (type === 'cyril' && input.value.length === 1) {
      input.value = capitalizeFirstLetter(input.value);
    }
    if (type === 'name' && input.value.length === 1) {
      input.value = capitalizeFirstLetter(input.value);
    }
    if (isValid) {
      if (type === 'tel' && input.value.length) {
        // приведение к формату с "+7" и пробелами
        var numbs = input.value.replace(/\D/g, '').match(telRegExp);
        input.value = !numbs[3] ? numbs[2] : ('+7 (' + numbs[2] + ') ' + numbs[3] + (numbs[4] ? '-' + numbs[4] + '-' + numbs[5] : ''));
      }
      input.closest('.form-wrap').classList.remove('error');
      this.checkSubmit();
    } else {
      input.closest('.form-wrap').classList.add('error');
      this.submitBtn.setAttribute('disabled','disabled');
    }
  }

  // Проверка на заполнение всех обязательных полей и блокировка/разблокировка кнопки submit:
  this.checkSubmit = function() {
    var required = Array.from(this.form.querySelectorAll('[required]'));
    this.isSubmit = required.every(el => {
      var fields = el.querySelectorAll('[name]'),
          type,
          value;
      for (var field of fields) {
        // console.log(field);
        type = field.getAttribute('type');
        value = field.value.trim();
        if (field.hasAttribute('data-type')) {
          var isValid = checkInput(field);
          // console.log(isValid);
          // console.log(field.value);
          if (isValid && value) {
            return true;
          }
        } else if (type === 'radio' || type === 'checkbox') {
          // console.log(field.checked);
          if (field.checked) {
            return true;
          }
        } else if (field.classList.contains('choiced-qty')) {
          // console.log(value);
          if (value != 0) {
            return true;
          }
        } else {
          // console.log(field.value);
          if (value) {
            return true;
          }
        }
      }
    });
    if (this.isSubmit) {
      this.submitBtn.removeAttribute('disabled');
    } else {
      this.submitBtn.setAttribute('disabled', 'disabled');
    }
  }

  // Отправка формы:
  this.send = function(event) {
    event.preventDefault();
    if (!this.isSubmit || !this.submitBtn || this.submitBtn.hasAttribute('disabled')) {
      return;
    }
    var formData = new FormData(this.form);
    if (callback) {
      callback(formData);
    }
  }

  // Очистка формы поиска:
  this.clear = function() {
    this.form.querySelectorAll('textarea').forEach(el => el.value = '');
    this.form.querySelectorAll('input:not([type="radio"]):not([type="checkbox"]):not([type="submit"])').forEach(el => el.value = '');
    this.form.querySelectorAll('input[type="radio"]').forEach(el => el.removeAttribute('checked'));
    this.form.querySelectorAll('input[type="checkbox"]').forEach(el => el.removeAttribute('checked'));
    this.dropDowns.forEach((el, index) => this[`dropDown${index}`].clear());
  }
}

//=====================================================================================================
// Работа полей поиска:
//=====================================================================================================

// Инициализация поля поиска:

function initSearch(el, callback) {
  var el = getEl(el);
  if (el && el.id) {
    window[`${el.id}Search`] = new Search(el, callback);
  }
}

// Очистка поля поиска:

function clearSearch(el) {
  var el = getEl(el);
  if (window[`${el.id}Search`]) {
    window[`${el.id}Search`].clear();
  }
}

// Объект поля поиска:

function Search(obj, callback) {
  // Элементы для работы:
  this.form = obj;
  this.input = getEl('input[type="text"]', obj);
  this.searchBtn = getEl('.search', obj);
  this.cancelBtn = getEl('.close', obj);
  this.items = getEl('.items', obj);
  this.notFound = getEl('.not-found', obj);
  this.result = getEl(`.search-info[data-search="${this.form.id}"]`);

  // Установка обработчиков событий:
  this.setEventListeners = function() {
    this.form.addEventListener('submit', event => {
      event.preventDefault();
      this.search();
    });
    if (!this.form.classList.contains('positioned')) {
      this.input.addEventListener('focus', () => this.onFocus());
      this.input.addEventListener('blur', () => this.onBlur());
    }
    if (this.items) {
      this.input.addEventListener('input', () => this.showHints());
      this.items.addEventListener('click', event => this.selectHint(event));
    }
    this.cancelBtn.addEventListener('click', (event) => this.cancel(event));
    if (this.result) {
      getEl('.pill', this.result).addEventListener('click', (event) => this.cancel(event));
    }
  }
  this.setEventListeners();

  // Отображение подсказок:
  this.showHints = function() {
    var textToFind = this.input.value.trim();
    if (textToFind === '') {
      this.closeHints();
      return;
    }

    var regEx = RegExp(textToFind, 'gi'),
        items = Array.from(this.items.querySelectorAll('.item')),
        curItems = items.filter(el => el.dataset.value.search(regEx) >= 0);

    items.forEach(el => hideElement(el));
    if (curItems.length > 0) {
      hideElement(this.notFound);
      curItems.forEach(el => showElement(el, 'flex'));
    } else {
      showElement(this.notFound);
    }
    this.form.classList.add('open');
  }

  // Cкрытие подсказок:
  this.closeHints = function() {
    if (!this.items) {
      return;
    }
    this.items.querySelectorAll('.item').forEach(el => hideElement(el));
    hideElement(this.notFound);
    this.form.classList.remove('open');
  }

  // Поиск по подсказке:
  this.selectHint = function(event) {
    var curItem = event.target.closest('.item');
    if (!curItem) {
      return;
    }
    this.input.value = curItem.dataset.value;
    this.search();
  }

  // Удаление значения из инпута при его фокусе и скрытие/отображение подсказок:
  this.onFocus = function() {
    onFocusInput(this.input);
    this.closeHints();
  }

  // Восстановление последнего найденного значения в инпуте при потере им фокуса и скрытие/отображение подсказок:
  this.onBlur = function() {
    setTimeout(() => {
      onBlurInput(this.input);
      this.closeHints();
    }, 100);
  }

  // Поиск:
  this.search = function() {
    var textToFind = this.input.value.trim();
    if (textToFind === '') {
      return;
    }
    if (callback) {
      var length = callback(this.form, textToFind);
    }
    this.input.dataset.value = this.input.value;
    this.toggleInfo(textToFind, length);
    this.input.focus();
    this.searchBtn.style.visibility = 'hidden';
    this.cancelBtn.style.visibility = 'visible';
  }

  // Очистка поля поиска:
  this.clear = function() {
    this.input.value = this.input.dataset.value = '';
    this.closeHints();
    this.toggleInfo();
    this.cancelBtn.style.visibility = 'hidden';
    this.searchBtn.style.visibility = 'visible';
  }

  // Сброс поиска:
  this.cancel = function(event) {
    if (event.currentTarget.classList.contains('close')) {
      this.input.focus();
    }
    this.clear();
    if (callback) {
      callback(this.form);
    }
  }

  // Отображение/скрытие информации о поиске:
  this.toggleInfo = function(text, count) {
    if (!this.result) {
      return;
    }
    if (text) {
      getEl('.search-text', this.result).textContent = text;
      getEl('.search-count', this.result).textContent = count;
      showElement(this.result, 'flex');
    } else {
      hideElement(this.result);
    }
  }
}

// Объект поля поиска для выпадающего списка:

function SearchInBox(obj, callback) {
  Search.apply(this, arguments);

  // Элементы для работы:
  this.items = obj.closest('.drop-down');

  // Установка обработчиков событий:
  this.setEventListeners = function() {
    if (this.items) {
      this.input.addEventListener('input', () => this.showHints());
    }
  }
  this.setEventListeners();

  // Восстановление изначального вида подсказок:
  this.restoreHints = function() {
    this.items.querySelectorAll('.item').forEach(el => showElement(el, 'flex'));
    hideElement(this.notFound);
  }

  // Отображение подсказок:
  this.showHints = function() {
    var textToFind = this.input.value.trim();
    if (textToFind === '') {
      this.restoreHints();
      return;
    }

    var regEx = RegExp(textToFind, 'gi'),
        items = Array.from(this.items.querySelectorAll('.item')),
        curItems = items.filter(el => el.dataset.value.search(regEx) >= 0);

    items.forEach(el => hideElement(el));
    if (curItems.length > 0) {
      hideElement(this.notFound);
      curItems.forEach(el => showElement(el, 'flex'));
    } else {
      showElement(this.notFound);
    }
    this.form.classList.add('open');
  }

  // Удаление значения из инпута при его фокусе и отображение подсказок:
  this.onFocus = function() {
    onFocusInput(this.input);
    this.restoreHints();
  }

  // Восстановление последнего найденного значения в инпуте при потере им фокуса и отображение подсказок:
  this.onBlur = function() {
    setTimeout(() => {
      onBlurInput(this.input);
      this.showHints();
    }, 100);
  }

  // Очистка поля поиска:
  this.clear = function() {
    this.input.value = this.input.dataset.value = '';
    this.restoreHints();
    this.toggleInfo();
    this.cancelBtn.style.visibility = 'hidden';
    this.searchBtn.style.visibility = 'visible';
  }
}

//=====================================================================================================
// Работа выпадающих списков:
//=====================================================================================================

// Инициализация выпадающего списка:

function initDropDown(el, handler) {
  var el = getEl(el);
  if (el && el.id) {
    window[`${el.id}Dropdown`] = new DropDown(el);
    if (handler) {
      el.addEventListener('change', event => handler(event));
    }
  }
}

// Очистка значения выпадающего списка:

function clearDropDown(el) {
  var el = getEl(el);
  if (window[`${el.id}Dropdown`]) {
    window[`${el.id}Dropdown`].clear();
  }
}

// Установка значения выпадающего списка:

function setValueDropDown(id, value) {
  if (window[`${id}Dropdown`]) {
    window[`${id}Dropdown`].setValue(value);
  }
}

// Закрытие выпадающих списков при клике вне их самих:

document.addEventListener('click', closeDropDown);

function closeDropDown(event) {
  var target = event.target;
  if (!target.closest('.activate.open')) {
    var dropDownOpen = getEl('.activate.open');
    if (dropDownOpen) {
      dropDownOpen.classList.remove('open');
    }
  }
}

// Объект выпадающего списка:

function DropDown(obj) {
  // Элементы для работы:
  this.filter = obj;
  this.hiddenInput = getEl('input[type="hidden"]', obj);
  this.head = getEl('.head', obj);
  this.title = getEl('.head .title', obj);
  this.sort = getEl('.sort-box', obj);
  this.search = getEl('form.search', obj);
  this.items = getEl('.items', obj) || getEl('.drop-down', obj);
  this.clearBtn = getEl('.clear-btn', obj);

  // Константы:
  this.titleText = this.title.textContent;

  // Установка обработчиков событий:
  this.setEventListeners = function() {
    if (this.head) {
      this.head.addEventListener('click', () => this.toggle());
    }
    if (this.sort) {
      this.sort.addEventListener('click', event => this.sortValue(event))
    }
    if (this.items) {
      this.items.addEventListener('click', event => this.selectValue(event));
    }
    if (this.clearBtn) {
      this.clearBtn.addEventListener('click', () => this.clear());
    }
  }
  this.setEventListeners();

  // Открытие/закрытие выпадающего списка:
  this.toggle = function() {
    if (this.filter.hasAttribute('disabled')) {
      return;
    }
    if (this.filter.classList.contains('open')) {
      this.filter.classList.remove('open');
    } else {
      var dropDownOpen = getEl('.activate.open');
      if (dropDownOpen) {
        dropDownOpen.classList.remove('open');
      }
      this.filter.classList.add('open');
    }
  }

  // Изменение заголовка:
  this.changeTitle = function(newTitle) {
    if (this.title) {
      if (newTitle) {
        this.title.textContent = newTitle;
        this.filter.classList.add('changed');
      } else {
        this.title.textContent = this.titleText;
        this.filter.classList.remove('changed');
      }
    }
  }

  // Сортировка значений:
  this.sortValue = function(event) {
    var sort = event.target.closest('.row');
    if (sort.classList.contains('checked')) {
      sort.classList.remove('checked');
    } else {
      var curSort = getEl('.checked.row', this.sort);
      if (curSort) {
        curSort.classList.remove('checked');
      }
      sort.classList.add('checked');
    }
    sort.dispatchEvent(new Event('change', {"bubbles": true}));
  }

  // Поиск значения:
  this.searchValue = (search, textToFind) => {
    if (this.items) {
      this.items.querySelectorAll('.item.checked').forEach(el => el.classList.remove('checked'));
    }
    if (textToFind) {
      this.changeTitle('Поиск: ' + textToFind);
      this.filter.value = textToFind;
    } else {
      this.clear(event);
    }
    search.dispatchEvent(new Event('change', {"bubbles": true}));
  }

  // Выбор значения из списка:
  this.selectValue = function(event, curItem) {
    if (event) {
      curItem = event.target.closest('.item');
    }
    if (!curItem) {
      return;
    }
    if (this.search) {
      this.search.clear();
    }

    var value;
    if (this.filter.classList.contains('select')) {
      if (curItem.dataset.value === 'default') {
        this.clear();
      } else {
        this.changeTitle(curItem.textContent);
        value = curItem.dataset.value;
      }
      this.filter.classList.remove('open');
    } else {
      curItem.classList.toggle('checked');
      var checked = this.items.querySelectorAll('.item.checked');
      if (checked.length === 0) {
        this.clear();
      } else {
        this.changeTitle('Выбрано: ' + checked.length);
        value = [];
        checked.forEach(el => value.push(el.dataset.value));
      }
    }
    this.filter.value = value;
    if (this.hiddenInput) {
      this.hiddenInput.value = value;
    }
    curItem.dispatchEvent(new Event('change', {"bubbles": true}));
  }

  // Установка значения:
  this.setValue = function(value) {
    this.filter.querySelectorAll('.item').forEach(el => {
      if ((el.dataset.value).toLowerCase() === value.toLowerCase()) {
        this.selectValue(null, el);
      }
    });
  }

  // Очистка:
  this.clear = function() {
    this.changeTitle();
    if (this.search) {
      this.search.clear();
    }
    if (this.items) {
      this.items.querySelectorAll('.item.checked').forEach(el => el.classList.remove('checked'));
    }
    this.filter.value = undefined;
    if (this.hiddenInput) {
      this.hiddenInput.value = undefined;
    }
  }

  // Инициализация поиска (если есть):
  if (this.search) {
    this.search = new Search(this.search, this.searchValue);
  }
}

// Объект выпадающего списка для таблиц:

function DropDownTable(obj) {
  DropDown.apply(this, arguments);
  this.filterIcon = getEl('.filter.icon', obj);

  // Изменение заголовка:
  this.changeTitle = function(newTitle) {
    if (this.filterIcon) {
      if (newTitle) {
        this.filterIcon.style.visibility = 'visible';
      } else {
        this.filterIcon.style.visibility = 'hidden';
      }
    }
  }
}
