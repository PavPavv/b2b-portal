'use strict';

function startProfPage() {
  sendRequest(`../json/profile.json`)
  .then(result => {
    var data = JSON.parse(result);
    console.log(data);
    loader.hide();
    var profileData = {
      area: '#profile-card',
      items: data,
      sign: '@@'
    };
    fillTemplate(profileData);
    initForm('#edit-profile-modal', testEditProfile);
    initCalendar('#profile-birth');
  })
  .catch(err => {
    console.log(err);
    loader.hide();
  });
}
startProfPage();


function testEditProfile() {
  clearForm('#edit-profile-modal');
}
