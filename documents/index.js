'use strict';

// Запускаем рендеринг страницы документов:

startDocsPage();

// Запуск страницы документов:

function startDocsPage() {
  // sendRequest(`../json/documents_data.json`)
  sendRequest(urlRequest.main, {action: 'files', data: {type: 'docs'}})
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
  var settings = {
    data: data,
    head: true,
    result: false,
    cols: [{
      key: 'file_name',
      title: 'Наименование',
      content: `<div class="row">
                  <a href="https://new.topsports.ru/api.php?action=files&type=docs&id=#id#" target="_blank">
                    <div class="download icon"></div>
                  </a>
                  <div><a href="https://new.topsports.ru/api.php?action=files&type=docs&mode=view&id=#id#" target="_blank">#title#</a></div>
                </div>`
    }]
  }
  initTable('#docs', settings);
  loader.hide();
}
