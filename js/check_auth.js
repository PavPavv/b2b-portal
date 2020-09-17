'use strict';

// Проверка авторизован ли пользователь:

// (function(){
//   var path = location.pathname.replace('index.html', '').replace(/\//g, ''),
//       xhr = new XMLHttpRequest();
//   xhr.open('POST', 'https://new.topsports.ru/api.php', false);
//   try {
//     xhr.setRequestHeader('Content-Type', 'application/json');
//     xhr.send(JSON.stringify({action: 'checkauth'}));
//     if (xhr.status != 200) {
//       console.log(`Ошибка ${xhr.status}: ${xhr.statusText}`);
//       new Error(`Ошибка ${xhr.status}: ${xhr.statusText}`);
//     } else {
//       console.log(xhr.response);
//       if (xhr.response) {
//         if (path === '' || path === 'registr') {
//           location.href = '/dashboard';
//         } else {
//           window.userInfo = JSON.parse(xhr.response);
//         }
//       } else {
//         if (path !== '' && path !== 'registr') {
//           location.href = '/';
//         }
//       }
//     }
//   } catch(err) {
//     console.log(err);
//     if (path !== '' && path !== 'registr') {
//       location.href = '/';
//     }
//   }
// })();
