'use strict';

// Запускаем рендеринг страницы заказов:

startOrdersPage();

// Запуск страницы заказов:

function startOrdersPage() {
  // sendRequest(`../json/orders_data.json`)
  sendRequest(urlRequest.main, {action: 'orderslist'})
  .then(result => {
    var data = JSON.parse(result);
    initPage(data);
  })
  .catch(err => {
    console.log(err);
    initPage();
  });
}

// Инициализация страницы:

function initPage(data) {
  data = convertData(data);
  var settings = {
    data: data,
    control: {
      pagination: true,
      search: 'Поиск по типу заказа, номеру, контрагенту, заказчику...',
      setting: true
    },
    head: true,
    trFunc: 'onclick=showOrder(event,#id#)',
    cols: [{
      title: 'Заказ',
      content: `<div class="row">
                  <a href="" class="download icon"></a>
                  <div>
                    <div>#order_number#</div>
                    <div class="text light">#order_date#</div>
                  </div>
                </div>`
    }, {
      key: 'order_status',
      title: 'Статус заказа',
      sort: 'text',
      filter: 'full'
    }, {
      key: 'contr_name',
      title: 'Контрагент',
      sort: 'text',
      filter: 'search'
    }, {
      key: 'user_fio',
      title: 'Заказчик',
      sort: 'text',
      filter: 'search'
    }, {
      key: 'order_type',
      title: 'Тип заказа',
      sort: 'text',
      filter: 'full'
    }, {
      key: 'order_sum',
      title: 'Сумма счета',
      sort: 'numb',
      filter: 'search'
    }, {
      key: 'debt',
      title: 'ДЗ/КЗ',
      sort: 'numb',
      filter: 'search'
    }, {
      key: '',
      title: 'Состояние товаров',
      content: `<div class="row">
                  <div class="pill vputi c10 #display1#">#sum1#</div>
                  <div class="pill vnali c10 #display2#">#sum2#</div>
                  <div class="pill sobrn c10 #display3#">#sum3#</div>
                  <div class="pill otgrz c10 #display4#">#sum4#</div>
                  <div class="pill nedop c10 #display5#">#sum5#</div>
                </div>`
    }]
  }
  initTable('#orderslist', settings);
  loader.hide();
}

// Преобразование полученных данных:

function convertData(data) {
  if (!data) {
    return [];
  }
  data.forEach(el => {
    el.order_sum = convertPrice(el.order_sum);
    var sum;
    for (var i = 1; i <= 5; i++) {
      sum = el[`sum${i}`];
      if (sum && sum != 0) {
        el[`sum${i}`] = convertPrice(sum);
        el[`display${i}`] = '';
      } else {
        el[`display${i}`] = 'displayNone';
      }
    }
  });
  return data;
}
