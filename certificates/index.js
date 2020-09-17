"use strict";

// fillTemplate в дальнейшем заменить на загрузку через универсальную функцию подгрузки по скроллу
// Везде рендерить через универсальную функцию подгрузки по скроллу

//=====================================================================================================
// Первоначальные данные для работы:
//=====================================================================================================

// Константы:

var items = [];

// Динамически изменяемые переменные:

var selectedItems = "",
  filterItems = [];

// Запускаем рендеринг страницы сертификатов:

startCertPage();

//=====================================================================================================
// При запуске страницы:
//=====================================================================================================

// Запуск страницы сертификатов:

function startCertPage() {
  sendRequest(`../json/certificates_data.json`)
    //sendRequest(urlRequest.main, {action: 'files', data: {type: 'cert'}})
    .then((result) => {
      items = JSON.parse(result);
      convertData();
      initPage();
    })
    .catch((err) => {
      console.log(err);
      initPage();
    });
}

// Инициализация страницы:

function initPage() {
  fillTemplate({
    area: "#cert-data",
    items: items,
  });
  convertData();
  initSearch("#cert-search", findCert);
  initCalendar("#cert-range");
  initDropDown("#brands-select", selectBrand);
  initCalendar("#calendar");
  loader.hide();
}

// Преобразование данных:

function convertData() {
  items.forEach((el) => {
    el.search = [];
    for (var key in el) {
      if (el[key] == 0 || el[key]) {
        el.search.push(el[key]);
      }
    }
    el.search = el.search
      .join(",")
      .replace(/\s/, " ")
      .replace(/\u00A0/g, " ");
  });
}

// Поиск по ключевым словам:

function findCert(search, textToFind) {
  if (textToFind) {
    var regEx = RegExp(textToFind, "gi");
    selectedItems = items.filter((el) => el.search.search(regEx) >= 0);
    if (selectedItems.length) {
      hideElement("#notice");
      fillTemplate({
        area: "#cert-data",
        items: selectedItems,
      });
      showElement("#cert-data");
    } else {
      hideElement("#cert-data");
      showElement("#notice");
    }
  } else {
    fillTemplate({
      area: "#cert-data",
      items: items,
    });
    hideElement("#notice");
    showElement("#cert-data");
  }
}

// Поиск по дате:

function selectDate() {}

// Поиск по бренду:

function selectBrand() {}

// Загрузка/просмотр сертификата:

function getCert(id, mode) {
  event.preventDefault();
  if (mode) {
    sendRequest(urlRequest.main, {
      action: "files",
      data: { type: "cert", mode: "view", id: id },
    });
  } else {
    sendRequest(urlRequest.main, {
      action: "files",
      data: { type: "cert", id: id },
    });
  }
}

//  скрипт для работы чекбоксов
document.querySelectorAll(".filters").forEach((el) => {
  el.querySelectorAll(".item .row").forEach((el) =>
    el.addEventListener("click", (event) => {
      event.stopPropagation();
      if (
        event.target.classList.contains("checkbox") ||
        event.target.classList.contains("text")
      ) {
        event.currentTarget.classList.toggle("checked");
      }
    })
  );
});
