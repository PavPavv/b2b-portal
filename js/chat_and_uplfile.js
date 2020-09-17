$(function () {
	var local = 1;
	var path = (local == 1) ? "http://80.234.34.212:2000/-aleksa-/TopSports/b2b_new_design/reclamation" : "http://api.topsports.ru";
	var recl_id = $('#recl_js').attr('data-recl');
	var filetypes = get_filetypes();
	var imgtypes = {
		'jpg': 'jpg',
		'jpeg': 'jpg',
		'png': 'jpg',
		'gif': 'jpg'
	};
	$(document).on({
		mouseenter: function () {
			var cont = $('#item_title');
			cont.html(cont.attr('data-title'));
		},
		mouseleave: function () {
			var cont = $('#item_title');
			cont.html(cont.attr('data-title-preview'));
		}
	}, '#item_title');
	$(document).on('click', '.descr_toggle', function () {
		$(this).toggleClass('a');
		if ($(this).hasClass('a')) {
			$('.item_descr_view,.chat_cont').addClass('a');
		} else {
			$('.item_descr_view,.chat_cont').removeClass('a');
		}
	});
	$(document).on('click', '.defect_toggle', function () {
		var p = $('.recl_defect_cont');
		state = (p.hasClass('a')) ? 1 : 0;
		if (state == 0) {
			p.addClass('a');
		} else {
			p.removeClass('a');
		}
		title = (state == 0) ? 'Свернуть' : 'Раскрыть';
		$(this).attr('title', title).tooltip('fixTitle').tooltip('setContent');
	});
	$(document).on('click', ".file_select_btn", function (e) {
		$('#user_files').trigger('click');
	});
	$(document).on('click', "#files [data-img]", function (e) {
		var recl_id = $(this).attr('data-recl');
		var recl_img = $(this).attr('data-img');
		$.ajax({
			url: "/-aleksa-/TopSports/b2b_new_design/recl/recl.php?action=recl_img&recl_id=" + recl_id + "&recl_img=" + recl_img,
			type: "GET",
			success: function (response) {
				if (response) {
					$('#full').attr('src', 'data:image/' + response.ext + ';base64,' + response['image']).fancybox().trigger('click');
				}
			}
		});
	});
	$(document).on('change', "#user_files", function (e) {
		var FileList = ($('#frm_upload input[type="file"]').get(0).files);
		$.map(FileList, function (file) {
			var file_name = file.name.split('.').slice(0, -1).join('.');
			if (!$('#files div[data-file="' + file_name + '"]').get(0)) {
				var file_type = file.name.split('.').pop();
				file_type = file_type.toLowerCase();
				file_type = (filetypes[file_type]) ? filetypes[file_type] : 'txt';
				var ico = '<img src="http://b2b.topsports.ru/d/img/recl_ico_' + file_type + '.png">';
				$('#files').append('<div class="image-item" data-file="' + file_name + '">' + ico + file_name + '</div>');
			}
		});
		$('#frm_upload').submit();
	});
	$(document).on('submit', "#frm_upload", function (e) {
		e.preventDefault();
		var files = new Array();
		$.map($('#frm_upload input[type="file"]').get(0).files, function (file) {
			var file_name = file.name.split('.').slice(0, -1).join('.');
			if (!$('#files div[data-filename="' + file_name + '"]').get(0)) {
				files.push(file);
			} else {
				console.log(file_name);
			}
		});
		createFormData(files, $(this));
	});
	$(document).ajaxStop(function () {
		$('#user_files').val('');
	});
	$(document).on('submit', "#message", function (e) {
		e.preventDefault();
		var recl_id = $(this).attr('data-recl');
		var user = $(this).attr('data-user');
		var message = $('textarea', this).val();
		var messagebr = brtext(message);
		var date = new Date();
/* 		var dateDay = date.getDay();
		var dateMonth = date.getMonth();
		var dateYear = date.getFullYear();
		var dateMy = dateDay + '.' + dateMonth + '.' + dateYear; */
		var dateMy = new Date();
		var h = dateMy.getHours();
		var m = dateMy.getMinutes();
		var s = dateMy.getSeconds();
		/* var dateMyTime = h + ':' + m; */
		var month = (date.getMonth() < 10) ? '0' + parseInt(date.getMonth() + 1) : parseInt(date.getMonth() + 1);
		var day = (date.getDate() < 10) ? '0' + date.getDate() : date.getDate();
		var hour = (date.getHours() < 10) ? '0' + date.getHours() : date.getHours();
		var minutes = (date.getMinutes() < 10) ? '0' + date.getMinutes() : date.getMinutes();


		/* var hour = (dateMy.getHours() < 10) ? '0' + dateMy.getHours() : dateMy.getHours();
		var minutes = (dateMy.getMinutes() < 10) ? '0' + dateMy.getMinutes() : dateMy.getMinutes(); */




		var time = hour + ':' + minutes;
		date = time + ' ' + day + '.' + month + '.' + date.getFullYear();
		if (message != '') {
			$('.chat').append('<div class="data">' + dateMy.toLocaleDateString() + '</div><div class="chat_message_cont you owner"><div class="chat_message"><div class="chat_user name message-user">' + user + '<span>' + dateMy.toLocaleTimeString().match(/\d{2}:\d{2}|[AMP]+/g).join(' ') + '</span></div><div class="chat_text text">' + messagebr + '</div></div></div>');
//			$(".chat").scrollTop(0);
			$(".chat").scrollTop($(".chat").get(0).scrollHeight);
			$.ajax({
				url: "/-aleksa-/TopSports/b2b_new_design/recl/recl.php?action=send_message&recl_id=" + recl_id,
				type: "POST",
				data: $('#message').serialize()
			});
			$('textarea', this).val('').focus();
		}
	});
	/*$.ajax({
		url: "/vitaly/skipperparts/recl/recl.php?action=get_recl&recl_id=" + recl_id,
		type: "GET",
		success: function (response) {
			if (response) {
				var recl = response.recl;
				var recl_files = response.recl_files;
				$('#message').attr('data-user', recl.user);
				$('.recl_num').html(recl.recl_num);
				$('.recl_date_create').html(recl.recl_date);
				$('.order_num').html('<a href="/orders/order' + recl.order_id + '.html#reclm">' + recl.order_num + '</a>');
				$('.order_date').html(recl.order_date);
				var user_fio = recl.user_lastname + ' ' + recl.user_name + ' ' + recl.user_parentname;
				var user_chat_fio = recl.user_lastname + ' ' + recl.user_name;
				$('.user_info span').html(user_fio);
				$('.user_info_num span').html(recl.client_number);
				$('.user_info_org span').html(recl.contr_name);
				$('.user_info_phone span').html((recl.user_phone) ? recl.user_phone : 'Нет');
				$('.manager_info span').html(recl.manager_name + ' ' + recl.manager_lastname + ' ' + recl.manager_parentname);
				$('.nakl_date span').html(recl.item_nakl_date);
				$('.order_type span').html(recl.order_type);
				$('.item_count span').html(recl.item_count);
				if (recl.status != 0) {
					$('.statuses').attr('data-status', recl.status);
					var status_comment = (recl.status_comment) ? recl.status_comment : '';
					$('.status_text span').html(recl.status_text);
					$('.status[data-status="' + recl.status + '"] .title').html(recl.status_text);
					if (recl.status == 5) {
						$('.status[data-status="3"] .title').html('Удовлетворена');
					}
					if (recl.status_comment == 'Ожидается товар') {
						$('#status_comment_cont').addClass('print');
						status_comment = status_comment + '<br/>Распечатайте лист возврата и<br/>вложите в посылку.<a href="/recl.php?action=get_return_list&recl_id=' + recl_id + '&mode=pdf" target="_blank"><img src="/d/img/recl_print.png" alt="печатать"/></a>'
					}
					$('#status_comment_cont .comment').html(status_comment);
					/!*
					$.each(recl.status_history, function (k, v) {
						if (k > 0 && k < recl.status) {
							new_status_comment = v.pop();
							if (new_status_comment.comment) {
								$('.status[data-status="' + k + '"] .title').html(new_status_comment.comment);
							}
						}
					});
					 *!/
				} else {
					$('.status_text span').html('Зарегистрирована');
				}
				$('.recl_type span').html(recl.recl_category);
				var recl_descr = brtext(recl.recl_descr);
				$('.recl_defect_text').html(recl_descr);

				if (recl_files) {
					//Перебираем файлы
					$.each(recl_files, function (k, v) {
						file_type = v.file_type.toLowerCase();
						file_type = (filetypes[file_type]) ? filetypes[file_type] : 'txt';
						file_type_add = (file_type == 'txt') ? ".txt" : "";
						var ico = '<img src="http://b2b.topsports.ru/d/img/recl_ico_' + file_type + '.png">';
						// var is_img = (imgtypes[file_type]) ? 'data-img="' + v.file_name + '"' : '';
						var is_img = (imgtypes[file_type]) ? 'data-fancybox="img"' : '';
						var href = path + '/recl/storage_remote/' + recl.recl_code_1c + '/' + v.file_folder + '/' + v.file_name + '.' + v.file_type + file_type_add;
						$('#files').prepend('<div data-file="' + v.file_name_view + '" data-filename="' + v.file_name_view + '"><a href="' + href + '" target="_blank" ' + is_img + '>' + ico + v.file_name_view + '</a></div>');
						// $('#files').prepend('<div data-recl="' + recl.recl_code_1c + '" ' + is_img + ' data-filename="'+v.file_name_view+'">' + ico + v.file_name_view + '</div>');
					});
				}
				if (recl.recl_messages) {
					//Перебираем сообщения
					$.each(recl.recl_messages, function (k, v) {
						owner = (v.user == user_fio) ? "owner" : "";
						msg = brtext(v.message);
						$('.chat').prepend('<div class="chat_message_cont ' + owner + '"><div class="chat_date">' + v.date + '</div><div class="chat_message"><div class="chat_user">' + v.user + '</div><div class="chat_text">' + msg + '</div></div></div>');
					});
					setTimeout(function () {
						$(".chat").scrollTop($(".chat").get(0).scrollHeight);
//						$(".chat").scrollTop(0);
					}, 1000);
				}
				if (recl.item_title.length > recl.item_title_preview.length) {
					recl.item_title_preview = recl.item_title_preview + '...';
				}
				$('#item_title').html(recl.item_title_preview).attr('data-title', recl.item_title).attr('data-title-preview', recl.item_title_preview);
				$('.item_articul span').html(recl.item_articul);
				if (recl.item_img) {
					$('.item_img').attr('src', 'http://b2b.topsports.ru/c/productpage/' + recl.item_img);
				} else {
					$('.item_img').attr('src', 'http://b2b.topsports.ru/d/img/no_img_big.jpg');
				}
				$('.item_price span').html(recl.item_price);
				$.each(recl.item_options, function (k, v) {
					$('.product_options').append('<div class="option"><span class="opt_title">' + k + '</span>' + v + '</div>');
				});
				if (recl.item_descr != null && recl.item_descr != '') {
					$('.descr,.item_descr_text').html(recl.item_descr);
				} else {
					$('.item_descr,.item_descr_text').hide();
				}
				$('.nav').html('<a href="/">Главная</a><span></span><a href="/recl/">Рекламации</a><span></span> №' + recl.recl_num).show();
				$('.recl.list').addClass('a');
			}
			check_show_switcher();
		}
	});*/
});

function brtext(text) {
	text = text.trim();
	text = text.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '<br/>');
	return text;
}

function check_show_switcher() {
	var cont = $('.recl_defect_cont');
	var def_cont = $('.recl_defect');
	if (def_cont.height() <= cont.height()) {
		$('.hidder, .defect_toggle').hide();
	}
}

function createFormData(files, obj) {
	for (var i = 0; i < files.length; i++) {
		var formFile = new FormData();
		formFile.append('UserFile', files[i]);
		uploadFormData(formFile, obj);
	}
}

function uploadFormData(formFile, obj) {
	var fn = formFile.get('UserFile');
	var file_name = fn.name.split('.').slice(0, -1).join('.');
	var recl_id = obj.attr('data-recl');
	var filetypes = get_filetypes();
	var add = '';
	$.ajax({
		url: "/-aleksa-/TopSports/b2b_new_design/recl/recl.php?action=upload_file&recl_id=" + recl_id,
		type: "POST",
		data: formFile,
		contentType: false,
		cache: false,
		processData: false,
		xhr: function () {
			var xhr = $.ajaxSettings.xhr();
			xhr.upload.addEventListener('progress', function (evt) {
				if (evt.lengthComputable) {
					var percentComplete = Math.ceil(evt.loaded / evt.total * 100);
					$('div[data-file="' + file_name + '"]').css('background-size', percentComplete + '%');
				}
			}, false);
			return xhr;
		},
		success: function (response) {
			var cont = $('div[data-file="' + response.file_name_view + '"]');
			cont.addClass('done');
			if (response.folder == 'images') {
				add = "data-fancybox='img'";
			}
			if (response.folder == 'videos') {
				add = "data-fancybox='vid'";
			}
			file_type = (filetypes[response.file_type]) ? filetypes[response.file_type] : 'txt';
			var ico = '<img src="http://b2b.topsports.ru/d/img/recl_ico_' + file_type + '.png">';
			var href = 'http://80.234.34.212:2000/-aleksa-/TopSports/b2b_new_design/recl/storage_remote/' + recl_id + '/' + response.folder + '/' + response.file_name + '.' + response.file_type;
			cont.html('<a href="' + href + '" ' + add + ' target="_blank">' + ico + ' ' + response.file_name_view + '</a>')
//			$('#' + data.folder).removeClass('hide').addClass('nohide').append('<a href="' + data.link + '" ' + add + '>' + data.file_name + '</a>')
		}
	});
}

function get_filetypes() {
	var filetypes = {
		'mp4': 'mp4',
		'jpg': 'jpg',
		'jpeg': 'jpg',
		'png': 'jpg',
		'gif': 'jpg',
		'pdf': 'pdf',
		'doc': 'doc',
		'docx': 'doc',
		'xls': 'xls',
		'xlsx': 'xls'
	};
	return filetypes;
}
