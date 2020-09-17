'use strict';

// Добавление всплывающей html-подсказки:

getEl('#tooltip').dataset.tooltip = `<table style="width:100% !important;border-spacing: 2px;border-collapse: separate;font-size:12px;text-align:center;"><thead><tr><th>Сумма заказа в РРЦ</th><th>Размер  скидки</th></tr></thead><tbody><tr><td>до 35 000</td><td>30%</td></tr><tr><td>от 35 000 до 70 000</td><td>35%</td></tr><tr><td>от 70 000 до 100 000</td><td>45%</td></tr><tr><td>от 100 000</td><td>65%</td></tr></tbody></table>`;

// Отображение всех незаполненных шаблонов, чтобы их можно было видеть в артборде:

document.querySelectorAll('.template').forEach(el => el.classList.remove('template'));

// Инициализация поиска, выпадающих списков и форм:

initSearch('#search');
initDropDown('#select');
initDropDown('#checkbox');
initDropDown('#dropDown');
initForm('#form1');
initCalendar('#calendar');

// Добавление функционала в блок фильтров для демонстрации работы:

document.querySelectorAll('.filters').forEach(el => {
  el.querySelectorAll('.item .row').forEach (el => el.addEventListener('click', event => {
    event.stopPropagation();
    if (event.target.classList.contains('checkbox') || event.target.classList.contains('text')) {
      event.currentTarget.classList.toggle('checked');
    }
  }));
})

//=====================================================================================================
// Работа с таблицами:
//=====================================================================================================

// Созание примера данных для первой таблицы и запуск ее инициализации:
var data1 = [];
for (var i = 0; i < 20; i++) {
  data1.push({
    text: 'Текст ' + (parseInt(i, 10) + 1),
    numb: i + 1,
    date: '01.01.20',
    price: '10 000,00',
    docs: [{
      title: 'Договор с ООО «ТОП СПОРТС» от 31.10.2016',
      status: 'full',
      date_start: '31.10.2016',
      date_end: '04.12.2019',
      contr: 'ООО «ТОП СПОРТС»',
      url: 'bla-bla',
      status_info: 'действует',
      info: 'Договор от 31.10.2016<br>Дата завершения 04.12.2019<br>Заключен с ООО «ТОП СПОРТС»'
    },{
      title: 'Договор с ООО «ТОП СПОРТС-1» от 31.10.2017',
      status: 'off',
      date_start: '31.10.2017',
      contr: 'ООО «ТОП СПОРТС-1»',
      url: 'bla-bla',
      status_info: 'не действует',
      info: 'Договор от 31.10.2017<br>Заключен с ООО «ТОП СПОРТС»'
    }]
  } , {
    text: 'Очень очень очень длинный текст ' + (parseInt(i, 10) + 1),
    numb: i * 2,
    date: '20.05.17',
    price: '347 976,00',
    docs: [{
      title: 'Договор с ООО «ТОП СПОРТС» от 15.05.2018',
      status: 'full',
      date_start: '31.10.2016',
      date_end: '04.12.2019',
      contr: 'ООО «ТОП СПОРТС»',
      url: 'bla-bla',
      status_info: 'не действует',
      info: 'Договор от 15.05.2018<br>Заключен с ООО «ТОП СПОРТС»'
    }]
  })
};
initTable('#table1', {data: data1, sub: [{area: '.docs', items: 'docs'}]});

// Созание примера данных для второй таблицы и запуск ее инициализации:
var data2 = [];
for (var i = 0; i < 20; i++) {
  data2.push({
    access: 'checked',
    inn: '9731002289/637584',
    contr: 'ООО, Пилот' + (parseInt(i, 10) + 1),
    system: 'Упрощенная',
    date: '29.10.2016',
    address: '119331, г. Москва, просп. Вернадского, д. 29, этаж 12, пом. I, ком. 4',
    user: 'Семенов И.О.',
    docs: [{
      title: 'Договор с ООО «ТОП СПОРТС» от 31.10.2016',
      status: 'full',
      date_start: '29.10.2016',
      date_end: '04.12.2019',
      contr: 'ООО «ТОП СПОРТС»',
      url: 'bla-bla',
      status_info: 'действует',
      info: 'Договор от 31.10.2016<br>Дата завершения 04.12.2019<br>Заключен с ООО «ТОП СПОРТС»'
    },{
      title: 'Договор с ООО «ТОП СПОРТС-1» от 31.10.2017',
      status: 'off',
      date_start: '31.10.2017',
      contr: 'ООО «ТОП СПОРТС-1»',
      url: 'bla-bla',
      status_info: 'не действует',
      info: 'Договор от 31.10.2017<br>Заключен с ООО «ТОП СПОРТС»'
    }]
  });
  data2.push({
    access: '',
    inn: '97320002134/637554',
    contr: 'ООО, Магнолия' + (1 + i),
    system: 'Основная',
    date: '01.10.2018',
    address: '443035, г. Самара, просп. Ленина, д. 3, офис 59',
    user: 'Петров Б.Е.',
    docs: [{
      title: 'Договор с ООО «ТОП СПОРТС» от 15.05.2018',
      status: 'off',
      date_start: '31.10.2016',
      date_end: '04.12.2019',
      contr: 'ООО «ТОП СПОРТС»',
      url: 'bla-bla',
      status_info: 'не действует',
      info: 'Договор от 15.05.2018<br>Заключен с ООО «ТОП СПОРТС»'
    }]
  });
}
var settings = {
  data: data2,
  control: {
    pagination: true,
    search: 'Поиск...',
    setting: true
  },
  head: true,
  result: false,
  cols: [{
    key: 'access',
    title: 'Доступ',
    content: '<div class="toggle #access#" onclick="toggle(event)"><div class="toggle-in"></div></div>'
  }, {
    key: 'inn',
    title: 'ИНН/КПП',
    sort: 'text',
    filter: 'search'
  }, {
    key: 'contr',
    title: 'Контрагент',
    sort: 'text',
    filter: 'full'
  }, {
    key: 'system',
    title: 'Система налогообложения',
    sort: 'text',
    filter: 'full'
  }, {
    key: 'date',
    title: 'Дата заведения',
    sort: 'date',
    filter: 'search'
  }, {
    key: 'address',
    title: 'Юридический адрес',
    filter: 'search'
  }, {
    key: 'user',
    title: 'Пользователь',
    sort: 'text',
    filter: 'full'
  }, {
    key: 'docs',
    title: 'Документы',
    content: `<div class="docs row #status#">
                <div class="mark icon" data-tooltip="#status_info#"></div>
                <a href="url" target="_blank" data-tooltip="#info#" text="left" help>#title#</a>
              </div>`
  }],
  sub: [{area: '.docs', items: 'docs'}]
}
initTable('#table2', settings);
fillTemplate({
  area: "#table2-adaptive",
  items: data2,
  sub: [{area: '.docs', items: 'docs'}]
});
loader.hide();
