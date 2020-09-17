'use strict';

//=====================================================================================================
// Первоначальные данные для работы:
//=====================================================================================================

// Области с шаблонами карточки товара в галерее (сохраняем, потому что эти данные перезапишутся):

var minCard, bigCard;

// Константы:

var menuContent = {
  equip: {
    title: 'Экипировка',
    id: 'equip',
    cats: [{
      cat: 'odegda',
      cat_title: 'Одежда'
    }, {
      cat: 'obuv',
      cat_title: 'Обувь'
    }, {
      cat: 'shlem',
      cat_title: 'Шлемы'
    }, {
      cat: 'optic',
      cat_title: 'Оптика'
    }, {
      cat: 'snarag',
      cat_title: 'Снаряжение'
    }, {
      cat: 'zashita',
      cat_title: 'Защита'
    }, {
      cat: 'sumruk',
      cat_title: 'Сумки и рюкзаки'
    }]
  },
  snow: {
    title: 'Снегоходы',
    id: 'snow',
    cats: [{
      cat: 'zip',
      cat_title: 'Запчасти'
    }, {
      cat: 'acc',
      cat_title: 'Аксессуары'
    }]
  },
  boats: {
    title: 'Лодки и моторы',
    id: 'boats',
    cats: [{
      cat: 'zip',
      cat_title: 'Запчасти'
    }, {
      cat: 'acc',
      cat_title: 'Аксессуары'
    }]
  }
};

// Динамически изменяемые переменные:

var view = location.pathname === '/product'? 'product' : 'blocks',
    path,
    cartItems = {},
    curItems,
    selectedItems = '',
    filterItems = [],
    curSelect = null;

// Запускаем рендеринг страницы каталога:

startCatalogPage();

//=====================================================================================================
// При запуске страницы:
//=====================================================================================================

// Запуск страницы каталога:

function startCatalogPage() {
  window.addEventListener('popstate', (event) => openPage(event));
  addCatalogModules();
  fillCatalogHeader();
  if (view === 'product') {
    getItems(location.search.replace('?',''))
    .then(
      result => {
        items = [result];
        convertItems();
        initCart();
      },
      reject => {
        location.href = '../err404.html';
      }
    )
  } else {
    getItems()
    // sendRequest(`../json/${document.body.id}_data.json`)
    .then(
      result => {
        // result = JSON.parse(result); //удалить
        for (var key in result) {
          if (key !== 'colors') {
            window[key] = result[key];
          }
        }
        convertItems();
        catalogFiltersData = createCatalogFiltersData();
        zipSelectsData = createZipSelectsData();
        initCart();
      }
    )
  }
}

// Инициализация корзины (если есть):

function initCart() {
  if (isCart) {
    window.addEventListener('focus', updateCart);
    getCart()
    .then(result => {
      fillOrderForm();
      createCartData();
    }, reject => console.log(reject))
    .then(result => {
      initPage();
    })
    .catch(err => {
      console.log(err);
      initPage();
    });
  } else {
    initPage();
  }
}

// Инициализация страницы:

function initPage() {
  loader.hide();
  path = location.href.replace(/https*:\/\/[^\/]+\//g, '').replace(/\/[^\/]+.html/g, '').replace(/\//g, '').split('?');
  renderContent();
  initSearch('#page-search', selectCards);
  initSearch('#oem', selectCards);
  initDropDown('#gallery-sort', sortItems);
  initForm('#order-form', sendOrder);
}

//=====================================================================================================
// Построение страницы:
//=====================================================================================================

// Добавление второго уровня меню и "прилипающей" части каталога:

function addCatalogModules() {
  var type = document.body.id === 'equip' ? 'equip' : 'zip';

  var catalogHeader = document.createElement('div');
  catalogHeader.dataset.html = '../modules/catalog_header.html';
  getEl('#header').appendChild(catalogHeader);

  var catalogMain = document.createElement('div');
  catalogMain.id = 'main';
  catalogMain.classList.add('main', type);
  catalogMain.dataset.html = '../modules/catalog_main.html';
  document.body.insertBefore(catalogMain, getEl('#modules').nextSibling);
  includeHTML();

  var catalogGallery = document.createElement('div');
  catalogGallery.id = 'gallery';
  catalogGallery.dataset.html = `../modules/catalog_${type}.html`;
  getEl('#content').appendChild(catalogGallery);
  includeHTML();

  catalogMain.querySelectorAll('.pop-up-container').forEach(el => el.addEventListener('click', (event) => closePopUp(event)));
  document.body.insertBefore(getEl('#full-card-container'), getEl('.main').nextSibling);
  minCard = getEl('.min-card');
  bigCard = getEl('.big-card');
}

// Динамическое заполнение второго уровня меню:

function fillCatalogHeader() {
  var data = menuContent[document.body.id];
  fillTemplate({
    area: '#header-menu .container',
    items: data,
    sub: [{area: '.submenu-item', items: 'cats'}]
  });
  showElement('#header-menu')
}

//=====================================================================================================
// Преобразование исходных данных:
//=====================================================================================================

// Фильтрация:
// - входящих данных для страниц ЗИПа

// Добавление:
// - данных для поиска по странице
// - данных о картинке в малой карточке
// - данных о текущей цене
// - общего количества

// Преобразование:
// - данных о картинках в карточке товара из строки в массив;
// - данных для фильтров по производителю
// - данных о годах в укороченный формат

// Создание:
// - объекта в разрезе размеров для корзины

// Преобразование всех данных при загрузке страницы:

function convertItems() {
  if (!window.items) {
    return;
  }
  if (pageId == 'boats') {
    items = items.filter(el => el.lodkimotor == 1);
  }
  if (pageId == 'snow') {
    items = items.filter(el => el.snegohod == 1);
  }
  items.forEach(item => convertItem(item));
  items.sort(sortBy(('catid')));  // Сортировка по id категории:
}

// Преобразование данных по одному товару:

function convertItem(item) {
  if (item.manuf) {// Преобразование данных о производителе из JSON в объект:
    var manuf;
    try {
      manuf = JSON.parse(item.manuf);
    } catch(error) {
      item.manuf = 0;
    }
    item.manuf = manuf;
  }
  item.title = item.title.replace(/\s/, ' ').replace(/\u00A0/g, ' ');
  item.isManuf = item.manuf && Object.keys(item.manuf.man).length > 1  ? '' : 'displayNone';
  addImgInfo(item);
  addActionInfo(item);
  addPriceInfo(item);
  addMarkupInfo(item);
  addSizeInfo(item);
  addOptionsInfo(item);
  addManufInfo(item);
  addDescrInfo(item);
  addSearchInfo(item);
  item.isPriceRow = (item.isAction === 'hidden' && item.isOldPrice === 'hidden') ? 'displayNone' : '';
}

// Преобразование и добавление данных о картинках:

function addImgInfo(item) {
  item.images = item.images.toString().split(';');
  item.image = `https://b2b.topsports.ru/c/productpage/${item.images[0]}.jpg`;
}

// Проверка действия акции и добавление данных о ней:

function addActionInfo(item) {
  if (item.action_id > 0) {
    if (window.actions) {
      var action = actions[item.action_id],
          isActual = action && action.unending ? true : false;
      if (!isActual) {
        var typeDate = 'yy-mm-dd',
            start = getDateObj(action.begin, typeDate),
            end = getDateObj(action.expire, typeDate);
        isActual = checkDate(new Date(), start, end)
      }
      if (isActual) {
        item.actiontitle = action.title;
        item.actioncolor = action.color ? `#${action.color}` : '';
        item.actiondescr = action.descr;
      } else {
        item.action_id = '0';
      }
    }
  }
  item.actiontitle = item.actiontitle || '';
  item.actioncolor = item.actioncolor || '';
  item.actiondescr = item.actiondescr || '';
  item.isAction = item.actiontitle ? '' : 'hidden';
}

// Добавление данных о текущей цене и отображении/скрытии старой:

function addPriceInfo(item) {
  // Преобразование цен в данных, которые не преобразованы по образцу остальных (убираем копейки, делаем 2 формата):
  // price_cur: "24&nbsp;157"
  // price_cur1: "24157"
  item.price_action1 = '' + Math.round(parseFloat(item.price_action));
  item.price_action = (item.price_action1 + '').replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, '$1&nbsp;');
  item.price_preorder1 = '' + Math.round(parseFloat(item.price_preorder));
  item.price_preorder = (item.price_action1 + '').replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, '$1&nbsp;');

  var isNewPrice;
  if (cartId.indexOf('preorder') >= 0) {
    isNewPrice = item.preorder_id && item.price_preorder1 > 0 ? true : false;
    item.price_cur = isNewPrice ? item.price_preorder : item.price;
    item.price_cur1 = isNewPrice ? item.price_preorder1 : item.price1;
  } else {
    isNewPrice = item.action_id && item.price_action1 > 0 ? true : false;
    item.price_cur = isNewPrice ? item.price_action : item.price;
    item.price_cur1 = isNewPrice ? item.price_action1 : item.price1;
  }
  if (website === 'skipper') {
    item.isHiddenPrice = isNewPrice ? '' : 'displayNone';
  } else {
    item.isOldPrice = isNewPrice ? '' : 'hidden';
    item.isBorder = item.action_id != 0 ? '' : 'borderNone';
  }
}

// Добавление данных о торговой наценке:

function addMarkupInfo(item) {
  item.markup = ((item.price_user1 - item.price_cur1) / item.price_cur1 * 100).toFixed(0);
}

// Добавление данных о размерах, общем количестве и создание cartItems (использовать после addActionInfo):

function addSizeInfo(item) {
  if (!item.sizes || item.sizes == 0) {
    item.sizes = {};
    item.sizes[0] = {
      articul: item.articul,
      object_id: item.object_id,
      free_qty: item.free_qty,
      arrive_qty: item.arrive_qty,
      arrive_date: item.arrive_date
    };
  }
  var size;
  for (var key in item.sizes) {
    size = item.sizes[key];
    size.size = size.size || 'OS';
    size.total_qty = parseInt(size.free_qty, 10) + parseInt(size.arrive_qty, 10);
    size.isFree = size.free_qty > 0 ? '' : 'displayNone';
    size.isArrive = size.arrive_qty > 0 ? '' : 'displayNone';
    size.isWarehouse = size.warehouse_qty > 0 ? '' : 'displayNone';

    var sizeObj = cartItems['id_' + size.object_id] = Object.assign({}, size);
    sizeObj.id = item.object_id;
    sizeObj.isAvailable = size.total_qty > 0 ? '' : 'not-available';
    sizeObj.image = item.image;
    sizeObj.title = item.title;
    sizeObj.options = size.size ? `(${item.options[40]}, ${size.size})` : '';
    sizeObj.price_cur = item.price_cur;
    sizeObj.price_cur1 = item.price_cur1;
    sizeObj.price_user = item.price_user ;
    sizeObj.price_user1 = item.price_user1;
    sizeObj.action_id = item.action_id;
    sizeObj.actiontitle = item.actiontitle;
    sizeObj.action_name = sizeObj.total_qty > 0 ? (item.actiontitle || 'Склад') : 'Нет в наличии';
  }
}

// Добавление данных для создания списка характеристик:

function addOptionsInfo(item) {
  if (!item.options || item.options == 0) {
    return;
  }
  var options = [], option;
  for (var key in item.options) {
    option = item.options[key];
    if (key == 32) {
      option = convertYears(item.options[key]);
    } else {
      option = option
      .replace(/\,/gi, ', ')
      .replace(/\//gi, '/ ')
    }
    if ((key == 7 || key == 31 || key == 32 || key == 33) && !item.isManuf) {
      continue;
    } else {
      options.push({
        optitle: optnames[key],
        option: option
      });
    }
  }
  item.options = options;
}

// Преобразование данных о производителе для фильтров и построения таблицы:

function addManufInfo(item) {
  if (!item.manuf) {
    return;
  }
  if (!item.isManuf) {
    var manufTable = [],
        manufTableRow;
  }
  var manuf = [],
      manufRow,
      value;
  for (var man in item.manuf.man) {
    manufRow = {};
    manufRow.man = [man];
    if (!item.isManuf) {
      manufTableRow = {};
      manufTableRow.man = man;
    }

    for (var k in item.manuf) {
      if (k !== 'man') {
        value = [];
        for (var kk in item.manuf[k]) {
          for (var kkk in item.manuf[k][kk]) {
            if (kkk == man) {
              value.push(kk);
            }
          }
        }
        manufRow[k] = value;
        if (!item.isManuf) {
          value = value.join(', ');
          if (value && k === 'years') {
            value = convertYears(value);
          }
          manufTableRow[k] = value || '&ndash;';
        }
      }
    }
    manuf.push(manufRow);
    if (!item.isManuf) {
      manufTable.push(manufTableRow);
    }
  }
  if (!item.isManuf) {
    item.manuf_table = manufTable;
  }
  item.manuf_filter = manuf;
}

// Добавление данных для создания блоков описаний:

function addDescrInfo(item) {
  item.describe = [];
  if (item.desc) {
    item.describe.push({title: 'Описание товара', info: item.desc});
    delete item.desc;
  }
  if (item.actiondescr) {
    item.describe.push({title: 'Условия акции', info: item.actiondescr});
    delete item.actiondescr;
  }
  if (item.defectdescr) {
    item.describe.push({title: 'Описание дефекта', info: item.defectdescr});
    delete item.defectdescr;
  }
}

// Добавление данных для поиска по странице (использовать после addSizeInfo, addOptionsInfo и addManufInfo):

function addSearchInfo(item) {
  item.search = [item.title, item.brand, item.cat, item.subcat];
  for (var key in item.sizes) {
    item.search.push(item.sizes[key].articul);
  }
  for (var key in item.options) {
    item.search.push(item.options[key].option.replace('"', ''));
  }
  if (item.manuf) {
    for (var k in item.manuf) {
      for (var kk in item.manuf[k]) {
      item.search.push(kk);
      }
    }
  }
  item.search = item.search.join(',').replace(/\s/, ' ').replace(/\u00A0/g, ' '); // Замена любых пробельных символов на пробелы
}

//=====================================================================================================
// Визуальное отображение контента на странице:
//=====================================================================================================

// Установка ширины галереи и малых карточек товаров:

function setContentWidth() {
  if (website === 'skipper') {
    setGalleryWidth();
    setMinCardWidth(13);
  } else {
    setMinCardWidth(18);
  }
}

// Установка ширины галереи:

function setGalleryWidth() {
  gallgetEl('#gallery').style.width = (getEl('#content').clientWidth - getEl('#filters').clientWidth - 30) + 'px';
}

// Установка ширины малых карточек товаров:

function setMinCardWidth(width) {
  if (view === 'list') {
    return;
  }
  var gallery = getEl('#gallery'),
      standartWidth = (width * parseInt(getComputedStyle(gallery).fontSize, 10)),
      countCards = Math.floor(gallery.clientWidth / standartWidth),
      restGallery = gallery.clientWidth - countCards * standartWidth,
      changeMinCard = restGallery / countCards,
      minCardWidth = 0;
  if (changeMinCard <= 110) {
    minCardWidth = Math.floor(standartWidth + changeMinCard);
  } else {
    countCards = countCards + 1;
    minCardWidth = gallery.clientWidth / countCards;
  }
  var cards = document.querySelectorAll('.min-card');
  cards.forEach((minCard, index) => {
    minCard.style.width = minCardWidth + 'px';
    if ((index + 1) <= countCards) {
      minCard.style.borderTopColor = 'transparent';
    } else if (index < 15) {
      minCard.style.borderTopColor = '#C6C6C6';
    }
  });
}

// Изменение позиционирования меню фильтров:

function setFiltersPosition() {
  if (window.innerWidth > 960) {
    var gallery = getEl('#gallery'),
        filters = getEl('#filters'),
        menuFilters = getEl('#catalog-filters');
    if (filters.style.position == 'fixed') {
      if (menuFilters.clientHeight >= gallery.clientHeight) {
        filters.style.position = 'static';
        filters.style.top = '0px';
        filters.style.height = 'auto';
      } else {
        setFiltersHeight();
      }
    } else {
      if (menuFilters.clientHeight < gallery.clientHeight) {
        filters.style.position = 'fixed';
        setFiltersHeight();
      }
    }
  }
}

// Установка высоты меню фильтров:

function setFiltersHeight() {
  var filters = getEl('#filters'),
      scrolled = window.pageYOffset || document.documentElement.scrollTop,
      headerHeight = getEl('#header').clientHeight,
      footerHeight = Math.max((window.innerHeight + scrolled - getEl('#footer').offsetTop) + 20, 0),
      filtersHeight = window.innerHeight - headerHeight - footerHeight;
  filters.style.top = headerHeight + 'px';
  filters.style.maxHeight = filtersHeight + 'px';
}

//=====================================================================================================
// Динамическая смена URL и данных на странице:
//=====================================================================================================

// Изменение URL без перезагрузки страницы:

function openPage(event) {
  event.preventDefault();
  if (event.type == 'popstate') {
    if (event.state) {
      path = event.state.path;
    } else {
      return;
    }
  } else {
    var oldPath = path;
    path = event.currentTarget.href.replace(/https*:\/\/[^\/]+\//g, '').replace(/\/[^\/]+.html/g, '').replace(/\//g, '').split('?');
    if (path.length === oldPath.length && JSON.stringify(oldPath) === JSON.stringify(path)) {
      return;
    }
    window.history.pushState({'path': path},'', event.currentTarget.href);
  }
  renderContent();
}

// Изменение контента страницы:

function renderContent() {
  if (path[path.length - 1].indexOf('=') >= 0) {
    path.pop();
  }
  hideContent();
  changePageTitle();
  toggleMenuItems();
  changeMainNav();
  changeLinks();
  if (path[path.length - 1] === 'cart') {
    renderCart();
  } else if (view === 'product') {
    renderProductPage();
  } else {
    renderGallery();
  }
  setPaddingToBody();
  setDocumentScroll(0);
}

// Изменение заголовка страницы:

function changePageTitle() {
  var title = '',
      curTitle = getEl(`#header-menu [href$="${path[path.length - 1]}"]`);
  if (view === 'product') {
    title += items[0].title;
  } else if (curTitle) {
    title += curTitle.dataset.title;
  } else {
    location.href = '../err404.html';
  }
  document.title = 'ТОП СПОРТС - ' + title;
  var pageTitle = getEl('#page-title');
  if (pageTitle) {
    pageTitle.textContent = title;
  }
}

// Изменение активных разделов меню:

function toggleMenuItems() {
  document.querySelectorAll('#header-menu .active').forEach(item => item.classList.remove('active'));
  path.forEach(key => {
    var curTitle = getEl(`#header-menu [href$="${key}"]`);
    if (curTitle) {
      curTitle.classList.add('active');
    }
  });
}

// Изменение хлебных крошек:

function changeMainNav() {
  if (!getEl('#main-nav')) {
    return;
  }
  if (location.search === '?cart' || website === 'skipper' || view === 'product') {
    var data = {items: []}, curTitle;
    path.forEach(el => {
      curTitle = getEl(`#header-menu [href$="${key}"]`);
      if (curTitle) {
        var item = {
          href: view === 'product' ? '#': curTitle.href,
          title: view === 'product' ? items[0].title: curTitle.dataset.title
        };
        data.items.push(item);
      } else {
        location.href = '../err404.html';
      }
    });
    fillTemplate({
      area: '#main-nav',
      items: data,
      sub: [{
        area: '.item',
        items: 'items'
      }]
    });
    if (website === 'skipper') {
      showElement('#table .main-header');
    } else {
      showElement('#main-header', 'flex');
    }
  }
}

// Изменение динамических ссылок в соответствии с выбранным разделом:

function changeLinks() {
  document.querySelectorAll('.dinamic-link').forEach(item => {
    var curTitle = getEl(`#header-menu [href$="${path[path.length - 1]}"]`);
    if (curTitle) {
      item.href = curTitle.href + '?' + path[path.length - 1];
    }
  });
}

// Создание контента страницы товара:

function renderProductPage() {
  fillTemplate({
    area: '.product-card',
    target: 'gallery',
    items: items[0],
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
    }]
  });
  var card = getEl('.product-card');
  renderCarousel(getEl('.carousel', card))
  .then(
    result => {
      card.style.opacity = '1';
    }
  )
}

// Создание контента галереи:

function renderGallery() {
  var local = location.search,
      filter;
  if (location.search && location.search.indexOf('=') >= 0) {
    local = location.search.split('?');
    filter = local.pop();
    local = local.join('?');
  }
  pageUrl = local ? pageId + local : pageId;
  if (window[`${pageUrl}Items`]) {
    curItems = JSON.parse(JSON.stringify(window[`${pageUrl}Items`]));
  } else {
    curItems = items;
    path.forEach(key => {
      if (key != pageId) {
        curItems = curItems.filter(item => item[key] == 1);
      }
    });
    window[`${pageUrl}Items`] = JSON.parse(JSON.stringify(curItems));
  }
  if (!curItems.length) {
    return;
  }
  clearDropDown('#gallery-sort');
  showElement('#page-search', 'flex');
  showElement('#header-content');
  showElement('#content', 'flex');
  toggleEventListeners('on');
  clearCurSelect();
  initFilters(filter);
  showCards();
}

// Скрытие неактуальных частей страницы:

function hideContent() {
  hideElement('#page-search');
  hideElement('#header-content');
  hideElement('#main-header');
  hideElement('#cart-name');
  hideElement('#filters-container');
  hideElement('#content');
  hideElement('#gallery');
  hideElement('#gallery-notice');
  hideElement('#cart');
}

// Добавление/удаление обработчиков событий на странице:

function toggleEventListeners(toggle) {
  if (toggle === 'on') {
    window.addEventListener('scroll', scrollGallery);
    window.addEventListener('resize', scrollGallery);
    window.addEventListener('resize', setContentWidth);
    window.addEventListener('scroll', setFiltersPosition);
    window.addEventListener('resize', setFiltersPosition);
  } else if (toggle === 'off') {
    window.removeEventListener('scroll', scrollGallery);
    window.removeEventListener('resize', scrollGallery);
    window.removeEventListener('resize', setContentWidth);
    window.removeEventListener('scroll', setFiltersPosition);
    window.removeEventListener('resize', setFiltersPosition);
  }
}

//=====================================================================================================
//  Функции для работы с фильтрами галереии:
//=====================================================================================================

// Инициализация всех фильтров галереи:

function initFilters(filter) {
  initFiltersCatalog();
  initFiltersZip();
  showElement('#filters-container');
  setFilterOnPage(filter);
  clearFiltersInfo();
  checkPositions();
  checkFilters();
  createFiltersInfo();
}

// Установка на страницу фильтра из поисковой строки:

function setFilterOnPage(filter) {
  if (!filter) {
    return;
  }
  var key, value;
  removeInfo('filters');
  var filterData = decodeURI(filter).toLowerCase().split('=');
  if (filterData[0].indexOf('manuf') === 0) {
    filterData[1] = filterData[1].replace('_', ' ');
    setValueDropDown(`#${filterData[0].replace('manuf_', '')}`, filterData[1])
  } else {
    getEl('#catalog-filters').querySelectorAll('.filter-item').forEach(el => {
      key = el.dataset.key;
      value = el.dataset.value;
      if (key.toLowerCase() == filterData[0] && value.toLowerCase() == filterData[1]) {
        saveFilter(key, value);
      }
    });
  }
}

// Очистка фильтров:

function clearFilters(event) {
  if (event.currentTarget.classList.contains('disabled')) {
    return;
  }
  if (curSelect === 'catalog' || curSelect === 'zip') {
    getDocumentScroll();
    if (curSelect === 'catalog') {
      clearFiltersCatalog();
    }
    if (curSelect === 'zip') {
      clearFiltersZip();
    }
    getEl('#filters').querySelectorAll('.filter').forEach(el => {
      if (window.innerWidth >= 767 && el.classList.contains('default-open')) {
        el.classList.remove('close');
      } else {
        el.classList.add('close');
      }
    });
    selectCards();
    setDocumentScroll();
  }
}

//=====================================================================================================
//  Функции для создания фильтров каталога:
//=====================================================================================================

// Инициализация фильтров каталога:

function initFiltersCatalog() {
  var data = checkFiltersIsNeed();
  fillTemplate({
    area: '#catalog-filters',
    items: data,
    sub: [{
      area: '.item.item',
      items: 'items',
      sub: [{
        area: '.item.subitem',
        items: 'items',
      }]
    }]
  });
  addTooltips('color');
}

// Добавление всплывающих подсказок к фильтрам каталога:

function addTooltips(key) {
  var elements = document.querySelectorAll(`[data-key=${key}]`);
  if (elements) {
    elements.forEach(el => {
      getEl('.title.row', el).dataset.tooltip = el.textContent.trim();
    });
  }
}

// Проверка необходимости фильтров на странице и добавление необходимых данных:

function checkFiltersIsNeed() {
  var data = JSON.parse(JSON.stringify(catalogFiltersData)),
      isExsist = false;
  data = data.filter(filter => {
    if (filter.items) {
      filter.items = filter.items.filter(item => {
        isExsist = curItems.find(card => card[filter.key] == item.value || card[item.value] == 1);
        if (isExsist) {
          if (item.items) {
            item.items = item.items.filter(subItem => {
              isExsist = curItems.find(card => card[filter.key] == item.value && card.subcat == subItem.value);
              if (isExsist) {
                return true;
              }
            });
          }
          if (item.items && !isEmptyObj(item.items)) {
            item.isBtn = '';
          } else {
            item.isBtn = 'hidden';
          }
          return true;
        }
      });
    }
    if (filter.items && !isEmptyObj(filter.items)) {
      if (filter.key === 'cat' && pageId === 'equip' && !location.search) {
        return;
      }
      if (filter.key === 'brand' && pageId === 'equip' && location.search) {
        filter.isOpen = 'close';
      }
      return true;
    }
  });
  return data;
}

//=====================================================================================================
//  Функции для работы с фильтрами каталога:
//=====================================================================================================

// Выбор значения фильтра каталога:

function selectFilterCatalog(event) {
  event.stopPropagation();
  var curEl;
  if (event.currentTarget.classList.contains('pill')) {
    curEl = getEl(`#catalog-filters [data-key="${event.currentTarget.dataset.key}"][data-value="${event.currentTarget.dataset.value}"]`);
  } else {
    if (!event.target.closest('.title.row') || event.currentTarget.classList.contains('disabled')) {
      return;
    }
    curEl = event.currentTarget;
  }
  getDocumentScroll();
  var key = curEl.dataset.key,
      value = curEl.dataset.value,
      subkey = curEl.dataset.subkey;

  if (curEl.classList.contains('checked')) {
    curEl.classList.remove('checked');
    curEl.classList.add('close');
    curEl.querySelectorAll('.item.checked').forEach(subItem => subItem.classList.remove('checked'));
    removeFilter(key, value, subkey);
    if (!subkey) {
      deleteFromFiltersInfo(key, value);
    }
  } else {
    curEl.classList.add('checked');
    curEl.classList.remove('close');
    var parentItem = curEl.closest('.item:not(.subitem)');
    if (parentItem && !parentItem.classList.contains('checked')) {
      parentItem.classList.add('checked');
      addInFiltersInfo(parentItem.dataset.key, parentItem.dataset.value, parentItem);
    }
    saveFilter(key, value, subkey);
    if (!subkey) {
      addInFiltersInfo(key, value, curEl);
    }
  }
  var filters = getInfo('filters')[pageUrl];
  if (!filters || isEmptyObj(filters)) {
    selectedItems = '';
    showCards();
    getEl('.clear-filter').classList.add('disabled');
  } else {
    selectCards('catalog');
  }
  toggleToActualFilters(event.currentTarget);
  createFiltersInfo();

  if (window.innerWidth >= 767) {
    if (getEl('#filters').style.position === 'static') {
      setDocumentScroll();
    }
  } else {
    setDocumentScroll();
  }
}

// Добавление данных в хранилище о выбранных фильтрах:

function saveFilter(key, value, subkey) {
  var filters = getInfo('filters');
  if (!filters[pageUrl]) {
    filters[pageUrl] = {};
  }
  if (!filters[pageUrl][key]) {
    filters[pageUrl][key] = {};
  }
  if (subkey) {
    if (!filters[pageUrl][key][subkey]) {
      filters[pageUrl][key][subkey] = {};
    }
    if (!filters[pageUrl][key][subkey][value]) {
      filters[pageUrl][key][subkey][value] = {};
    }
  } else {
    if (!filters[pageUrl][key][value]) {
      filters[pageUrl][key][value] = {};
    }
  }
  saveInfo('filters', filters);
}

// Удаление данных из хранилища о выбранных фильтрах:

function removeFilter(key, value, subkey) {
  var filters = getInfo('filters');
  if (!subkey) {
    delete filters[pageUrl][key][value];
    if (isEmptyObj(filters[pageUrl][key])) {
      delete filters[pageUrl][key];
    }
  } else {
    delete filters[pageUrl][key][subkey][value];
    if (filters[pageUrl][key][subkey] && isEmptyObj(filters[pageUrl][key][subkey])) {
      filters[pageUrl][key][subkey] = {};
    }
  }
  saveInfo('filters', filters);
}

// Удаление данных из хранилища обо всех фильтрах:

function removeAllFilters() {
  var filters = getInfo('filters');
  filters[pageUrl] = {};
  saveInfo(`filters`, filters);
}

// Блокировка неактуальных фильтров:

function toggleToActualFilters(filter) {
  var curArray = selectedItems === '' ? curItems : selectedItems,
      menuFilters = getEl('#catalog-filters'),
      curFilters = menuFilters.querySelectorAll(`.item:not(.subitem).checked[data-key="${filter.dataset.key}"]`),
      checked = menuFilters.querySelectorAll('.item:not(.subitem).checked'),
      filterItems;

  if (checked.length == 0) {
    menuFilters.querySelectorAll('.item:not(.subitem)').forEach(item => {
      item.classList.remove('disabled');
      item.querySelectorAll('.subitem').forEach(subitem => {
        subitem.classList.remove('disabled');
      });
    });
    return;
  }

  if (curFilters.length > 0) {
    filterItems = menuFilters.querySelectorAll(`.item:not(.subitem):not([data-key="${filter.dataset.key}"])`);
  } else {
    filterItems = menuFilters.querySelectorAll('.item:not(.subitem)');
  }

  var key, value, isExsist, isFound;
  filterItems.forEach(item => {
    isExsist = false;
    key = item.dataset.key;
    value = item.dataset.value;

    if (checked.length == 1 && key == checked[0].dataset.key) {
      item.classList.remove('disabled');
      item.querySelectorAll('.subitem').forEach(subitem => {
        subitem.classList.remove('disabled');
      });
    } else {
      isExsist = curArray.find(card => {
        if (card[key] == value || card[value] == 1) {
          item.classList.remove('disabled');
          return true;
        }
      });
      if (!isExsist) {
        item.classList.add('disabled');
        item.classList.add('close');
        if (item.classList.contains('checked')) {
          item.classList.remove('checked');
          item.querySelectorAll('.subitem').forEach(subitem => {
            subitem.classList.remove('checked');
          });
          removeFilter(key, value);
          deleteFromFiltersInfo(key, value);
        }
      }
      item.querySelectorAll('.subitem').forEach(subitem => {
        isFound = false;
        isFound = curArray.find(card => {
          if (card.cat == value && card.subcat == subitem.dataset.value) {
            subitem.classList.remove('disabled');
            return true;
          }
        });
        if (!isFound) {
          subitem.classList.add('disabled');
        }
      });
    }
  });
}

// Очистка фильтров каталога:

function clearFiltersCatalog() {
  getEl('#catalog-filters').querySelectorAll('.item').forEach(el => {
    el.classList.remove('checked', 'disabled');
    el.classList.add('close');
  });
  removeAllFilters();
  removePositions();
  clearFiltersInfo();
  getEl('.clear-filter').classList.add('disabled');
}

// Выбор сохраненных фильтров на странице или их удаление если их больше нет на странице:

function checkFilters() {
  var info = getInfo('filters'),
      filters = info[pageUrl];
  if (!filters || isEmptyObj(filters)) {
    return;
  }
  var curFilters = {},
      curFilter,
      curItem;
  for (var k in filters) {
    curFilters[k] = {};
    for (var kk in filters[k]) {
      curFilters[k][kk] = {};
      curItem = getCurFilterItem(k, kk);
      if (curItem) {
        selectCardsByFilterCatalog(curFilters);
        changeFilterClass(curItem);
        for (var kkk in filters[k][kk]) {
          curFilters[k][kk][kkk] = {};
          curItem = getCurFilterItem(k, kkk, kk);
          if (curItem) {
            selectCardsByFilterCatalog(curFilters);
            changeFilterClass(curItem);
          } else {
            delete info[pageUrl][k][kk][kkk];
          }
        }
        if (isEmptyObj(info[pageUrl][k][kk])) {
          info[pageUrl][k][kk] = {};
        }
      } else {
        delete info[pageUrl][k][kk];
      }
    }
    if (isEmptyObj(info[pageUrl][k])) {
      delete filters[pageUrl][k];
    } else {
      curFilter = getEl(`#filter-${k}`);
      if (curFilter) {
        curFilter.classList.remove('close');
      }
    }
  }
  if (filters || !isEmptyObj(filters)) {
    curSelect = 'catalog';
  }
  saveInfo('filters', info);
}

// Поиск фильтра на странице:

function getCurFilterItem(key, value, subkey) {
  var curItem;
  if (subkey) {
    curItem = getEl(`#catalog-filters [data-subkey="${subkey}"][data-value="${value}"]`);
  } else {
    curItem = getEl(`#catalog-filters [data-key="${key}"][data-value="${value}"]`);
    addInFiltersInfo(key, value, curItem);
  }
  return curItem;
}

// Визуальное отображение сохраненных фильтров:

function changeFilterClass(curItem) {
  if (curItem) {
    curItem.classList.add('checked');
    var filterItem = curItem.closest('.item');
    if (filterItem) {
      filterItem.classList.remove('close');
    }
    toggleToActualFilters(curItem);
  }
}

//=====================================================================================================
//  Функции для работы с данными о выбранных фильтрах:
//=====================================================================================================

// Добавление фильтра в информацию о выбранных фильтрах:

function addInFiltersInfo(key, value, el) {
  filterItems.push({
    key: key,
    value: value,
    title: getEl('.text', el).textContent
  });
}

// Удаление фильтра из информации о выбранных фильтрах:

function deleteFromFiltersInfo(key, value) {
  var index = filterItems.findIndex(item => item.key === key && item.value === value);
  filterItems.splice(index, 1);
}

// Созание списка выбранных фильтров:

function createFiltersInfo() {
  fillTemplate({
    area: '#filters-info',
    items: filterItems
  });
  setPaddingToBody();
}

// Очистка информации о выбранных фильтрах:

function clearFiltersInfo() {
  filterItems = [];
  createFiltersInfo();
}

//=====================================================================================================
//  Функции для создания фильтров запчастей:
//=====================================================================================================

// Создание и инициализация работы фильтров запчастей:

function initFiltersZip() {
  var zipFilters = getEl('#zip-filters');
  if (!zipFilters) {
    return;
  }
  if (website !== 'skipper' && path[path.length - 1] !== 'zip') {
    hideElement(zipFilters);
    return;
  }
  fillTemplate({
    area: getEl('#zip-selects'),
    items: zipSelectsData,
  });
  showElement(zipFilters);
  getEl('#zip-selects').querySelectorAll('.activate').forEach(el => initDropDown(el, selectFilterZip));
  fillFilterZip(getEl('#zip-selects').firstElementChild);
  fillFilterZip(getEl('#oem'));
}

// Заполнение выпадающего списка вариантов фильтра/поиска:

function fillFilterZip(filter) {
  if (!filter) {
    return;
  }
  var data = getFilterZipData(filter.id);
  fillTemplate({
    area: getEl('.list', filter),
    items: data
  });
  if (filter.id !== 'oem') {
    toggleFilterZip(filter, data.length);
  }
}

// Переключение блокировки фильтров, следующих за заполняемым:

function toggleFilterZip(filter, data) {
  var nextFilter = filter.nextElementSibling;
  if (data) {
    unlockFilterZip(filter);
    while (nextFilter) {
      lockFilterZip(nextFilter);
      nextFilter = nextFilter.nextElementSibling;
    }
  } else {
    lockFilterZip(filter);
    if (nextFilter && getEl('#zip-selects').firstElementChild !== filter) {
      fillFilterZip(nextFilter);
    }
  }
}

// Подготовка данных для создания списка вариантов фильтра/поиска:

function getFilterZipData(key) {
  var curArray = curItems;
  if (website === 'skipper') {
    curArray = items;
  }
  if (key !== 'man' && key !== 'oem') {
    curArray = selectedItems;
  }
  var data = [];
  curArray.forEach(item => {
    if (item.manuf) {
      for (var k in item.manuf[key]) {
        if (key === 'man' || key === 'oem') {
          if (data.indexOf(k.trim()) === -1) {
            data.push(k);
          }
        } else {
          for (var kk in item.manuf[key][k]) {
            if (kk === getEl('#man').value && data.indexOf(k.trim()) === -1) {
              data.push(k);
            }
          }
        }
      }
    }
  });
  data.sort();
  return data;
}

// Разблокировка фильтра:

function unlockFilterZip(filter) {
  filter.removeAttribute('disabled');
}

// Блокировка фильтра:

function lockFilterZip(filter) {
  clearDropDown(filter);
  filter.setAttribute('disabled', 'disabled');
}

//=====================================================================================================
//  Функции для работы с фильтрами запчастей:
//=====================================================================================================

// Выбор значения фильтра запчастей:

function selectFilterZip(event) {
  selectCards('zip');
  var nextFilter = event.currentTarget.nextElementSibling;
  if (nextFilter) {
    fillFilterZip(nextFilter);
  }
}

// Очистка фильтров запчастей:

function clearFiltersZip() {
  var filter = getEl('#zip-selects').firstElementChild,
      nextFilter = filter.nextElementSibling;
  clearDropDown(filter);
  while (nextFilter) {
    lockFilterZip(nextFilter);
    nextFilter = nextFilter.nextElementSibling;
  }
  getEl('.clear-filter').classList.add('disabled');
}

//=====================================================================================================
//  Функции для создания галереи:
//=====================================================================================================

// Создание карточек товаров из массива:

var countItems = 0,
    countItemsTo = 0,
    itemsToLoad,
    incr;

function loadCards(cards) {
	if (cards) {
    countItems = 0;
    itemsToLoad = cards;
	} else {
    countItems = countItemsTo;
  }
  if (window.innerWidth > 2000) {
    if (view === 'list') {
      incr = 30;
    } else {
      incr = 60;
    }
  } else if (window.innerWidth < 1080) {
    if (view === 'list') {
      incr = 10;
    } else {
      incr = 20;
    }
  } else {
    if (view === 'list') {
      incr = 20;
    } else {
      incr = 40;
    }
  }
  countItemsTo = countItems + incr;
  if (countItemsTo > itemsToLoad.length) {
    countItemsTo = itemsToLoad.length;
  }
  if (countItems === countItemsTo) {
    return;
  }

  var data = [];
  for (var i = countItems; i < countItemsTo; i++) {
    data.push(itemsToLoad[i]);
  }
  var sub = [{
    area: '.carousel-item',
    items: 'images'
  }, {
    area: '.card-size',
    items: 'sizes'
  }];
  fillTemplate({
    area: view === 'list' ? bigCard : minCard,
    source: 'outer',
    items: data,
    target: '#gallery',
    sub: view === 'list' ? sub : undefined,
    method: countItems === 0 ? 'inner' : 'beforeend'
  });
  setFiltersPosition();

  if (view === 'list') {
    document.querySelectorAll('.big-card').forEach(card => {
      renderCarousel(getEl('.carousel', card));
      checkCart(card);
      addActionTooltip(card);
    });
  }
  if (view === 'blocks') {
    document.querySelectorAll('.min-card').forEach(card => {
      checkImg(card);
      checkCart(card);
      addActionTooltip(card);
    });
  }
}

// Вывод информации об акции в подсказке в карточке товара:

function addActionTooltip(card) {
  var id = card.dataset.action;
  if (id && actions && actions[id]) {
    var pill = getEl('.action', card);
    pill.dataset.tooltip = actions[id].descr || '';
    pill.setAttribute('text-align', 'left');
  }
}

//=====================================================================================================
//  Функции для работы с карточками товаров:
//=====================================================================================================

// Отображение карточек на странице:

function showCards() {
  if (curItems.length && selectedItems === '') {
    loadCards(curItems);
    showElement('#gallery', 'flex');
    hideElement('#gallery-notice');
  } else {
    if (selectedItems.length === 0) {
      showElement('#gallery-notice', 'flex');
      hideElement('#gallery');
      setFiltersPosition();
    } else {
      loadCards(selectedItems)
      showElement('#gallery', 'flex');
      hideElement('#gallery-notice');
    }
  }
  setDocumentScroll(0);
  setContentWidth();
}

// Добавление новых карточек при скролле страницы:

function scrollGallery() {
  var scrolled = window.pageYOffset || document.documentElement.scrollTop;
  if (scrolled * 2 + window.innerHeight >= document.body.clientHeight) {
    loadCards();
    setContentWidth();
  }
}

// Переключение вида отображения карточек на странице:

function toggleView(event, newView) {
  if (view != newView) {
    getEl(`.view-${view}`).classList.remove('active');
    event.currentTarget.classList.add('active');
    view = newView;
    var gallery = getEl('#gallery');
    gallery.style.opacity = '0';
    showCards();
    gallery.style.opacity = '1';
  }
}

// Раскрытие в полный размер большой карточки:

function openBigCard(event) {
  var curCard = event.currentTarget.closest('.big-card');
  curCard.classList.toggle('open');
  if (curCard.classList.contains('open')) {
    event.currentTarget.setAttribute('tooltip', 'Свернуть');
  } else {
    event.currentTarget.setAttribute('tooltip', 'Раскрыть');
  }
  setFiltersPosition();
}

// Сворачивание большой карточки:

function closeBigCard(event) {
  var curCard = event.currentTarget.closest('.big-card');
  if (window.innerWidth < 767) {
    if (!(event.target.classList.contains('toggle-btn') || event.target.closest('.carousel') || event.target.closest('.card-size') || event.target.classList.contains('dealer-button'))) {
      curCard.classList.remove('open');
      getEl('.toggle-btn', curCard).setAttribute('tooltip', 'Раскрыть');
      setFiltersPosition();
    }
  }
}

//=====================================================================================================
// Отбор карточек товаров фильтрами и поисками:
//=====================================================================================================

// Запуск отбора карточек или его отмена:

function selectCards(search, textToFind) {
  if (search) {
    var type = typeof search === 'string' ? search : search.id;
    clearCurSelect(type);
    curSelect = type;
    startSelect(type, textToFind);
  } else {
    curSelect = null;
    selectedItems = '';
  }
  showCards();
  return selectedItems.length;
}

// Очистка текущего отбора:

function clearCurSelect(type) {
  if (type !== curSelect) {
    if (curSelect === 'catalog') {
      clearFiltersCatalog();
    } else if (curSelect === 'zip') {
      clearFiltersZip();
    } else if (curSelect === 'page-search' || curSelect === 'oem') {
      clearSearch('#' + curSelect);
    }
    curSelect = null;
    selectedItems = '';
  }
}

// Запуск отбора:

function startSelect(type, textToFind) {
  if (type === 'catalog') {
    selectCardsByFilterCatalog();
  } else if (type === 'zip') {
    selectCardsByFilterZip();
  } else if (type === 'page-search') {
    selectCardsBySearchPage(textToFind);
  } else if (type === 'oem') {
    selectCardsBySearchOem(textToFind);
  }
}

// Отбор карточек фильтром каталога:

function selectCardsByFilterCatalog(filters) {
  filters = filters || getInfo('filters')[pageUrl];
  var isFound;
  selectedItems = curItems.filter(card => {
    for (var k in filters) {
      isFound = false;
      for (var kk in filters[k]) {
        if (filters[k][kk] && !isEmptyObj(filters[k][kk])) {
          for (var kkk in filters[k][kk]) {
            if (card.cat == kk && card.subcat == kkk) {
              isFound = true;
            }
          }
        } else {
          if (card[k] == kk || card[kk] == 1) {
            isFound = true;
          }
        }
      }
      if (!isFound) {
        return false;
      }
    }
    return true;
  });
  getEl('.clear-filter').classList.remove('disabled');
}

// Отбор карточек фильтром запчастей:

function selectCardsByFilterZip() {
  var curArray = curItems;
  if (website === 'skipper') {
    curArray = items;
  }
  var filters = getFilterZipItems(),
      isFound;
  selectedItems = curArray.filter(card => {
    if (card.manuf_filter) {
      for (var row of card.manuf_filter) {
        for (var key in filters) {
          isFound = false;
          if (row[key] && row[key].indexOf(filters[key]) >= 0) {
            isFound = true;
          } else {
            break;
          }
        }
        if (isFound) {
          return true;
        }
      }
    }
  });
  getEl('.clear-filter').classList.remove('disabled');
}

// Получение значений выбранных фильтров:

function getFilterZipItems() {
  var filters = {};
  getEl('#zip-selects').querySelectorAll('.activate').forEach(el => {
    if (el.value) {
      filters[el.id] = el.value;
    }
  });
  return filters;
}

// Отбор карточек поиском по странице:

function selectCardsBySearchPage(textToFind) {
  var regEx = RegExp(textToFind, 'gi');
  selectedItems = curItems.filter(el => el.search.search(regEx) >= 0);
}

// Отбор карточек поиском по OEM:

function selectCardsBySearchOem(textToFind) {
  selectedItems = curItems.filter(item => {
    if (item.manuf) {
      for (var k in item.manuf.oem) {
        if (k == textToFind) {
          return true;
        }
      }
    }
  });
}

//=====================================================================================================
//  Сортировка карточек товаров:
//=====================================================================================================

// Сортировка карточек товаров на странице:

function sortItems(event) {
  var key = event.currentTarget.value;
  if (!key) {
    curItems = JSON.parse(JSON.stringify(window[`${pageUrl}Items`]));
    if (curSelect) {
      startSelect(curSelect);
    }
  } else {
    var type = key.indexOf('price') >= 0 ? 'numb': 'text';
    curItems.sort(sortBy(key, type));
    if (selectedItems !== '') {
      selectedItems.sort(sortBy(key, type));
    }
  }
  showCards();
}
