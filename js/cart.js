'use strict';

//=====================================================================================================
// Первоначальные данные для работы:
//=====================================================================================================

// Динамически изменяемые переменные:

var cartData = {},
    cartTimer = null,
    cartTimeout = 1000,
    cartChanges = {};
cartChanges[cartId] = {};

//=====================================================================================================
// Запросы на сервер:
//=====================================================================================================

// Отправка данных корзины на сервер (только изменившихся данных):

function cartSentServer() {
  clearTimeout(cartTimer);
  cartTimer = setTimeout(function () {
    console.log(JSON.stringify(cartChanges));
    sendRequest(urlRequest.main, {action: 'set_cart', data: cartChanges})
      .then(response => {
        cartChanges[cartId] = {};
        console.log(response);
      })
      .catch(err => {
        console.log(err);
        // cartSentServer();
      })
  }, cartTimeout);
}

// Отправка данных корзины на сервер если при закрытии страницы остались неотправленные данные (только изменившихся данных):

window.addEventListener('unload', () => {
  if(!isEmptyObj(cartChanges[cartId])) {
    var data = {
      action: 'set_cart',
      data: cartChanges
    };
    navigator.sendBeacon(urlRequest.main, JSON.stringify(data));
  }
}, false);

// Отправка данных о заказе на сервер:

function sendOrder(formData) {
  var idList = getIdList('cart');
  if (!idList) {
    return;
  }
  var cartInfo = {};
  cartInfo[cartId] = {};
  idList.forEach(id => {
    cartInfo[cartId]['id_' + id] = cart['id_' + id];
  });
  formData.cart_name = cartId;
  var data = {
    info: formData,
    cart: cartInfo
  };
  console.log(data);

  sendRequest(urlRequest.main, {action: 'send_order', data: data})
  .then(result => {
    console.log(result);
    if (result) {
      var orderId = JSON.parse(result);
      if (orderId.length !== idList.length) {
        alerts.show('Были отправлены не все позиции из заказа.');
      }
      deleteFromCart(orderId);
      document.location.href = '../orders';
    }
  })
  .catch(error => {
    console.log(error);
    alerts.show('Заказ не был отправлен. Попробуйте еще раз.');
  })
}

//=====================================================================================================
// Работа с данными корзины:
//=====================================================================================================

// Обновление корзины при возвращении на страницу:

function updateCart() {
  getCart()
  .then(result => {
    if (result === 'cart') {
      createCartData()
      .then(result => {
        if (location.search === '?cart') {
          createCart();
          if (getEl('#checkout').classList.contains('open')) {
            fillCheckout();
          }
        } else {
          var cards;
          if (view === 'list') {
            cards = document.querySelectorAll('.big-card');
          } else if (view === 'blocks') {
            cards = document.querySelectorAll('.min-card');
          } else if (view === 'product') {
            cards = document.querySelectorAll('.product-card');
          }
          cards.forEach(card => checkCart(card));
        }
      });
    }
    fillOrderForm();
  }, reject => console.log(reject))
}

// Создание данных для рендеринга корзины:

function createCartData() {
  return new Promise((resolve, reject) => {
    getMissingItems()
    .then(result => {
      for (var id in cart) {
        var qty = cart[id].qty
        if (qty) {
          saveInCartData(id, qty);
        }
      }
      resolve();
    })
  });
}

// Получение недостающих items для рендеринга корзины:

function getMissingItems() {
  return new Promise((resolve, reject) => {
    var data = [];
    for (var key in cart) {
      if (!cartItems[key]) {
        data.push(cart[key].id);
      }
    }
    if (data.length) {
      data = data.join(',');
      getItems(data)
      .then(result => {
        for (var key in result.items) {
          convertItem(result.items[key]);
        }
        resolve();
      }, reject => resolve())
    } else {
      resolve();
    }
  });
}

// Создание данных строки корзины:

function createCartItemData(id, qty, status = '') {
  if (!cartItems[id]) {
    return;
  }
  var item = Object.assign(cartItems[id]);
  item.status = status;
  if (status === 'bonus') {
    item.price_cur = 'Подарок';
  }
  if (item.total_qty > 0) {
    item.qty = qty > item.total_qty ? item.total_qty : qty;
  } else {
    item.qty = qty;
    item.price_cur = 0;
  }
  return item;
}

// Сохранение в корзину с отправкой на сервер только изменившихся данных:

function saveInCart(id, qty) {
  id = 'id_' + id;
  if ((!qty && !cart[id]) || (cart[id] && cart[id].qty == qty)) {
    return;
  }
  if (!cart[id]) {
    cart[id] = {};
  }
  cart[id].id = id.replace('id_', '');
  cart[id].qty = qty;
  cart[id].cartId = cartId;
  cart[id].actionId = cartItems[id].action_id;
  cart[id].actionName = cartItems[id].actiontitle || 'Склад';

  cartChanges[cartId][id] = cart[id];
  cartSentServer();

  if (!qty) {
    delete cart[id];
    deleteFromCartData(id);
  } else {
    saveInCartData(id, qty);
  }
  saveCartTotals();
}

// Удаление данных из корзины:

function deleteFromCart(idList) {
  idList.forEach(id => {
    delete cart['id_' + id];
  });
  saveCartTotals();
}

// Сохранение в данные для ренедеринга корзины:

function saveInCartData(id, qty) {
  var item = createCartItemData(id, qty);
  if (!item) {
    return;
  }
  var action = item.action_name;
  if (!cartData[action]) {
    cartData[action] = {};
    cartData[action].action_name = action;
    cartData[action].type = item.action === 'Нет в наличии' ? 'sold' : '';
    cartData[action].items = {};
  }
  if (!cartData[action].items[id]) {
    cartData[action].items[id] = item;
  }
}

// Удаление из данных для ренедеринга корзины:

function deleteFromCartData(id) {
  var action = cartItems[id].action_name;
  if (!action) {
    return;
  }
  delete cartData[action][id];
  if (isEmptyObj(cartData[action])) {
    delete cartData[action];
  }
}

// Сохранение данных об итогах корзины:

function saveCartTotals() {
  var curTotal = cartTotals.find(el => el.id === cartId);
  if (!curTotal) {
    return;
  }
  var totals = countFromCart();
  curTotal.qty = totals.qty;
  curTotal.sum = totals.sum;
  changeCartInHeader(totals);
}

//=====================================================================================================
// Подсчет корзины:
//=====================================================================================================

// Подсчет по корзине (всей корзины целиком или только выбранных элементов):

function countFromCart(idList = undefined, totals = true) {
  var qty = 0,
      sum = 0;

  if (totals) {
    var sumOpt = 0,
        sumRetail = 0,
        orders = [],
        itemsForOrderDiscount = [],
        sumForOrderDiscount = 0;
  } else {
    var bonusQty = 0,
        bonusId = 0;
  }

  if (!isEmptyObj(cart)) {
    var curItem, curQty, curOrder;
    if (idList) {
      idList.forEach(id => {
        countTotals('id_' + id, cart['id_' + id]);
      });
    } else {
      for (var id in cart) {
        countTotals(id, cart[id]);
      }
    }
  }

  function countTotals(id, el) {
    if (!el) {
      return;
    }
    curItem = cartItems[id];
    if (!curItem || curItem.total_qty == 0) {
      qty += el.qty;
      return;
    }
    curQty = el.qty > curItem.total_qty ? curItem.total_qty : el.qty;
    qty += curQty;

    if (totals) {
      sumOpt += curQty * curItem.price_cur1;
      sumRetail += curQty * curItem.price_user1;

      curOrder = orders.find(el => el.title === curItem.action_name);
      if (!curOrder) {
        orders.push({
          title: curItem.action_name,
          id: curItem.action_id,
          qty: 0,
          sum: 0,
          sumOpt: 0,
          sumRetail: 0
        });
        curOrder = orders[0];
      }
      curOrder.qty += curQty;
      curOrder.sumOpt += curQty * curItem.price_cur1;
      curOrder.sumRetail += curQty * curItem.price_user1;
    }

    var discount = checkDiscount(el.id, qty, curItem);
    if (!discount || !discount.sum) {
      sum += curQty * curItem.price_cur1;
      if (totals) {
        curOrder.sum += curQty * curItem.price_cur1;
      }
    }
    if (discount) {
      if (discount.sum) {
        sum += discount.sum;
        if (totals) {
          curOrder.sum += discount.sum;
        }
      }
      if (!totals && discount.bonusQty >= 0) {
        bonusQty += discount.bonusQty;
        bonusId = discount.bonusId;
      }
    } else if (totals && window.actions && window.actions[cartId]) {
      itemsForOrderDiscount.push(id);
      sumForOrderDiscount += curQty * curItem.price_user1;
    }
  }

  if (totals && sumForOrderDiscount > 0) {
    itemsForOrderDiscount.forEach(id => {
      sum = sum - (cartItems[id].price_user1 * discount.percent / 100);
    });
  }

  var result = {
    qty: qty,
    sum: sum
  };
  if (totals) {
    orders.forEach(el => {
      el.sumDiscount = el.sumOpt - el.sum;
      el.percentDiscount = (el.sumDiscount * 100 / el.sumOpt).toFixed(0);
      el.sum = convertPrice(el.sum, false);
      el.sumRetail = convertPrice(el.sumRetail, false);
      el.sumDiscount = convertPrice(el.sumDiscount, false);
      el.isDiscount = el.sumDiscount == 0 ? 'displayNone' : '';
    });
    result.orders = orders;
    result.sumRetail = sumRetail;
    result.sumDiscount = sumOpt - sum;
    result.percentDiscount = (result.sumDiscount * 100 / sumOpt).toFixed(0);
  } else {
    result.bonusQty = bonusQty;
    result.bonusId = bonusId;
  }
  return result;
}

//=====================================================================================================
// Подсчет скидок:          !!! ДОРАБОТАТЬ actions, а затем доработать подсчет скидок
//=====================================================================================================

// Проверка скидки на артикул:

function checkDiscount(id, qty, curItem) {
  return null;
  if (!curItem.action_id) {
    return null;
  }
  var action = actions[id],
      price = curItem.price_cur1,
      retailPrice = curItem.price_user1;
  if (action.type) {
    switch (action.type) {
      case 'numplusnum':
        return numPlusNum(action, qty, price);
        break;
      case 'numplusart':
        return numPlusArt(action, qty);
        break;
      case 'numminusproc':
        return numMinusProc(action, qty, price, retailPrice);
        break;
      case 'numkorobkaskidka':
        return numKorobka();
        break;
      case 'numupakovka':
        return numUpakovka();
        break;
    }
  } else {
    return null;
  }
}

// Расчет скидки "покупаешь определенное кол-во - из него определенное кол-во в подарок":

function numPlusNum(action, qty, price) {
  return {sum: (qty - findBonus(action, qty)) * price};
}

// Расчет скидки "покупаешь определенное кол-во - определенное кол-во другого артикула в подарок":

function numPlusArt(action, qty) {
  return {
    bonusQty: findBonus(action, qty),
    bonusId: action.bonus
  }
}

// Расчет количества бонусов:

function findBonus(action, qty) {
  return Math.floor(qty / action.condition) * action.profit;
}

// Расчет скидки "покупаешь определенное кол-во - скидка в % от РРЦ":

function numMinusProc(action, qty, price, retailPrice) {
  var rest = qty % action.condition;
  return {sum: (qty - rest) * (retailPrice - retailPrice * action.profit / 100) + (rest * price)};
}

// Расчет скидки типа "скидка при покупке коробки":

function numKorobka(params) {
}

// Расчет скидки типа "скидка при покупке упаковки":

function numUpakovka(params) {
}

// Расчет скидки "итоговая сумма заказа минус %":

function sumLessProc(sum) {
  var discount = discounts.find(item => !item.diart && checkCondition(item.dcondition));
  if (!discount) {
    return undefined;
  }
  var current;
  discount.dnv.forEach((item, index) => {
    if (sum >= item) {
      current = index;
    }
  });
  if (current >= 0) {
    var result = {};
    result.sum = sum * discount.dnvex[current] / 100;
    result.percent = discount.dnvex[current];
    return result;
  } else {
    return null;
  }
}

//=====================================================================================================
// Изменение данных о количестве в шапке сайта и заголовке страницы:
//=====================================================================================================

// Изменение информации о корзине в шапке сайта:

function changeCartInHeader(totals) {
  var qty = totals.qty,
      sum = totals.sum;
  fillCartInHeader(qty, sum, '#header-cart', 'cart');
  fillCartInHeader(qty, sum, '#catalogs', 'catalogs');
  fillCartInHeader(qty, sum, '#mob-catalogs', 'catalogs');
  changeCartName(qty);
}

// Заполнение конкретной корзины в шапке сайта данными:

function fillCartInHeader(qty, sum, area, type) {
  area = getEl(area);
  if (!area) {
    return;
  }
  var curCart = getEl(`.cart-${cartId}`, area),
      cartQty = getEl('.qty', curCart),
      cartSum = getEl('.sum span', curCart);
  if (cartSum) {
    cartSum.textContent = convertPrice(sum, false);
  }
  if (website === 'skipper') {
    cartQty.textContent = qty;
  } else {
    if (qty > 0) {
      if (qty > 99) {
        cartQty.textContent = type === 'cart' ? '99' : '99+';
      } else {
        cartQty.textContent = qty;
      }
      curCart.classList.add('full');
    } else {
      cartQty.textContent = qty;
      curCart.classList.remove('full');
    }
    if (type === 'cart') {
      var sum = 0;
      cartTotals.forEach(el => {
        if (!el.id) {
          return;
        }
        sum += el.sum;
      });
      getEl('.totals span', area).textContent = convertPrice(sum, false);
    }
  }
}

// Добавление информации о корзине в заголовок страницы:

function changeCartName(qty) {
  var cartName = getEl('#cart-name');
  if (cartName) {
    if (!qty) {
      var curTotal = cartTotals.find(el => el.id === cartId);
      qty = curTotal ? curTotal.qty : 0;
    };
    if (qty == 0) {
      cartName.textContent = ': пуста';
    } else {
      cartName.textContent = ': ' + getEl('.topmenu-item.active').textContent + ' - ' + qty + ' ' + declOfNum(qty, ['товар', 'товара', 'товаров']);
    }
  }
}

//=====================================================================================================
// Создание и отображение контента корзины:
//=====================================================================================================

// Отображение контента корзины:

function renderCart() {
  toggleEventListeners('off');
  addCatalogLink();
  changeCartName();
  createCart();
  showElement('#main-header', 'flex');
  showElement('#cart-name');
  showElement('#cart');
}

// Добавление ссылки на текущий каталог в пустую корзину:

function addCatalogLink() {
  var curSection = getEl('.topmenu-item.active');
  if (curSection) {
    getEl('#catalog-link').href = curSection.href;
  }
}

// Cоздание корзины:

function createCart() {
  if (!isEmptyObj(cartData)) {
    var data = {
      area: '#cart-list',
      items: cartData,
      type: 'list',
      sub: [{
        area: '.cart-row',
        items: 'items',
        type: 'list'
      }]
    };
    fillTemplate(data);
    createCartCopy();
  }
  showActualCart();
}

// Cоздание копии корзины:

function createCartCopy() {
  var data = [];
  for (var key in cartData) {
    for (var id in cartData[key].items) {
      data.push(cartData[key].items[id]);
    }
  }
  fillTemplate({
    area: '#cart-table',
    items: data
  });
}

// Отображение контента пустой или полной корзины:

function showActualCart() {
  if (isEmptyObj(cartData)) {
    hideElement('#cart-full');
    showElement('#cart-empty', 'flex');
  } else {
    document.querySelectorAll('.cart-row').forEach(row => {
      checkImg(row);
      changeCartRow(row);
    });
    document.querySelectorAll('.cart-section').forEach(el => changeCartSectionInfo(el));
    changeCheckoutInfo();
    hideElement('#cart-empty');
    showElement('#cart-full');
  }
}

// Cоздание строки корзины:

function createCartRow(id, qty, row = null, status) {
  var data = createCartItemData(id, qty, status);
  if (data) {
    fillTemplate({
      area: '#cart-rows',
      items: data,
      target: row,
      method: row ? 'afterend' : 'beforeend'
    });
  }
}

//=====================================================================================================
// Изменение данных о количестве в карточках товара и корзине:
//=====================================================================================================

// Получение списка id товаров:

function getIdList(type, area) {
  var list;
  if (type === 'cart') {
    // список id, выбранных в корзине:
    if (area) {
    list = area.querySelectorAll('.cart-row:not(.bonus).checked');
    } else {
    list = getEl('#cart-list').querySelectorAll(':not(.sold) .cart-row:not(.bonus).checked');
    }
  } else if (type === 'card') {
    // список всех id в карточке товара:
    list = area.querySelectorAll('.choiced-qty');
  }
  return Array.from(list).map(el => el.dataset.id);
}

// Проверка наличия товара в корзине и отображение в карточке товара (степпере/кружке):

function checkCart(card) {
  if (!isCart) {
    return;
  }
  if (card.classList.contains('min-card')) {
    var cartInfo = getEl('.cart', card);
    if (cartInfo) {
      var curProduct = curItems.find(item => item.object_id == card.dataset.id),
          sizeInfo = curProduct.sizes,
          totalQty = 0;
      for (var el in sizeInfo) {
        totalQty += getQty(sizeInfo[el].object_id);
      }
      var qty = getEl('.qty', cartInfo);
      if (totalQty > 0) {
        if (totalQty > 99) {
          qty.textContent = '99';
        } else {
          qty.textContent = totalQty;
        }
        showElement(cartInfo);
      } else {
        hideElement(cartInfo);
      }
    }
  } else {
    var input, qty;
    card.querySelectorAll('.card-size').forEach(size => {
      input = getEl('.choiced-qty', size);
      qty = getQty(input.dataset.id);
      input.value = qty;
      input.dataset.value = qty;
      changeColors(getEl('.qty', size), qty);
      changeCard(card);
    });
  }
}

// Получение даннных о количестве товара из корзины:

function getQty(id) {
  var id = 'id_' + id,
      qty, totalQty;
  if (cart[id]) {
    qty = parseInt(cart[id].qty, 10);
    totalQty = parseInt(cartItems[id].total_qty, 10);
    if (totalQty > 0) {
      return qty > totalQty ? totalQty : qty;
    } else {
      return qty;
    }
  } else {
    return 0;
  }
}

// Изменение выбранного количества степпером:

function changeCart(event, id) {
  var curEl = event.currentTarget.closest('.manage'),
      totalQty = cartItems['id_' + id].total_qty,
      qty = changeQty(event, totalQty);
  saveInCart(id, qty);
  if (curEl.classList.contains('card')) {
    changeCard(curEl);
    if (curEl.classList.contains('full-card')) {
      checkCart(getEl(`#gallery .card[data-id="${curEl.dataset.id}"]`));
    }
  } else {
    changeCartRow(curEl);
  }
}

// Изменение информации в карточке товара:

function changeCard(card) {
  var selectInfo = getEl('.select-info', card),
      bonusRow = getEl('.bonus', selectInfo),
      idList = getIdList('card', card),
      totals = countFromCart(idList, false);

  if (bonusRow && totals.bonusQty) {
    var bonusItem = cartItems[totals.bonusId];
    if (bonusItem) {
      getEl('.bonus-qty span', bonusRow).textContent = totals.bonusQty;
      getEl('.bonus-img', bonusRow).src = bonusItem.image;
      checkImg(bonusRow);
      showElement(bonusRow, 'flex');
    }
  } else {
    hideElement(bonusRow);
  }

  if (totals.qty > 0) {
    getEl('.select-qty span', card).textContent = totals.qty;
    getEl('.select-sum span', card).textContent = convertPrice(totals.sum, false);
    selectInfo.style.visibility = 'visible';
  } else {
    selectInfo.style.visibility = 'hidden';
  }
}

// Изменение информации в строке корзины:

function changeCartRow(row) {
  if (row.closest('.sold') || row.classList.contains('bonus')) {
    return;
  }
  var input = getEl('.choiced-qty', row),
      id = input.dataset.id,
      totals = countFromCart([id], false),
      sum = convertPrice(totals.sum, false);

  getEl('.sum span', row).textContent = sum;
  changeCartRowCopy(id, totals.qty, sum);

  if (totals.bonusId) {
    var bonusRow = getEl(`.cart-row.bonus[data-parent-id="${id}"]`);
    if (totals.bonusQty > 0) {
      var qty = totals.bonusQty;
      if (bonusRow) {
        getEl('.qty .bonus span', bonusRow).textContent = qty;
      } else {
        createCartRow('id_' + bonusId, qty, row, 'bonus');
        bonusRow = row.nextElementSibling;
        checkImg(bonusRow);
        bonusRow.dataset.parentId = id;
        if (!row.classList.contains('checked')) {
          bonusRow.classList.remove('checked');
        }
      }
    } else {
      if (bonusRow) {
        getEl('#cart-rows').removeChild(bonusRow);
      }
    }
  }
}

// Изменение информации в строке корзины:

function changeCartRowCopy(id, qty, sum) {
  var cartCopy = getEl('#cart-copy');
  if (cartCopy) {
    var copyRow = getEl(`#cart-table tr[data-id="${id}"]`);
    getEl('.qty', copyRow).textContent = qty;
    getEl('.sum', copyRow).textContent = sum;
  }
}

//=====================================================================================================
// Работа элементов корзины:
//=====================================================================================================

// Блокировка/разблокировка кнопки оформления заказа:

function checkCheckoutBtn() {
  var btn = getEl('#checkout-btn');
  if (getEl(':not(.sold) .cart-row.checked')) {
    btn.classList.remove('disabled');
  } else {
    btn.classList.add('disabled');
  }
}

// Изменение информации о количестве заказов (рядом с кнопкой оформления заказа):

function changeCheckoutInfo() {
  var info = getEl('#checkout-info'),
      qty = 0;
  document.querySelectorAll('.cart-section:not(.sold)').forEach(el => {
    if (getEl('.cart-row.checked', el)) {
      qty++;
    }
  });
  if (qty > 1) {
    var totals = countFromCart(getIdList('cart'), false);
    getEl('.qty', info).textContent = qty + ' ' + declOfNum(qty, ['заказ', 'заказа', 'заказов']);
    getEl('.sum', info).textContent = convertPrice(totals.sum, false);
    info.style.visibility = 'visible';
  } else {
    info.style.visibility = 'hidden';
  }
}

// Изменение информации о заказе:

function fillCheckout() {
  var totals = countFromCart(getIdList('cart'));
  getEl('#checkout .totals .sum').textContent = convertPrice(totals.sum, false);
  getEl('#checkout .totals .orders-qty').textContent = totals.orders.length;
  getEl('#checkout .totals .sum-retail').textContent = convertPrice(totals.sumRetail, false);
  getEl('#checkout .totals .sum-discount').textContent = convertPrice(totals.sumDiscount, false);
  fillTemplate({
    area: '#order-details',
    items: totals.orders
  });
}

// Изменение информации о количестве и сумме в секции корзины:

function changeCartSectionInfo(section) {
  var totals = countFromCart(getIdList('cart', section), false);
  getEl('.select-qty span', section).textContent = totals.qty;
  getEl('.select-sum span', section).textContent = convertPrice(totals.sum, false);
}

// Выделение/снятие выделения пунктов корзины:

function toggleInCart(event) {
  var cartSection = event.currentTarget.closest('.cart-section');
  if (cartSection.classList.contains('sold')) {
    return;
  }
  var curRow = event.currentTarget.closest('.cart-row'),
      mainCheckbox = getEl('.head .checkbox', cartSection);
  if (curRow) {
    // Выделение/снятие выделения одного пункта корзины:
    if (curRow.classList.contains('bonus')) {
      return;
    }
    curRow.classList.toggle('checked');
    if (!getEl('.cart-row:not(.bonus):not(.checked)', cartSection)) {
      mainCheckbox.classList.add('checked');
    } else {
      mainCheckbox.classList.remove('checked');
    }
  } else {
    // Выделение/снятие выделения секции корзины:
    if (mainCheckbox.classList.contains('checked')) {
      cartSection.querySelectorAll('.cart-row:not(.bonus)').forEach(el => el.classList.remove('checked'));
    } else {
      cartSection.querySelectorAll('.cart-row:not(.bonus)').forEach(el => el.classList.add('checked'));
    }
    mainCheckbox.classList.toggle('checked');
  }
  changeCartSectionInfo(cartSection);
  checkCheckoutBtn();
  changeCheckoutInfo();
}

// Удаление пунктов корзины:

function deleteFromCart(event) {
  var btn = event.currentTarget,
      curRow = btn.closest('.cart-row:not(.bonus)'),
      question = curRow ? 'Удалить данный товар из корзины' : 'Удалить данный раздел из корзины';
  alerts.confirm(question, function() {
    var cartSection = btn.closest('.cart-section'),
        cartList = getEl('#cart-list');
    if (curRow) {
      // Удаление одного пункта корзины:
      deleteCartRow(curRow.dataset.id);
      cartSection.removeChild(curRow);
      var bonusRow = getEl(`.cart-row.bonus[data-parent-id="${curRow.dataset.i}"]`);
      if (bonusRow) {
        cartSection.removeChild(bonusRow);
      }
      if (!cartSection.querySelectorAll('.cart-row').length) {
        cartList.removeChild(cartSection);
      }
    } else {
      // Удаление секции корзины:
      cartSection.querySelectorAll('.cart-row:not(.bonus).checked').forEach(el => {
        deleteCartRow(el.dataset.id);
      });
      cartList.removeChild(cartSection);
    }
    if (!cartList.querySelectorAll('.cart-section').length) {
      showElement('#cart-empty', 'flex');
      hideElement('#cart-full');
    } else {
      changeCartSectionInfo(cartSection);
      checkCheckoutBtn();
      changeCheckoutInfo();
    }
  })
}

// Удаление одного пункта корзины:

function deleteCartRow(id) {
  saveInCart(id, 0);
  var copyRow = getEl(`#cart-table tr[data-id="${id}"]`);
  if (copyRow) {
    getEl('#cart-table').removeChild(copyRow);
  }
}

//=====================================================================================================
// Загрузка данных в корзину из текстового поля/файла
//=====================================================================================================

// Открытие окна для загрузки данных в корзину:

function openLoadContainer() {
  openPopUp('#load-container');
  getEl('#load-text').value = '';
}

// Загрузка данных в корзину из текстового поля:

function loadInCart() {
  loader.show();
  var loadText = getEl('#load-text');
  if (!loadText.value || !/\S/.test(loadText.value)) {
    loader.hide();
    return;
  }
  var addInCart = [],
      error = '',
      strings;

  strings = loadText.value
  .split(/\n|\r\n/)
  .map(el => el.split(/\s/))
  .map(el => el.filter(el => el))
  .filter(el => el.length);

  strings.forEach(el => {
    if (el.length != 2) {
      error = 'Неверный формат вводимых данных';
      return;
    }
    var curItem;
    for (var key in cartItems) {
      if (cartItems[key].articul === el[0]) {
        curItem = cartItems[key];
        break;
      }
    }
    if (curItem) {
      var id = curItem.object_id;
      var qty = parseInt(el[1], 10);
      if (isNaN(+qty)) {
        error = 'Неверно введено количество';
        return;
      }
      if (qty > 0) {
        var totalQty = parseInt(curItem.total_qty, 10);
        if (totalQty > 0) {
          qty = qty > totalQty ? totalQty : qty;
          addInCart.push({id: id, qty: qty});
        }
      }
    }
  });
  if (!error && addInCart.length == 0) {
    error = 'Не найдено ни одного артикула';
  }
  if (error) {
    loader.hide();
    alerts.show(error, 2000);
    return;
  }
  addInCart.forEach(el => {
    saveInCart(el.id, el.qty);
  });
  createCart();
  loader.hide();
  closePopUp('load-container');
  if (addInCart.length < strings.length) {
    alerts.show('При загрузке были найдены не все артикулы', 3000);
  }
  loadText.value = '';
}

//Загрузка данных в корзину из файла:

function addInCart(event) {
  event.preventDefault();
  loader.show();
  var form = event.currentTarget,
      formData = new FormData(form),
      loadBtn = getEl('label', form),
      submitBtn = getEl('input[type="submit"]', form);
  sendRequest(`${urlRequest.api}???`, formData, 'multipart/form-data')
  .then(result => {
    // console.log(result);
    var data = JSON.parse(result);
    if (data.cart) {
      cart[cartId] = data.cart[cartId];
      closePopUp('load-container');
      changeCartInHeader(countFromCart());
      createCart();
    } else {
      alerts.show('Файл не загружен. Неверный формат данных.', 2000);
      showElement(loadBtn);
      hideElement(submitBtn);
    }
    loader.hide();
  })
  .catch(error => {
    console.log(error);
    loader.hide();
    alerts.show('Файл не загружен. Ошибка сервера.', 2000);
    showElement(loadBtn);
    hideElement(submitBtn);
  })
}

//=====================================================================================================
// Копирование корзины:
//=====================================================================================================

function copyCart() {
  var cartCopy = getEl('#cart-copy textarea');
  cartCopy.textContent = getEl('#cart-table').parentElement.outerHTML;
  cartCopy.focus();
  cartCopy.setSelectionRange(0, cartCopy.value.length);
  try {
    document.execCommand('copy');
    alerts.show('Содержимое корзины скопировано в буфер обмена.', 2000)
  } catch (error) {
    alerts.show('Не удалось скопировать cодержимое корзины.', 2000)
  }
}

//=====================================================================================================
// Работа с формой заказа:
//=====================================================================================================

// Открытие формы заказа:

function openCheckout() {
  if (!userData.contr) {
    alerts.show('Оформление заказа невозможно: отсутствуют активные контрагенты!<br>Перейдите в раздел <a href="http://new.topsports.ru/contractors" target="_blank">Контрагенты</a> для их добавления/включения.');
    return;
  }
  if (!userData.address) {
    alerts.show('Внимание: отсутствуют активные адреса!<br>Перейдите в раздел <a href="http://new.topsports.ru/addresses" target="_blank">Адреса доставки</a> для их добавления/включения.');
    getEl('#order-form .activate.delivery .item[data-value="2"]').style.display = 'none';
    getEl('#order-form .activate.delivery .item[data-value="3"').style.display = 'none';
  }
  clearForm('#order-form');
  toggleAddressField();
  fillCheckout();
  openPopUp('#checkout');
}

// Заполнение формы заказа данными:

function fillOrderForm() {
  fillTemplate({
    area: '#contr .drop-down',
    items: userData.contr
  });
  fillTemplate({
    area: '#address .drop-down',
    items: userData.address,
  });
  toggleAddressField();
}

// Показ/ скрытие поля выбора адреса доставки:

function toggleAddressField() {
  var deliveryType = getEl('#delivery'),
      address = getEl('#address');
  if (deliveryType.value === '2' || deliveryType.value === '3') {
    address.removeAttribute('disabled');
    address.closest('.form-wrap').required = true;
  } else {
    clearDropDown(address);
    address.setAttribute('disabled', 'disabled');
    address.closest('.form-wrap').required = false;
  }
}
