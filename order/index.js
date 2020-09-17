'use strict';

//=====================================================================================================
// Первоначальные данные для работы:
//=====================================================================================================

// Константы:

var tableNames = ['nomen', 'vputi', 'vnali', 'sobrn', 'otgrz', 'nedop', 'reclm'],
    tableKeys = {}, // Список ключей для их включения в таблицы
    reclmData;
tableKeys['nomen'] = ['artc', 'titl', 'pric', 'kolv', 'summ', 'skid']; //Номенклатура
tableKeys['vputi'] = ['artc', 'titl', 'dpst', 'kolv', 'paid', 'kdop']; //Ожидается
tableKeys['vnali'] = ['artc', 'titl', 'pric', 'kolv', 'summ', 'skid'];  //В наличии
tableKeys['sobrn'] = ['artc', 'titl', 'pric', 'kolv', 'summ', 'skid']; // Собран
tableKeys['otgrz'] = ['artc', 'titl', 'pric', 'kolv', 'summ', 'skid', 'preview', 'cods', 'harid', 'naklid', 'recl_num']; // Отгружен
tableKeys['nedop'] = ['artc', 'titl', 'pric', 'kolv', 'summ', 'stat']; //Недопоставка
tableKeys['reclm'] = ['recl_num', 'recl_date', 'artc', 'titl', 'pric', 'kolv', 'comp_summ', 'trac']; //Рекламации
// tableKeys['debzd'] = 'artc,titl,kolv,pric,summ,dpst,paid,prcd,prcp,kdop,vdlg,recv,nakl,over,lnk,preview,titllnk'; //Долг

// Динамическе переменные:

var items = {};

// Запускаем рендеринг страницы заказа:

startOrderPage();

//=====================================================================================================
// Получение и отображение информации о заказе:
//=====================================================================================================

// Запуск страницы заказа:

function startOrderPage() {
  sendRequest(`../json/order_data.json`)
  // sendRequest(urlRequest.main, {action: 'order', data: {order_id: document.location.search.replace('?', '')}})
  .then(result => {
    var data = JSON.parse(result);
    initPage(data);
  })
  .catch(err => {
    console.log(err);
    location.href = '/err404.html';
  });
}

// Инициализация страницы:

function initPage(data) {
  if (data.id) {
    if (!data.comment && !data.special) {
      console.log(data);
      data.isDisplay = 'displayNone';
    } else {
      if (!data.comment) {
        console.log(data.comment);
        data.isComment = 'displayNone';
      }
      if (!data.special) {
        data.isSpecial = 'displayNone';
      }
    }
    fillTemplate({
      area: '#order-info',
      items: data
    });
    fillTemplate({
      area: '#make-reclm .pop-up-body',
      items: data
    })
    var result = {};
    if (data.orderitems) {
      result = restoreArray(data.orderitems.arlistk, data.orderitems.arlistv);
    }
    createTables(result);
    initForm('#reclm-form', sendReclm);
  } else {
    location.href = '/err404.html';
  }
}

//=====================================================================================================
// Преобразование полученных данных:
//=====================================================================================================

// Преобразование данных из csv-формата:

function restoreArray(k, v) {
  var d = "@$",
      dd = "^@^",
      kk = k.split(d),
      vv = v.split(dd),
      fullInfo = [],
      result = {}
  tableNames.forEach(el => result[el] = []);
  for (var i = 0; i < vv.length; i++) {
    var vvv = vv[i].split(d),
        obj = {},
        list = {};
    tableNames.forEach(el => {
      list[el] = {};
    });
    for (var ii = 0; ii < vvv.length; ii++) {
      tableNames.forEach(el => {
        if (tableKeys[el].indexOf(kk[ii]) != -1) {
          if (vvv[ii]) {
            vvv[ii] = vvv[ii].toString().trim();
          }
          if (kk[ii] === 'skid' && vvv[ii]) {
            list[el][kk[ii]] = vvv[ii] + '%'
          } else {
            list[el][kk[ii]] = vvv[ii];
          }
        }
      });
      obj[kk[ii]] = vvv[ii];
    }
    tableNames.forEach(el => {
      if (checkInclusion(el, obj)) {
        var currentObj = list[el];
        if (el == 'otgrz') {
          // добавляем в данные стиль для степпера:
          if (currentObj.kolv > 1) {
            currentObj.qtyStyle = 'added';
          } else {
            currentObj.qtyStyle = 'disabled';
          }
          // reclmStyle = ? 'added' : '';
          // добавляем в данные id товара:
          currentObj.object_id = parseInt(currentObj.preview.match(/\d+/));
        }
        if (el == 'reclm') {
          var status = currentObj.trac.toLowerCase();
          if (status == 'зарегистрирована') {
            currentObj.status = 'registr';
          } else if (status == 'обрабатывается') {
            currentObj.status = 'wait';
          } else if (status == 'удовлетворена') {
            currentObj.status = 'yes';
          } else if (status == 'ну удовлетворена') {
            currentObj.status = 'no';
          } else if (status == 'исполнена') {
            currentObj.status = 'done';
          }
        }
        result[el].push(list[el]);
      }
    });
    fullInfo.push(obj);
  }
  // console.log(fullInfo);
  reclmData = result.otgrz;
  return result;
}

// Проверка включения в данные таблицы объекта данных:

function checkInclusion(name, obj) {
  if (name == "nomen" && obj["bkma"] != "Рекламации" && obj["bkma"] != "Собран") return 1;
  if (name == "otgrz" && obj["bkma"] == "Отгрузки") return 1;
  if (name == "nedop" && obj["bkma"] == "Недопоставка") return 1;
  if (name == "vputi" && obj["bkma"] == "ВПути") return 1;
  if (name == "sobrn" && obj["bkma"] == "Собран") return 1;
  if (name == "vnali" && obj["bkma"] == "ВНаличии") return 1;
  if (name == "reclm" && obj["bkma"] == "Рекламации") return 1;
  if ((name == "debzd" && a["recv"] > " ") || (name == "debzd" && obj['vdlg'] > " " && obj['kdop'] > " ")) return 1;
}

//=====================================================================================================
// Создание таблиц:
//=====================================================================================================

function createTables(result) {
  var nomenSettings = {
    data: result.nomen,
    head: true,
    result: true,
    cols: [{
      key: 'artc',
      title: 'Артикул',
      sort: 'text',
      filter: 'search'
    }, {
      key: 'titl',
      title: 'Наименование',
      sort: 'text',
      filter: 'search'
    }, {
      key: 'pric',
      title: 'Цена',
      sort: 'numb',
      filter: 'search'
    }, {
      key: 'kolv',
      title: 'Количество',
      result: 'kolv',
      sort: 'numb',
      filter: 'search'
    }, {
      key: 'summ',
      title: 'Cтоимость',
      result: 'sum',
      sort: 'numb',
      filter: 'search'
    }, {
      key: 'skid',
      title: 'Скидка',
      sort: 'numb',
      filter: 'search'
    }]
  }
  initTable('#nomen', nomenSettings);

  var vputiSettings = {
    data: result.vputi,
    head: true,
    result: true,
    cols: [{
      key: 'artc',
      title: 'Артикул',
      sort: 'text',
      filter: 'search'
    }, {
      key: 'titl',
      title: 'Наименование',
      sort: 'text',
      filter: 'search'
    }, {
      key: 'dpst',
      title: 'Дата поступления',
      sort: 'date',
      filter: 'search'
    }, {
      key: 'kolv',
      title: 'Количество',
      result: 'kolv',
      sort: 'numb',
      filter: 'search'
    }, {
      key: 'paid',
      title: 'Оплачено',
      result: 'sum',
      sort: 'numb',
      filter: 'search'
    }, {
      key: 'kdop',
      title: 'К оплате',
      result: 'sum',
      sort: 'numb',
      filter: 'search'
    }]
  }
  initTable('#vputi', vputiSettings);

  var vnaliSettings = {
    data: result.vnali,
    head: true,
    result: true,
    cols: [{
      key: 'artc',
      title: 'Артикул',
      sort: 'text',
      filter: 'search'
    }, {
      key: 'titl',
      title: 'Наименование',
      sort: 'text',
      filter: 'search'
    }, {
      key: 'pric',
      title: 'Цена',
      sort: 'numb',
      filter: 'search'
    }, {
      key: 'kolv',
      title: 'Количество',
      result: 'kolv',
      sort: 'numb',
      filter: 'search'
    }, {
      key: 'summ',
      title: 'Cтоимость',
      result: 'sum',
      sort: 'numb',
      filter: 'search'
    }, {
      key: 'skid',
      title: 'Скидка',
      sort: 'numb',
      filter: 'search'
    }]
  }
  initTable('#vnali', vnaliSettings);

  var sobrnSettings = {
    data: result.sobrn,
    head: true,
    result: true,
    cols: [{
      key: 'artc',
      title: 'Артикул',
      sort: 'text',
      filter: 'search'
    }, {
      key: 'titl',
      title: 'Наименование',
      sort: 'text',
      filter: 'search'
    }, {
      key: 'pric',
      title: 'Цена',
      sort: 'numb',
      filter: 'search'
    }, {
      key: 'kolv',
      title: 'Количество',
      result: 'kolv',
      sort: 'numb',
      filter: 'search'
    }, {
      key: 'summ',
      title: 'Cтоимость',
      result: 'sum',
      sort: 'numb',
      filter: 'search'
    }, {
      key: 'skid',
      title: 'Скидка',
      sort: 'numb',
      filter: 'search'
    }]
  }
  initTable('#sobrn', sobrnSettings);

  var otgrzSettings = {
    data: result.otgrz,
    head: true,
    result: true,
    cols: [{
      key: 'artc',
      title: 'Артикул',
      sort: 'text',
      filter: 'search'
    }, {
      key: 'titl',
      title: 'Наименование',
      sort: 'text',
      filter: 'search'
    }, {
      key: 'pric',
      title: 'Цена',
      sort: 'numb',
      filter: 'search'
    }, {
      key: 'kolv',
      title: 'Количество',
      result: 'kolv',
      sort: 'numb',
      filter: 'search',
      content:`<div class="row">
                <div class="attention icon" data-tooltip="Подать рекламацию" onclick="openReclmPopUp(#object_id#)"></div>
                <div>#kolv#</div>
              </div>`
    }, {
      key: 'summ',
      title: 'Cтоимость',
      result: 'sum',
      sort: 'numb',
      filter: 'search'
    }, {
      key: 'skid',
      title: 'Скидка',
      sort: 'numb',
      filter: 'search'
    }]
  }
  initTable('#otgrz', otgrzSettings);

  var nedopSettings = {
    data: result.nedop,
    head: true,
    result: true,
    cols: [{
      key: 'artc',
      title: 'Артикул',
      sort: 'text',
      filter: 'search'
    }, {
      key: 'titl',
      title: 'Наименование',
      sort: 'text',
      filter: 'search'
    }, {
      key: 'pric',
      title: 'Цена',
      sort: 'numb',
      filter: 'search'
    }, {
      key: 'kolv',
      title: 'Количество',
      result: 'kolv',
      sort: 'numb',
      filter: 'search'
    }, {
      key: 'summ',
      title: 'Cтоимость',
      result: 'sum',
      sort: 'numb',
      filter: 'search'
    }, {
      key: 'stat',
      title: 'Инициатор отмены',
      sort: 'numb',
      filter: 'search'
    }]
  }
  initTable('#nedop', nedopSettings);

  var reclmSettings = {
    data: result.reclm,
    head: true,
    result: true,
    cols: [{
      key: 'recl_num',
      title: '№ Рекламации',
      sort: 'numb',
      filter: 'search'
    }, {
      key: 'recl_date',
      title: 'Дата',
      sort: 'date',
      filter: 'search'
    }, {
      key: 'artc',
      title: 'Артикул',
      sort: 'text',
      filter: 'search'
    }, {
      key: 'titl',
      title: 'Наименование',
      sort: 'text',
      filter: 'search'
    }, {
      key: 'pric',
      title: 'Цена',
      sort: 'numb',
      filter: 'search'
    }, {
      key: 'kolv',
      title: 'Количество',
      result: 'kolv',
      sort: 'numb',
      filter: 'search'
    }, {
      key: 'comp_summ',
      title: 'Сумма компенсации',
      result: 'sum',
      sort: 'numb',
      filter: 'search'
    }, {
      key: 'trac',
      title: 'Статус',
      sort: 'text',
      filter: 'full',
      content: `<div class="#status# recl pill">#trac#</div>`
    }]
  }
  initTable('#reclm', reclmSettings);
  loader.hide();
}

//=====================================================================================================
// Работа с рекламациями:
//=====================================================================================================

// Открытие мастера создания рекламации:

function openReclmPopUp(id) {
  loader.show();
  var data = reclmData.find(el => el.object_id == id);
  showReclPopUp(data);
  // if (!data.image) {
  //   getItems(data.object_id)
  //   .then(result => {
  //     if (result.items && result.items.length) {
  //       items[data.object_id] = result.items[0];
  //       var images = result.items[0].images.toString().split(';');
  //       data.image = `https://b2b.topsports.ru/c/productpage/${images[0]}.jpg`;
  //     }
  //     showReclPopUp(data);
  //   }, reject => showReclPopUp(data))
  // } else {
  //   showReclPopUp(data);
  // }
}

// Заполение данными и отображение мастера создания рекламации:

function showReclPopUp(data) {
  console.log(data);
  fillTemplate({
    area: '#make-reclm',
    items: data
  })
  checkImg('#make-reclm');
  openPopUp('#make-reclm');
  loader.hide();
}

// Подача рекламации:

function sendReclm(data) {
  console.log('отправляем форму для создания рекламации');
  // sendRequest(urlRequest.main, formData, 'multipart/form-data')
  // sendRequest(urlRequest.main, {action: 'reclm', data: data})
  // .then(result => {
  //   console.log(result);
  // })
  // .catch(error => {
  //   console.log(error);
  // })
}
