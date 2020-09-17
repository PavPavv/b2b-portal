'use strict';


// Динамическе переменные:

var data = [];

function startAddrPage() {
  sendRequest(`../json/addresses.json`)
  .then(result => {
    data = JSON.parse(result);
    loader.hide();
    console.log(data);
    var addrData = {
      area: '#shop',
      items: data,
      sign: '@@',
      sub:[{
        area: '.time-block',
        items: 'time'
      }]
    };
    fillTemplate(addrData);
    setProperTooltip();
    initForm('#address');
  })
  .catch(err => {
    console.log(err);
    loader.hide();
  });
}
startAddrPage();


function setWidth(el, num) {
  el.style.width = num + 'px';
}


//  Показывает/скрывает блок внутри главного блока, который по умолчанию скрыт

function toggleInnerBlock(event) {
  var parent = event.target.closest('.toggle-block');
  var targetBlock = parent.querySelector('.target-block');

  if (targetBlock) {
    targetBlock.classList.toggle('displayNone');
  }
}


function toggleOuterBlock(el) {
  if (event.target.className === 'edit icon') {
    return;
  }
  if (el.classList.contains('outer')) {
    var parentEl = el.parentElement;
    var outerTarget = parentEl.querySelector('.outer-target');
    outerTarget.classList.toggle('displayNone');
  }
}

function setProperTooltip() {
  var tooltips = document.querySelectorAll('.indicate');

  for (let i = 0; i < tooltips.length; i++) {
    var toolStatus = tooltips[i].firstElementChild;

    if (toolStatus.className == 'approv') {
      toolStatus.setAttribute('data-tooltip', 'Магазин прошел модерацию');
    } else if (toolStatus.className === 'process') {
      toolStatus.setAttribute('data-tooltip', 'Магазин еще проходит модерацию');
    } else if (toolStatus.className === 'denied') {
      toolStatus.setAttribute('data-tooltip', '</div>Магазин не прошел модерацию,</div> <div>свяжитесь с вашим менеджером</div>');
    }
  }
}


// Открытие всплывающего окна с формой:

function openAddressPopUp(id) {
  var addressPopUp = getEl('#address'),
      title = getEl('.pop-up-title .title', addressPopUp);

  if (id) {
    title.textContent = 'Изменить адрес';
    var upData = data.find(el => el.id == id);
    fillForm('#address-form', upData);
  } else {
    title.textContent = 'Новый адрес';
    clearForm('#address');
  }
  openPopUp(addressPopUp);
}
