'use strict';

// Запускаем рендеринг страницы документов:
startReclmPage();

// Запуск страницы документов:
function startReclmPage() {
  sendRequest(`../json/recls_data.json`)
  // sendRequest(urlRequest.main, {action: '???'})
  .then(result => {
    var data = JSON.parse(result);
    initPage(data);
    var mobTable = {
      area: '#mob-rows',
      sign: '@@',
      items: data
    };
    fillTemplate(mobTable);
    getFilterData(data);
  })
  .catch(err => {
    console.log(err);
    initPage();
  });
}

// Инициализация страницы:

function initPage(data) {
  var settings = {
    data: data,
    control: {
      pagination: true,
      search: 'Поиск по типу заказа, номеру, контрагенту, заказчику...',
      setting: true
    },
    head: true,
    result: false,
    trFunc: 'onclick=showReclm(#id#)',
    cols: [{
      key: 'num',
      title: '№',
      sort: 'text',
      filter: 'search'
    }, {
      key: 'date',
      title: 'Дата',
      sort: 'date'
    }, {
      key: 'name',
      title: 'Наименование',
      sort: 'text',
      filter: 'search'
    }, {
      key: 'articul',
      title: 'Артикул',
      sort: 'text',
      filter: 'search'
    }, {
      key: 'manager',
      title: 'Менеджер',
      sort: 'text',
      filter: 'full'
    }, {
      key: 'trac',
      title: 'Статус',
      sort: 'text',
      filter: 'full',
      content: `<div class="#status# recl pill">#trac#</div>`
    }]
  };
  initTable('#reclm', settings);
  loader.hide();
}


//  Получить уникальные значения менеджеров для значений фильтров

function getFilterData(data) {
  var uniqueManager = new Set();
  var dataFilters = [];

  for (let i = 0; i < data.length; i++) {
    for (let key in data[i]) {
      if (key === 'manager') {
        uniqueManager.add(data[i][key]);
      }
    }
  }

  var arrManagers = Array.from(uniqueManager);
  for (let i = 0; i < arrManagers.length; i++) {
    var obj = new Object();
    obj.manager = arrManagers[i];
    dataFilters.push(obj);
  }

  var mobFilters = {
    area: '#test',
    sign: '@@',
    items: dataFilters
  };
  fillTemplate(mobFilters);
}


document.querySelectorAll('.filters').forEach(el => {
  el.querySelectorAll('.item .row').forEach (el => el.addEventListener('click', event => {
    event.stopPropagation();

    if (event.target.classList.contains('checkbox') || event.target.classList.contains('text')) {
      event.currentTarget.classList.toggle('checked');
    } else {
      console.log(el)
    }
  }));
})


function test1() {
  console.log('test')
}
test1();
