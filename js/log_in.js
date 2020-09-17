'use strict';

// Авторизация:

function logIn(event) {
  event.preventDefault();

  var required = document.querySelectorAll('[required] input[name]');
  for (var el of required) {
    if (!el.value) {
      el.closest('.form-wrap').classList.add('error');
      return;
    }
  }

  var data = {action: 'login', data: {}},
      formData = new FormData(document.getElementById('log-in'));
  formData.forEach((value, key) => {
    data.data[key] = value;
  });

  var request = new XMLHttpRequest();
  request.addEventListener('error', () => showError('Произошла ошибка, попробуйте войти позже'));
  request.addEventListener('load', () => {
    if (request.status !== 200) {
      showError('Произошла ошибка, попробуйте позже');
    } else {
      var result = JSON.parse(request.response);
      if (result.ok) {
        location.href = '/dashboard';
      } else {
        showError('Пользователь не найден');
      }
    }
  });
  request.open('POST', 'https://new.topsports.ru/api.php');
  request.setRequestHeader('Content-type', 'application/json; charset=utf-8');
  request.send(JSON.stringify(data));
}

// Отключение сообщений о незаполненых полях:

document.querySelectorAll('[required] input[name]').forEach(el => el.addEventListener('input', event => closeError(event)));

function closeError(event) {
  var input = event.currentTarget;
  if (input.value && input.value.trim() !== '') {
    input.closest('.form-wrap').classList.remove('error');
  }
}

// Отображение ошибки на странице авторизации:

function showError(text) {
  var error = document.getElementById('error');
  error.textContent = text;
  error.style.visibility = 'visible';
}
