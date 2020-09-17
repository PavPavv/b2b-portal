'use strict';

// Для корректной работы скрипта необходимо подключение перед ним main.js (не будет работать без объектов DropDown и Search)

//=====================================================================================================
// Работа таблиц:
//=====================================================================================================

// В каком виде нужно передавать данные в функцию initTable:

// var settings = {
//   data: [{...}, {...}]                             Данные для заполнения таблицы - массив объектов, где каждый объект - данные строки (по умолчанию [])
//   control: {                                       Имеет ли таблица панель управления (по умолчанию false). Если да, то в объекте перечислить элементы:
//     pagination: true / false                         - наличие пагинации (по умолчанию false)
//     search: 'placeholder' / false                    - наличие общего поиска (по умолчанию false)
//     toggle: true / false                             - наличие пагинации (по умолчанию false)
//     pill: true / false                               - наличие чекбоксов-"пилюль" (по умолчанию false)
//     setting: true / false                            - наличие настроек отображения/скрытия (по умолчанию false)
//   }
//   head: true / false                               Имеет ли таблица шапку (по умолчанию false)
//   result: true / false                             Имеет ли таблица строку "итого" (по умолчанию false)
//   sign: '#' / '@@' / другой,                       Символ для поиска мест замены в html (по умолчанию - '#')
//   sub: [{                                          Данные о подшаблонах (по умолчанию подшаблонов нет) - как заполнять смотри fillTemplate
//     area: селектор,
//     items: название ключа в data
//   }],
//   trFunc: 'onclick=functionName(event,#key#)'      Обработчик, навешиваемый на строку таблицы (по умолчанию false)
//   cols:                                            Параметры столбцов таблицы (для таблиц с готовым шаблонов в html данный параметр пропускаем)
//   [{                                                 что вкючает параметр одного столбца:
//     key: 'key'                                       - ключ в данных по которому находится информация для данного столбца
//     title: 'Заголовок'                               - заголовок столбца
//     resize: true или false                           - кнпока перетаскивания столбца (по умолчанию true)
//     result: 'kolv' / 'sum'                           - формат итогов по колонке (умолчанию false)
//     sort: 'text' / 'numb' / 'date'                   - нужна ли сортировка по столбцу и ее формат (по умолчанию false)
//     filter: 'full' / 'search' / 'checkbox'           - нужна ли фильтрация по столбцу и ее формат (по умолчанию false)
//     content: #key# / html разметка                   - данные ячейки тела таблицы, если #key#, то пропускаем, если отличается, то вносим html разметку с маяками (по умолчанию #key#)
//   }]
// }

// Пример инициализации таблицы, имеющей готовый html-шаблон в разметке:

// var settings = {
//   data: [{...}, {...}, {...}],
//   head: true,
//   result: false
// }
// initTable('#tableId', settings);

// // Пример инициализации таблицы, которую необходимо заполнить динамически:

// var settings = {
//   data: [{...}, {...}, {...}],
//   head: true,
//   result: false,
//   cols: [{
//     key: 'access',
//     title: 'Доступ',
//     content: '<div class="toggle #access#" onclick="toggleAccess(event)"><div class="toggle-in"></div></div>'
//   }, {
//     key: 'title',
//     title: 'Название товара',
//     sort: 'text',
//     filter: 'search'
//   }, {
//     key: 'price',
//     title: 'Цена товара',
//     sort: 'numb',
//     filter: 'search'
//   }, {
//     key: 'system',
//     title: 'Система налогообложения',
//     sort: 'text',
//     filter: 'full'
//   }, {
//     key: 'date',
//     title: 'Дата',
//     sort: 'date',
//     filter: 'search'
//   }, {
//     key: 'docs',
//     title: 'Документы',
//     content: '<div class="docs row"><div class="mark icon #status#" data-tooltip="#status_info#"></div><a href="url" target="_blank" data-tooltip="#info#" text="left" help>#title#</a></div>',
//     filter: 'filter'
//   }],
//   sub: [{area: '.docs', items: 'docs'}]
// }
// initTable('#tableId', settings);

// Инициализация таблицы:

function initTable(el, settings) {
  var el = getEl(el);
  if (el && el.id) {
    if (settings.cols) {
      createTable(el, settings);
    }
    window[`${el.id}Table`] = new Table(el, settings);
  }
}

// Создание таблицы:

function createTable(area, settings) {
  if (settings.control) {
    var control = createTableControl(settings);
    area.appendChild(control);
  }
  var content = createTableContent(area.id, settings);
  area.appendChild(content);
}

// Создание панели управления для таблицы:

function createTableControl(settings) {
  var options = settings.control,
      pagination = '',
      search = '',
      toggle = '',
      pill = '',
      setting = '';
  if (options.pagination) {
    pagination =
    `<div class="pagination row">
      <div class="arrow blue icon left"></div>
      <div class="title">1-20 из 258</div>
      <div class="arrow blue icon"></div>
    </div>`;
  }
  if (options.search) {
    search =
    `<form class="search row">
      <input type="text" data-value="" placeholder="${options.search}">
      <input class="search icon" type="submit" value="">
      <div class="close icon"></div>
    </form>`;
  }
  if (options.toggle) {
    toggle =
    ``;
  }
  if (options.pill) {
    pill =
    ``;
  }
  if (options.setting) {
    setting = `<div class="settings icon"></div>`;
  }
  var control = document.createElement('div');
  control.classList.add('control', 'row');
  control.innerHTML =
  `<div class="left-side row">
    ${pagination}
    ${search}
  </div>
  <div class="right-side row">
    ${toggle}
    ${pill}
    ${setting}
  </div>`;
  return control;
}

// Создание панели управления для таблицы:

function createTableContent(id, settings) {
  var headList = '',
      resultList = '',
      bodyList = '',
      trFunc = settings.trFunc || '';

  settings.cols.forEach((col, index) => {
    if (settings.head) {
      headList += createTableHead(col, index);
      if (settings.result) {
        resultList += createTableResult(col);
      }
    }
    bodyList += createTableBody(col, settings.sign);
  });

  var table = document.createElement('div');
  table.classList.add('table');
  table.innerHTML =
  `<table class="head">
    <thead>
      <tr>${headList}</tr>
      <tr class="results">${resultList}</tr>
    </thead>
  </table>
  <table>
    <tbody id=${id}-body>
      <tr ${trFunc}>${bodyList}</tr>
    </tbody>
  </table>`;
  return table;
}

// Создание шапки таблицы:

function createTableHead (col, index) {
  var th;
  if (!col.resize || col.resize) {
    var resize =`<div class="resize-btn"></div>`;
  }
  if (!col.sort && !col.filter) {
    th =
    `<th id="${index + 1}">
      <div>${col.title || ''}</div>
      ${resize || ''}
    </th>`;
  } else {
    var sort = '',
        filter = '';
    if (col.sort) {
      var sortDown = col.sort === 'numb' ? 'По возрастанию' : (col.sort === 'date' ? 'Сначала новые' : 'От А до Я');
      var sortUp = col.sort === 'numb' ? 'По убыванию' : (col.sort === 'date' ? 'Сначала старые' : 'От Я до А');
      sort =
      `<div class="sort-box">
        <div class="title">Сортировка</div>
        <div class="sort down row">
          <div class="sort down icon"></div>
          <div>${sortDown}</div>
        </div>
        <div class="sort up row">
          <div class="sort up icon"></div>
          <div>${sortUp}</div>
        </div>
      </div>`;
    }
    if (col.filter) {
      var search = '',
          items = '';
      if (col.filter !== 'checkbox') {
        search =
        `<form class="search row">
          <input type="text" data-value="" placeholder="Поиск...">
          <input class="search icon" type="submit" value="">
          <div class="close icon"></div>
        </form>`;
      }
      if (col.filter !== 'search') {
        items = '<div class="items"></div>';
      }
      var filter =
      `<div class="filter-box">
        <div class="title">Фильтр</div>
        ${search}
        ${items}
      </div>`;
    }
    th =
    `<th id="${index + 1}" class="activate box" data-key="${col.key || ''}" data-sort="${col.sort || ''}">
      <div class="head row">
        <div class="title">${col.title || ''}</div>
        <div class="icons row">
          <div class="triangle icon"></div>
          <div class="filter icon"></div>
        </div>
        </div>
        <div class="drop-down">
          ${sort}
          ${filter}
        </div>
      </div>
      ${resize || ''}
    </th>`;
  }
  return th;
}

// Создание результатов таблицы:

function createTableResult(col) {
  if (!col.result) {
    return '<th></th>';
  }
  var th =
  `<th>
    <div class="row">
      <div class="sum icon"></div>
      <div data-key="${col.key}" data-type="${col.result}"></div>
    </div>
  </th>`;
  return th;
}

// Создание тела таблицы:

function createTableBody(col, sign = '#') {
  if (!col.content) {
    if (!col.key) {
      return `<td></td>`;
    } else {
      return `<td>${sign}${col.key}${sign}</td>`;
    }
  }
  return `<td>${col.content}</td>`;
}

// Объект таблицы:

function Table(obj, settings = {}) {
  // Константы:
  this.initialData = Array.isArray(settings.data) ? settings.data.filter(el => el) : [];

  // Элементы для работы:
  this.wrap = obj;
  this.tab = getEl(`.tab.${obj.id}`);
  this.table = getEl('.table', obj);
  this.head = getEl('thead', obj);
  this.results = getEl('.results', this.head);
  this.body = getEl('tbody', obj);
  if (this.head) {
    this.resizeBtns = this.head.querySelectorAll('.resize-btn');
    this.dropDowns = obj.querySelectorAll('.activate');
  }

  // Динамические переменные:
  this.filters = {};
  this.data = JSON.parse(JSON.stringify(this.initialData));
  this.dataToLoad = this.data;
  this.countItems = 0;
  this.countItemsTo = 0;
  this.incr = 20;
  this.curColumn = null;
  this.startOffset = 0;

  // Установка обработчиков событий:
  this.setEventListeners = function() {
    if (this.tab) {
      this.tab.addEventListener('click', (event) => this.open(event));
    }
    this.table.addEventListener('scroll', () => this.scrollTable());
    if (this.head) {
      if (this.resizeBtns) {
        this.resizeBtns.forEach(el => el.addEventListener('mousedown', (event) => this.startResize(event)));
      }
      this.dropDowns.forEach(el => {
        el.addEventListener('change', event => this.changeData(event));
      });
    }
  }
  this.setEventListeners();

  // Включение/отключение вкладки таблицы в зависимости от наличия данных:
  this.initTab = function() {
    if (this.tab) {
      if (this.data.length) {
        this.tab.classList.remove('disabled');
      } else {
        this.tab.classList.add('disabled');
      }
      showElement(this.tab, 'flex');
    }
  }

  // Преобразование входящих данных:
  this.convertData = function() {
    this.data.forEach(el => {
      for (var key in el) {
        if (!el[key] && el[key] != 0) {
          el[key] = '&ndash;';
        }
      }
    });
  }

  // Заполнение итогов таблицы:
  this.fillResults = function() {
    if (!this.results) {
      return;
    }
    this.results.querySelectorAll('[data-key]').forEach(result => {
      var total = 0;
      if (this.dataToLoad && this.dataToLoad.length) {
        this.dataToLoad.forEach(el => {
          if (el[result.dataset.key]) {
            total += parseFloat(el[result.dataset.key].toString().replace(" ", ''), 10);
          }
        });
      }
      if (result.dataset.type === 'sum') {
        total = convertPrice(total);
      }
      result.textContent = total;
    });
  }

  // Заполнение чекбоксов таблицы:
  this.fillCheckboxes = function() {
    if (!this.dropDowns) {
      return;
    }
    var items;
    this.dropDowns.forEach(el => {
      items = getEl('.items', el);
      if (items) {
        var key = el.dataset.key,
            unique = [],
            list = '',
            value;
        this.dataToLoad.forEach(el => getValue(el[key]));
        function getValue(el) {
          value = (typeof el === 'string' || typeof el === 'number') ? el : null;
          if (value && unique.indexOf(value) === -1) {
            unique.push(value);
          }
        }
        unique.forEach(el => {
          list +=
          `<div class="item row" data-value="${el}">
            <div class="checkbox icon"></div>
            <div>${el}</div>
          </div>`;
        });
        items.innerHTML = list;
      }
    });
  }

  // Загрузка данных в таблицу:
  this.loadData = function(data) {
    if (data && data.length === 0) {
      this.body.innerHTML = '';
      return;
    }
    if (data) {
      this.countItems = 0;
      this.dataToLoad = data;
    } else {
      this.countItems = this.countItemsTo;
    }
    this.countItemsTo = this.countItems + this.incr;
    if (this.countItemsTo > this.dataToLoad.length) {
      this.countItemsTo = this.dataToLoad.length;
    }
    if (this.countItems === this.countItemsTo) {
      return;
    }

    var tableItems = [];
    for (let i = this.countItems; i < this.countItemsTo; i++) {
      tableItems.push(this.dataToLoad[i]);
    }
    var list = fillTemplate({
      area: this.body,
      items: tableItems,
      sub: settings.sub,
      sign: settings.sign,
      action: 'return'
    });

    if (this.countItems === 0) {
      this.body.innerHTML = list;
    } else {
      this.body.insertAdjacentHTML('beforeend', list);
    };
    this.setResizeHeight();
  }

  // Подгрузка таблицы при скролле:
  this.scrollTable = function() {
    if (this.table.scrollTop * 2 + this.table.clientHeight >= this.table.scrollHeight) {
      this.loadData();
    }
  }

  // Выравнивание столбцов таблицы:
  this.align = function() {
    if (!this.head) {
      return;
    }
    var bodyCells = this.body.querySelectorAll('tr:first-child > td');
    if (bodyCells) {
      bodyCells.forEach((el, index) => {
        var newWidth = el.offsetWidth  + 'px';
        changeCss(`#${this.wrap.id} th:nth-child(${index + 1})`, ['width', 'minWidth', 'maxWidth'], newWidth);
        changeCss(`#${this.wrap.id} td:nth-child(${index + 1})`, ['width', 'minWidth', 'maxWidth'], newWidth);
      });
    }
  }

  // Установка высоты подсветки кнопки ресайза (чтобы была видна, но не увеличивала скролл):
  this.setResizeHeight = function() {
    if (!this.head) {
      return;
    }
    changeCss('thead .resize-btn:hover::after', 'height', this.body.offsetHeight - 5 + 'px');
  }

  // Открытие таблицы при клике на вкладку:
  this.open = function(event) {
    if (event.currentTarget.classList.contains('disabled')) {
      return;
    }
    var activeTable = getEl('.table-wrap.active');
    if (activeTable) {
      hideElement(activeTable);
      activeTable.classList.remove('active');
    }
    document.querySelectorAll('.tabs .tab').forEach(el => el.classList.remove('checked'));
    event.currentTarget.classList.add('checked');
    this.show();
  }

  // Работа с данными таблицы:
  this.changeData = function(event) {
    var dropDown = event.currentTarget,
        target = event.target,
        key = dropDown.dataset.key;
    if (target.classList.contains('sort')) {
      this.sortData(dropDown, target, key);
    } else {
      var type = target.classList.contains('search') ? 'search' : 'filter',
          action = dropDown.value ? 'save' : 'remove',
          value = type === 'search' ? dropDown.value : target.dataset.value;
      this.changeFilter(action, type, value, key);
      this.filterData();
    }
    dropDown.classList.remove('open');
    this.loadData(this.dataToLoad);
    this.fillResults();
  }

  // Сортировка данных:
  this.sortData = function(dropDown, target, key) {
    var type = dropDown.dataset.sort,
        key = target.classList.contains('down') ? key : '-' + key;
    this.head.querySelectorAll('.sort.checked').forEach(el => {
      var th = el.closest('.activate');
      if (th.id !== dropDown.id) {
        el.classList.remove('checked');
      }
    });
    var curSort = getEl('.sort.checked', this.head);
    if (curSort) {
      this.dataToLoad.sort(sortBy(key, type));
    } else {
      this.data = JSON.parse(JSON.stringify(this.initialData));
      this.filterData();
    }
  }

  // Сохранение/удаление фильтра:
  this.changeFilter = function(action, type, value, key) {
    if (action === 'save') {
      if (!this.filters[key] || this.filters[key].type !== type) {
        this.filters[key] = {
          type: type,
          values: [value]
        };
      } else {
        if (this.filters[key].values.indexOf(value) === -1) {
          this.filters[key].values.push(value);
        }
      }
    } else {
      if (this.filters[key] && this.filters[key].type === type) {
        if (type === 'search') {
          delete this.filters[key];
        } else {
          var index = this.filters[key].values.indexOf(value);
          if (index !== -1) {
            if (this.filters[key].values.length === 1) {
              delete this.filters[key];
            } else {
              this.filters[key].values.splice(index, 1)
            }
          }
        }
      }
    }
  }

  // Фильтрация данных:
  this.filterData = function() {
    if (!isEmptyObj(this.filters)) {
      var isFound, filter;
      this.dataToLoad = this.data.filter(item => {
        for (var key in this.filters) {
          filter = this.filters[key];
          isFound = false;
          if (checkValue(filter.type, filter.values, item[key])) {
            isFound = true;
          }
          if (!isFound) {
            return false;
          }
        }
        return true;
      });
    } else {
      this.dataToLoad = this.data;
    }
  }

  // Проверка совпадения со значениями фильтра:
  function checkValue(type, filterValues, itemValue) {
    var isFound = false;
    for (var value of filterValues) {
      if (type === 'search') {
        var regEx = RegExp(value, 'gi');
        if (itemValue.search(regEx) >= 0) {
          isFound = true;
        }
      } else {
        if (itemValue == value) {
          isFound = true;
        }
      }
    }
    return isFound;
  }

  // Запуск перетаскивания столбца:
  this.startResize = function(event) {
    this.curColumn = event.currentTarget.parentElement;
    this.startOffset = this.curColumn.offsetWidth - event.pageX;
    document.addEventListener('mousemove', this.resize);
    document.addEventListener('mouseup', this.stopResize);
  }

  // Перетаскивание столбца:
  this.resize = throttle((event) => {
    if (this.curColumn) {
      var newWidth = this.startOffset + event.pageX,
          fontSize = parseFloat(getComputedStyle(this.curColumn).fontSize, 10);
      newWidth = (newWidth > fontSize * 4.14) ? (newWidth + 'px') : (Math.floor(fontSize * 4.14) + 'px');
      changeCss(`#${this.wrap.id} th:nth-child(${this.curColumn.id})`, ['width', 'minWidth', 'maxWidth'], newWidth);
      changeCss(`#${this.wrap.id} td:nth-child(${this.curColumn.id})`, ['width', 'minWidth', 'maxWidth'], newWidth);
    }
  });

  // Остановка перетаскивания столбца:
  this.stopResize = () => {
    if (this.curColumn) {
      this.curColumn = null;
      document.removeEventListener('mousemove', this.resize);
      document.removeEventListener('mouseup', this.stopResize);
    }
  };

  // Визуальное отображение таблицы:
  this.show = function() {
    showElement(this.wrap);
    this.align();
    this.setResizeHeight();
    this.wrap.classList.add('active');
  }

  // Инициализация таблицы:
  this.init = function() {
    this.initTab();
    this.convertData();
    this.loadData(this.data);
    if (this.head) {
      this.dropDowns.forEach(el => new DropDownTable(el));
      this.fillCheckboxes();
      this.fillResults();
    }
    if (this.wrap.classList.contains('active')) {
      this.show();
    }
  }
  this.init();
}
