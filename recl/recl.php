<?php
/*require_once('config.php');
require_once(TOPSPORTS . 'db.php');*/



class reclamations
{
	public $db;
	public $log_dir = "/websites/api.topsports.ru/www/recl/recl_logs/";
	public $img_ext = array('jpg', 'gif', 'png', 'jpeg');
	public $video_ext = array('avi', 'mp4', 'mpeg');
	public $audio_ext = array('mp3', 'wav', 'm4a', 'ogg');
	public $other_ext = array('xls', 'xlsx', 'doc', 'docx', 'pdf', 'ppt', 'pptx', 'txt');
	public $local = 1;

	public $path;
	public $link = "http://api.topsports.ru/recl/storage_remote/";
	public $folders = array("images" => "Изображения", "videos" => "Видео", "other" => "Другое");


	function __construct()
	{
		//$this->db = incube::get_db();
		$this->status_list = array(
			"Зарегистрирована" => 1,
			"Обрабатывается" => 2,
			"Удовлетворена" => 3,
			"Не удовлетворена" => 4,
			"Исполнена" => 5,
		);
		$this->group_types = array(
			1 => "Логистический брак",
			2 => "Недостача",
			3 => "Некомплектность",
			4 => "Несоответствие описанию",
			5 => "Пересорт",
			6 => "Производственный брак",
			7 => "Не могу определить"
		);
		$this->path = ($this->local == 1) ? $_SERVER['DOCUMENT_ROOT']."/-aleksa-/TopSports/b2b_new_design/recl/storage_remote/" : "/websites/api.topsports.ru/www/recl/storage_remote/";
	}

	function recl_list($filter)
	{
		if ($filter) {
			$furl = $filter;
			unset($furl["page"]);
			$urls = '';
			$kk = 0;
			foreach ($furl as $k => $v) {
				if ($kk == 0) {
					$urls .= "?";
					$kk = 1;
				} else {
					$urls .= "&";
				}
				$urls .= "filter[" . $k . "]=" . $v;
			}
			$mas["furl"] = $urls;
		}
		if ($_SESSION["user_info"]["group_id"] == 1) {

			if (isset($_SESSION["custom_user"])) {
				$user = $_SESSION["custom_user"]["info"];
				$user_id = $user["id"];
			} else {
				$user = $_SESSION['user_info'];
				if (isset($filter["user"])) {
					$user_id = $filter["user"];
				} else {
					$user_id = '';
				}
			}
		} else {
			$user = $_SESSION['user_info'];
			$user_id = $user['id'];
		}
		$date_create = ($filter["date"]) ? " AND DATE_FORMAT(recl_date_create,'%d.%m.%Y')='" . $filter["date"] . "'" : "";
		$order_date = ($filter["odate"]) ? " AND DATE_FORMAT(order_date,'%d.%m.%Y')='" . $filter["odate"] . "'" : "";
		$sort_array = array(
			"reclnum" => "recl_num",
			"date" => "recl_date_create",
			"ordernum" => "order_num",
			"odate" => "order_date",
			"manager" => "manager_lastname",
			"articul" => "item_articul",
			"client" => "user_lastname",
			"clientnum" => "contr_name",
			"manager" => "manager_lastname"
		);
		$sort = ($filter["sort"] && $sort_array[$filter["sort"]]) ? $sort_array[$filter["sort"]] : "recl_date_create";
		$direct = ($filter["direct"] && $filter["direct"] == "asc") ? "ASC" : "DESC";
		$page = $filter["page"] ? $filter["page"] : 1;
		$in_page = 60;
		$start = $in_page * ($page - 1);
		$count = 0;
		$list = $this->db->selectPage($count, "SELECT recl_num,recl_code_1c,DATE_FORMAT(recl_date_create,'%d.%m.%Y') AS recl_date,DATE_FORMAT(recl_date_create,'%H.%i.%s') AS recl_time,
														order_id,order_num,DATE_FORMAT(order_date,'%d.%m.%Y') AS order_date,
														item_title,item_count,item_price,item_price_compensation,item_articul,
														client_number,user_name,user_lastname,user_phone,contr_name,
														manager_lastname,manager_name,manager_parentname,manager_phone,
														status,status_text,status_comment
														FROM recl
			WHERE 1=1
			AND deleted = 0
			AND export_1c = 1
            { AND user_id=?d}
            { AND client_number =?}
            { AND user_id IN (?a)}
            { AND recl_num LIKE ? }
			$date_create
			{ AND order_num LIKE ? }
			$order_date
			{ AND (user_lastname LIKE ? OR user_name LIKE ? OR user_parentname LIKE ? OR user_phone LIKE ?) }
			{ AND (contr_name LIKE ? OR client_number LIKE ? ) }
			{ AND (manager_lastname LIKE ? OR manager_name LIKE ? OR manager_parentname LIKE ?) }
			{ AND (item_articul LIKE ? OR item_title LIKE ?)}
			{ AND status =?d}
			ORDER BY $sort $direct
			{LIMIT ?d,$in_page}                                                
			",
			($user["client_super_user"] == 0 && !is_array($user_id) && $user["group_id"] == 2) ? $user_id : DBSIMPLE_SKIP,
			($user["client_super_user"] == 1) ? $user["login"] : DBSIMPLE_SKIP,
			(is_array($user_id) && $user["group_id"] == 1) ? $user_id : DBSIMPLE_SKIP,
			($filter["reclnum"]) ? '%' . $filter["reclnum"] . '%' : DBSIMPLE_SKIP,
			($filter["ordernum"]) ? '%' . $filter["ordernum"] . '%' : DBSIMPLE_SKIP,
			($filter["client"]) ? '%' . $filter["client"] . '%' : DBSIMPLE_SKIP,
			($filter["client"]) ? '%' . $filter["client"] . '%' : DBSIMPLE_SKIP,
			($filter["client"]) ? '%' . $filter["client"] . '%' : DBSIMPLE_SKIP,
			($filter["client"]) ? '%' . $filter["client"] . '%' : DBSIMPLE_SKIP,
			($filter["clientnum"]) ? '%' . $filter["clientnum"] . '%' : DBSIMPLE_SKIP,
			($filter["clientnum"]) ? '%' . $filter["clientnum"] . '%' : DBSIMPLE_SKIP,
			($filter["manager"]) ? '%' . $filter["manager"] . '%' : DBSIMPLE_SKIP,
			($filter["manager"]) ? '%' . $filter["manager"] . '%' : DBSIMPLE_SKIP,
			($filter["manager"]) ? '%' . $filter["manager"] . '%' : DBSIMPLE_SKIP,
			($filter["articul"]) ? '%' . $filter["articul"] . '%' : DBSIMPLE_SKIP,
			($filter["articul"]) ? '%' . $filter["articul"] . '%' : DBSIMPLE_SKIP,
			($filter["status"]) ? $filter["status"] : DBSIMPLE_SKIP,
			($filter["page"]) ? $start : DBSIMPLE_SKIP
		);
		foreach ($list as $k => $v) {
			if ($_SESSION["user_info"]["group_id"] == 2) {
				unset($list[$k]["user_lastname"], $list[$k]["user_phone"]);
			} else {
				$i = ($list[$k]["manager_name"]) ? mb_substr($list[$k]["manager_name"], 0, 1, "UTF-8") . "." : '';
				$o = ($list[$k]["manager_parentname"]) ? mb_substr($list[$k]["manager_parentname"], 0, 1, "UTF-8") . "." : '';
				$list[$k]["io"] = $i . $o;
				unset($list[$k]["manager_name"], $list[$k]["manager_phone"]);
			}
		}
		$mas["list"] = $list;
		$mas["count"] = $count;
		$mas["page"] = $page;
		$pages = helper::count_pages($in_page, $count);
		$mas["pages"] = $pages;
		if ($pages > 1) {
			if ($count > 5) {
				$mas["pagi"][1]["num"] = 1;
				if ($page > 5) {
					$mas["pagi"][1]["first"] = 1;
				}
			}
			for ($i = 1; $i <= ceil($count / $in_page); $i++) {
				if ($page - $i < 5 && $page - $i > -5) {
					$mas["pagi"][$i]["num"] = $i;
					if ($page == $i) {
						$mas["pagi"][$i]["active"] = 1;
					}
				}
			}
			if ($pages - $page > 5) {
				$mas["pagi"][$pages]["num"] = $pages;
				if ($pages - $page >= 5) {
					$mas["pagi"][$pages]["last"] = 1;
				}
			}
		}
		foreach ($filter as $k => $v) {
			if (!$v) {
				unset($filter[$k]);
			}
		}
		$mas["filter"] = $filter;
		$mas["statuslist"] = array_flip($this->status_list);
		return $mas;
	}

	function user_have_recl()
	{
		$user = $_SESSION['user_info'];
		$user_id = $user['id'];
		return $this->db->selectCell("SELECT id FROM recl WHERE 1=1
            { AND user_id=?d}
            { AND client_number =?}
            { AND user_id IN (?a)}",
			($user["client_super_user"] == 0 && !is_array($user_id) && $user["group_id"] == 2) ? $user_id : DBSIMPLE_SKIP,
			($user["client_super_user"] == 1) ? $user["login"] : DBSIMPLE_SKIP,
			(is_array($user_id) && $user["group_id"] == 1) ? $user_id : DBSIMPLE_SKIP);
	}

	function get_recl($recl_id)
	{
		$ui = $_SESSION["user_info"];
		$ug = $ui["group_id"];
		$us = $ui["client_super_user"];
		$recl = $this->db->selectRow("SELECT *,DATE_FORMAT(item_nakl_date,'%d.%m.%Y') AS item_nakl_date  FROM recl
								WHERE recl_code_1c =?
									{AND user_id =?d AND client_number =?}
									{AND client_number =?}
								ORDER BY recl_date_update DESC,id DESC
								LIMIT 1",
			$recl_id,
			($ug == 1 || $us == 1) ? DBSIMPLE_SKIP : $ui["id"],
			($ug == 1 || $us == 1) ? DBSIMPLE_SKIP : $ui["login"],
			($ug == 2 && $us == 1) ? $ui["login"] : DBSIMPLE_SKIP);
		$recl["item_title_preview"] = mb_substr($recl["item_title"], 0, 45, 'UTF-8');
		if ($recl["recl_messages"]) {
			$recl["recl_messages"] = json_decode($recl["recl_messages"], true);
		}
		if ($recl["item_options"]) {
			$recl["item_options"] = json_decode($recl["item_options"]);
		}
		if ($recl["status_history"]) {
			$recl["status_history"] = json_decode($recl["status_history"], true);
		}
		$recl["recl_date"] = date("d.m.Y", strtotime($recl["recl_date_create"]));
		$recl["order_date"] = date("d.m.Y", strtotime($recl["order_date"]));
		$recl["user"] = $_SESSION["user_info"]["lastname"] . " " . $_SESSION["user_info"]["name"];
		return $recl;
	}

	function get_files($recl_id)
	{
		return $this->db->select("SELECT * FROM recl_files WHERE recl_code_1c =? ", $recl_id);
	}

	function get_messages($recl_id)
	{
		return $this->db->select("SELECT * FROM recl_messages WHERE recl_code_1c =?", $recl_id);

	}

	function get_recl_data($recl_id)
	{
		$recl = $this->db->selectRow("SELECT id,order_id AS Заказ_id,recl_category AS group_type,recl_date_create AS date_create,
											user_id,item_code_str AS code_str,item_articul AS articul,item_count AS amount,recl_descr AS comment
											FROM recl WHERE id =?d", $recl_id);
		$user = $this->db->selectCell("SELECT code_1c FROM user WHERE id =?d", $recl["user_id"]);
		$order = $this->db->selectCell("SELECT code_1c FROM in_order WHERE id =?", $recl["Заказ_id"]);
		$mas = $recl;
		$mas["Пользователь_id"] = $user;
		$mas["Заказ_id"] = $order;
		$mas["date_create"] = str_replace(" ", "T", $recl["date_create"]);

		$items = json_decode(file_get_contents("http://b2b.topsports.ru/mad_cron.php?action=GetOrder&order_id=" . $order . "&items=1"), true);
		if ($items["Item"]["Заказ_id"]) {
			$itmp = $items["Item"];
			unset($items["Item"]);
			$items["Item"][] = $itmp;
		}
		foreach ($items["Item"] as $k => $v) {
			if ($v["code_str"] == $recl["code_str"]) {
				$nakl_id = $v["Реализация_id"];
			}
		}
		$mas["ItemList"]["Item"] = array("code_str" => $recl["code_str"], "articul" => $recl["articul"], "amount" => $recl["amount"], "Реализация_id" => $nakl_id);
		$mas["site"] = 1;
		$mas["Links"] = "";
		$mas["Претензия_id"] = "";
		unset($mas["user_id"], $mas["code_str"], $mas["articul"], $mas["amount"]);
		return $mas;
	}

	function send_recl($arr)
	{
		$client = $this->init_1c_soap_client(SOAP_1C_ORDERS);
		$data = array("Orders" => array("Orders" => $arr));
		file_put_contents($this->log_dir . "send_log.txt", "\r\n" . date("Y.m.d H:i:s"), FILE_APPEND);
		file_put_contents($this->log_dir . "send_log.txt", "\r\n" . json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK | JSON_PRETTY_PRINT), FILE_APPEND);
		$result_1c = $client->LoadClaims($data);
		$recl_info = json_encode($result_1c->return->Данные->Orders, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
		$res = json_decode($recl_info, true);
		if ($res["Претензия_id"] != "") {
			$amount = $res["ItemList"]["Item"]["amount"];
//			if ($amount > 0) {
			$folders = array("images", "other", "videos");
			$path = "/websites/api.topsports.ru/www/recl/storage_remote/";
			$recl_id = $res["Претензия_id"];
			if (!file_exists($path . $recl_id)) {
				$new_dir = mkdir($path . $recl_id . "/", 0775);
				if ($new_dir) {
					file_put_contents($path . $recl_id . "/recl_info.txt", $recl_info);
					foreach ($folders as $folder) {
						mkdir($path . $recl_id . "/" . $folder, 0775);
					}
				} else {
					$this->log_recl("cant_makedir", "Не смог создать папку $recl_id");
				}
			} else {
				$this->log_recl("folder_exists", "Папка $recl_id уже есть");
			}
			$return["ok"] = $res["number"];
			$return["kolv"] = $amount;
			$return["recl_id"] = $recl_id;
			$res["item"] = $res["ItemList"]["Item"];
			$res["recl_date"] = date("d.m.Y", strtotime($res["date_create"]));
			unset($res["ItemList"]);
			$return["recl_info"] = $res;
//			} else {
//				$this->log_recl("full_recl", "Максимальное количество рекламаций");
//				$return["fail"] = "Рекламация не создана!<br/>На данную позицию больше рекламаций создать нельзя.";
//			}
		} else {
			$this->log_recl("full_recl", "Максимальное количество рекламаций");
			$return["fail"] = "Рекламация не создана!<br/>На данную позицию больше рекламаций создать нельзя.";
//			$this->log_recl("empty_recl", "Претензия_id в ответе пустая");
//			$return["fail"] = "Рекламация не создана!<br/>Повторите позднее.";
		}
		return $return;
	}

	function save_recl($data)
	{
		if ($_SESSION["user_info"]["id"] == 1) {
//			helper::pr($data);
//			die();
		}
		$order = $this->db->selectRow("SELECT user_id,order_number,code_1c,client_number,date_create,group_type,`action`,action_code_1c,manager_id FROM in_order WHERE id =?d", $data["order_id"]);
		$order_ui = $this->db->selectRow("SELECT id,name,lastname,parentname,phone,work_phone,org FROM user WHERE id=?d", $order["user_id"]);
		$ui = ($_SESSION["user_info"]["group_id"] == 1) ? (($order_ui) ? $order_ui : $_SESSION["user_info"]) : $_SESSION["user_info"];
//		$ui = (isset($_SESSION["custom_user"])) ? $_SESSION["custom_user"]["info"] : $_SESSION["user_info"];
		$mas["creator_id"] = $_SESSION["user_info"]["id"];
		$mas["user_id"] = $ui["id"];
		$mas["user_name"] = $ui["name"];
		$mas["user_lastname"] = $ui["lastname"];
		$mas["user_parentname"] = $ui["parentname"];
		$mas["user_phone"] = ($ui["phone"]) ? $ui["phone"] : $ui["work_phone"];
		$mas["user_code_1c"] = $ui["code_1c"];

		$mas["client_number"] = $order["client_number"];
		$mas["contr_name"] = $ui["org"];

		$mas["recl_date_create"] = date("Y-m-d H:i:s");
//		$mas["recl_num"] = $data["number"];
//		$mas["recl_code_1c"] = $data["Претензия_id"];
		$mas["recl_category"] = $data["group_type"];
		$mas["recl_descr"] = $data["comment"];

		$mas["order_id"] = $data["order_id"];
		$mas["order_num"] = $order["order_number"];
		$mas["order_date"] = $order["date_create"];
		$mas["order_type"] = ($order["action_code_1c"]) ? (($order["action"] != 'Со склада') ? $order["action"] : $order["group_type"]) : $order["group_type"];
//		$mas["order_type"] = (!$order["action"] && $order["action"] == "Со склада") ? $order["group_type"] : $order["action"];
		$mas["order_code_1c"] = $order["code_1c"];

		$mas["item_code_str"] = $data["code_str"];
		$mas["item_title"] = $data["item_title"];
		$mas["item_articul"] = $data["articul"];
		$item = $this->db->selectRow("SELECT hash,img_count,img_list,description FROM in_ob_object WHERE code_1c =?", $data["item_code_1c"]);
		$item_options = unserialize($item["hash"]);
		if ($item_options) {
			$no_display = explode(",", "Тип линзы,Контент менеджер,Бренд,Модель,Серия,Цвет,Статус товара,Размер для сайта,Размер поставщика,Размер взрослый,Размер детский,Размер для фильтров,Американский размер,Европейский размер,Размер американский взрослый,Размер американский детский,Длина стельки взрослый,Порядок");
			foreach ($item_options as $k => $v) {
				$title = $v[0]["title"];
				if (!in_array($title, $no_display)) {
					$options[$title] = $v[0]["val_text"];
				}
			}
			$mas["item_options"] = json_encode($options, JSON_NUMERIC_CHECK | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
		}
		if ($item["img_count"]) {
			$catalog = new catalog();
			$img = $catalog->get_img_object($item["img_list"]);
			$mas["item_img"] = $img[0]["id"] . "." . $img[0]["file_type"];
		}
		$item_order_price = $this->db->selectCell("SELECT price FROM in_order_object WHERE object_articul =? AND code_str =?d", $data["articul"], $data["code_str"]);
		$mas["item_count"] = $data["amount"];
		$mas["item_price"] = $item_order_price;
//		$mas["item_price_compensation"] = $data["item"]["summ"];
		$mas["item_nakl"] = $data["nakl"];
		$mas["item_nakl_date"] = $data["nakl_date"];
		$mas["item_descr"] = $item["description"];

		$manager = $this->db->selectRow("SELECT id,name,lastname,parentname,phone,work_phone FROM user WHERE code_1c =?", $order["manager_id"]);
		$mas["manager_id"] = $manager["id"];
		$mas["manager_name"] = $manager["name"];
		$mas["manager_lastname"] = $manager["lastname"];
		$mas["manager_parentname"] = $manager["parentname"];
		$mas["manager_phone"] = ($manager["work_phone"]) ? $manager["work_phone"] : $manager["phone"];

		return $this->db->query("INSERT INTO recl SET ?a", $mas);
	}

	function update_recl($recl_id, $id = false)
	{
		$mas = array();
		$client = $this->init_1c_soap_client(SOAP_1C_ORDERS);
		$request["Претензия_id"] = $recl_id;
		$result_1c = $client->GetClaims($request);
//		$this->save_import_logs($request,id,$answer);
		$answer = json_decode(json_encode($result_1c->return->Данные->Orders, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE), true);
		$item = $answer["ItemList"]["Item"];
		$mas["item_code_str"] = $item["code_str"];
		$recl = $this->db->selectRow("SELECT id,recl_messages,status,status_comment FROM recl WHERE id =?d", $id);
		$status = $answer["ClaimStatus"];
		$status_comment = $answer["ClaimComment"];
		$date = date("Y-m-d H:i:s");
		$order = $this->db->selectRow("SELECT user_id,order_number,code_1c,date_create,group_type,`action`,action_code_1c FROM in_order WHERE code_1c =?", $answer["Заказ_id"]);
		$mas["client_number"] = $answer["client_number"];
		$mas["contr_name"] = $answer["client_name"];
		$mas["recl_date_create"] = date("Y-m-d H:i:s", strtotime($answer["date_create"]));
		$mas["recl_num"] = $answer["number"];
		$mas["recl_code_1c"] = $answer["Претензия_id"];
		$mas["recl_category"] = $answer["group_type"];
		$mas["recl_descr"] = $answer["comment"];
		$mas["order_id"] = $answer["id"];
		$mas["order_num"] = $order["order_number"];
		$mas["order_date"] = $order["date_create"];
//		$mas["order_type"] = (!$order["action"] && $order["action"] == "Со склада") ? $order["group_type"] : $order["action"];
		$mas["order_type"] = ($order["action_code_1c"]) ? (($order["action"] != 'Со склада') ? $order["action"] : $order["group_type"]) : $order["group_type"];
		$mas["order_code_1c"] = $order["code_1c"];
		$mas["item_title"] = $item["title"];
		$mas["item_articul"] = $item["articul"];

		$object = $this->db->selectRow("SELECT hash,img_count,img_list,description FROM in_ob_object WHERE code_1c =?", $item["Характеристика_id"]);
		$mas["item_descr"] = $object["description"];
		$item_options = unserialize($object["hash"]);
		if ($item_options) {
			$no_display = explode(",", "Тип линзы,Контент менеджер,Бренд,Модель,Серия,Цвет,Статус товара,Размер для сайта,Размер поставщика,Размер взрослый,Размер детский,Размер для фильтров,Американский размер,Европейский размер,Размер американский взрослый,Размер американский детский,Длина стельки взрослый,Порядок");
			foreach ($item_options as $k => $v) {
				$title = $v[0]["title"];
				if (!in_array($title, $no_display)) {
					$options[$title] = $v[0]["val_text"];
				}
			}
			$mas["item_options"] = json_encode($options, JSON_NUMERIC_CHECK | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
		}
		if ($object["img_count"]) {
			$catalog = new catalog();
			$img = $catalog->get_img_object($object["img_list"]);
			$mas["item_img"] = $img[0]["id"] . "." . $img[0]["file_type"];
		}
		$mas["item_count"] = $item["amount"];
		$mas["item_price"] = $item["price"];
		$mas["item_price_compensation"] = $item["summ"];
		if ($answer["chat"]) {
			$chat = $this->parse_chat($answer["chat"]);
			$chat = json_encode($chat, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_NUMERIC_CHECK);
			$mas["recl_messages"] = $chat;
			if ($recl && md5($recl["recl_messages"]) != md5($chat)) {
				$mas["recl_messages_date_update"] = $date;
			}
		}
		if ($this->status_list[$status]) {
			$mas["status"] = $this->status_list[$status];
			$mas["status_text"] = $status;
			$mas["status_comment"] = $status_comment;
			$status_history = $this->parse_status($answer["ClaimStatusList"]["RowClaimStatus"]);
			$mas["status_history"] = json_encode($status_history, JSON_NUMERIC_CHECK | JSON_UNESCAPED_UNICODE);
			if ($recl && ($recl["status"] != $status || $recl["status_comment"] != $status_comment)) {
				$mas["status_date_update"] = $date;
			}
		}
		if ($mas["recl_messages_date_update"] || $mas["status_date_update"]) {
			$mas["recl_date_update"] = $date;
		}
		if ($answer["Менеджер_id"]) {
			$manager = $this->db->selectRow("SELECT id,name,lastname,parentname,phone,work_phone FROM user WHERE code_1c =?", $answer["Менеджер_id"]);
			if ($manager) {
				$mas["manager_id"] = $manager["id"];
				$mas["manager_name"] = $manager["name"];
				$mas["manager_lastname"] = $manager["lastname"];
				$mas["manager_parentname"] = $manager["parentname"];
				$mas["manager_phone"] = ($manager["work_phone"]) ? $manager["work_phone"] : $manager["phone"];
			}
		}
		if ($answer["Пользователь_id"]) {
			$ui = $this->db->selectRow("SELECT id,name,lastname,parentname,phone,work_phone FROM user WHERE code_1c =?", $answer["Пользователь_id"]);
		} else {
			$ui = $this->db->selectRow("SELECT id,name,lastname,parentname,phone,work_phone FROM user WHERE id=?d", $order["user_id"]);
			if (!$ui && isset($_SESSION["user_info"]) && $_SESSION["user_info"]["group_id"] == 1) {
				$ui = $_SESSION["user_info"];
			}
		}
		if ($ui) {
			$mas["user_id"] = $ui["id"];
			$mas["user_name"] = $ui["name"];
			$mas["user_lastname"] = $ui["lastname"];
			$mas["user_parentname"] = $ui["parentname"];
			$mas["user_phone"] = ($ui["work_phone"]) ? $ui["work_phone"] : $ui["phone"];
			$mas["user_code_1c"] = $ui["code_1c"];
		}
		$mas["export_1c"] = 1;
		$items = json_decode(file_get_contents("http://b2b.topsports.ru/mad_cron.php?action=GetOrder&order_id=" . $answer["Заказ_id"] . "&items=1"), true);
		if ($items["Item"]["Заказ_id"]) {
			$itmp = $items["Item"];
			unset($items["Item"]);
			$items["Item"][] = $itmp;
		}
		foreach ($items["Item"] as $k => $v) {
			if ($v["code_str"] == $mas["item_code_str"]) {
				$nakl = $this->getnakl_recl($v["Реализация"]);
				$mas["item_nakl"] = $nakl["number"];
				$mas["item_nakl_date"] = $nakl["date"];
				$mas["item_nakl_code_1c"] = $items["Item"][$k]["Реализация_id"];
			}
		}
		if ($_GET["verbal"]) {
			helper::pr("answer");
			helper::pr($answer);
			helper::pr("mas");
			helper::pr($mas);
			die();
		}
		file_put_contents($this->log_dir . "update_log.txt", "\r\n" . date("Y.m.d H:i:s"), FILE_APPEND);
		file_put_contents($this->log_dir . "update_log.txt", "\r\n" . json_encode(array("recl_id" => $answer["Претензия_id"], "answer" => $answer), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK | JSON_PRETTY_PRINT), FILE_APPEND);
		if ($recl) {
			$this->db->query("UPDATE recl SET ?a WHERE id =?d", $mas, $id);
		} else {
			$mas["creator_id"] = 0;//FROM 1C!
			$this->db->query("INSERT INTO recl SET ?a", $mas);
		}
		file_put_contents($this->log_dir . "update_log.txt", "\r\nMAS\r\n", FILE_APPEND);
		file_put_contents($this->log_dir . "update_log.txt", "\r\n" . json_encode($mas, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK | JSON_PRETTY_PRINT), FILE_APPEND);
	}

	function getnakl_recl($c)
	{
		$data = array();
		if (!empty($c)) {
			$a = array("Накладная ", "накладная ", "№ ", "от ", "г.");
			$c = str_replace($a, "", $c);
			$d = explode(' ', trim($c));
			$w = explode("-", $d[0]);
			$b = $w[0];
			$c = $w[1];
			$data["number"] = $b . "-" . round($c);
			$date = explode('.', $d[1]);
			$data["date"] = $date[2] . "-" . $date[1] . "-" . $date[0];
		}
		return $data;
	}


	function send_message($data)
	{
//		$ui = (isset($_SESSION["custom_user"])) ? $_SESSION["custom_user"]["info"] : $_SESSION["user_info"];
		$ui = $_SESSION["user_info"];
		$lastname = ($ui["lastname"] != "") ? $ui["lastname"] : "";
		$name = ($ui["name"] != "") ? $ui["name"] : "";
		$parentname = ($ui["parentname"] != "") ? $ui["parentname"] : "";
		$fio = $lastname . (($name) ? " " . $name : "") . (($parentname) ? " " . $parentname : "");
		$mas["sender"] = $fio;
		$mas["guide"] = $data["recl_id"];
		$time = time();
		$mas["date"] = date("Y-m-d", $time) . "T" . date("H:i:s", $time);
		$mas["text"] = $data["comment"];
		$client = $this->init_1c_soap_client(SOAP_1C_ORDERS);
		$result_1c = $client->LoadChat($mas);//guide,date,sender,text
		return $result_1c;
	}

	function save_recl_message($data)
	{
		$recl_id = $this->recl_exists($data["recl_id"]);
		if ($recl_id) {
			$time = time();
			$mas["recl_id"] = $recl_id;
			$mas["recl_code_1c"] = $data["recl_id"];
			$mas["user_id"] = $_SESSION["user_info"]["id"];
			$mas["send_date"] = date("Y-m-d H:i:s", $time);
			$mas["send_text"] = $data["comment"];
			$mas["recl_text"] = $this->db->selectCell("SELECT recl_messages FROM recl WHERE id =?d", $recl_id);

			$this->db->query("INSERT INTO recl_messages SET ?a", $mas);
		}
	}

	function upload_file($recl_id)
	{
		$recl_path = $this->path . $recl_id . "/";
		if (file_exists($recl_path)) {
			if (is_uploaded_file($_FILES["UserFile"]["tmp_name"])) {
				$file_name = $_FILES["UserFile"]["name"];
				$ext = $this->get_ext($file_name);
				$file_name = substr($file_name, 0, (strrpos($file_name, ".")));
				$file_name_view = trim($file_name);
				$file_name = md5($file_name_view);

				$new_ext = "";
				if (in_array($ext, $this->img_ext)) {
					$folder = "images";
				} elseif (in_array($ext, $this->video_ext)) {
					$folder = "videos";
				} elseif (in_array($ext, $this->other_ext)) {
					$folder = "other";
				} else {
					$folder = "other";
					$new_ext = ".txt";
				}
				$new_file_path = $folder . "/" . $file_name . "." . $ext . $new_ext;
				move_uploaded_file($_FILES["UserFile"]["tmp_name"], $recl_path . $new_file_path);
				if ($folder == "images") {
					$this->createThumbnail($recl_path . $new_file_path, $recl_path . $folder . "/" . $file_name . "_t." . $ext, 90);
				}
				$data["file_name_view"] = $file_name_view;
				$data["file_type"] = $ext;
				$data["recl_id"] = $recl_id;
				$data["file_name"] = $file_name;
				$data["folder"] = $folder;
				return $data;
			}
		}
	}

	function save_recl_image($data)
	{
		$recl_id = $this->recl_exists($data["recl_id"]);
		$mas["recl_id"] = $recl_id;
		$mas["recl_code_1c"] = $data["recl_id"];
		$mas["user_id"] = $_SESSION["user_info"]["id"];
		$mas["send_date"] = date("Y-m-d H:i:s");
		$mas["file_name_view"] = $data["file_name_view"];
		$mas["file_name"] = $data["file_name"];
		$mas["file_type"] = $data["file_type"];
		$mas["file_folder"] = $data["folder"];

		$this->db->query("INSERT INTO recl_files SET ?a", $mas);
	}

	function recl_exists($recl_id)
	{
		return $this->db->selectCell("SELECT id FROM recl WHERE recl_code_1c = ?", $recl_id);
	}

	function parse_chat($a)
	{
		$pat = "/(\d{1,2}[\.]{1}\d{1,2}[\.]{1}\d{1,4} \d{1,2}[\:]{1}\d{1,2}[\:]{1}\d{1,2}) (.*?) \>(.*?)/ism";
		preg_match_all($pat, $a, $ar);
		mb_internal_encoding("UTF-8");
		foreach ($ar[0] as $k => $v) {
			$s[$k] = mb_strpos($a, trim($v));
			$l[$k] = mb_strlen(trim($v)) + 1;
			$vals[$k]["date"] = date("H:i d.m.Y", strtotime($ar[1][$k]));
			$vals[$k]["user"] = trim($ar[2][$k]);
		}
		foreach ($ar[0] as $k => $v) {
			$start = $s[$k] + $l[$k];
			$stop = ($vals[$k + 1]) ? $s[$k + 1] - $start : mb_strlen(trim($a)) - $start;
			$vals[$k]["message"] = mb_substr($a, $start, $stop);
		}
//		helper::pr($vals);
//		die();
		/*
		$l = explode(chr(10).chr(10), $a);
		$pat = "/(\d{1,2}[\.]{1}\d{1,2}[\.]{1}\d{1,4} ([0-9])[\:]{1}\d{1,2}[\:]{1}\d{1,2})(.*)\>(.*)/ism";
		foreach ($l as $k => $v) {
			if ($v) {
				preg_match($pat, $v, $ar);
				unset($ar[0]);
				$vals[$k]["date"] = date("H:i d.m.Y", strtotime($ar[1]));
				$vals[$k]["user"] = trim($ar[2]);
				$vals[$k]["message"] = trim($ar[3]);
			}
		}
		*/
		return $vals;
	}

	function get_img($code_1c)
	{
		$return = "http://b2b.topsports.ru/d/img/no_img_big.jpg";
		$item = $this->db->selectRow("SELECT img_count,img_list FROM in_ob_object WHERE code_1c =?", $code_1c);
		if ($item["img_count"]) {
			$catalog = new catalog();
			$img = $catalog->get_img_object($item["img_list"]);
			$return = "http://b2b.topsports.ru/c/productlist/" . $img[0]["id"] . "." . $img[0]["file_type"];
		}
		return $return;
	}

	function init_1c_soap_client($mode)
	{
		$uri = $mode;
		$login = SOAP_1C_LOGIN;
		$password = SOAP_1C_PASS;
		$context = array('ssl' => array('verify_peer' => false, 'verify_peer_name' => false));
		$options = array(
			'soap_version' => SOAP_1_2,
			"stream_context" => stream_context_create($context),
			'login' => $login,
			'password' => $password,
			'trace' => true,
			'cache_wsdl' => 0,
			'exceptions' => true
		);

		try {
			$client = new SoapClient($uri, $options);
			return $client;
		} catch (Exception $e) {
			echo "Не получилось создать SoapClient .";
			var_dump($e->getMessage());
			die();
		}
	}


	function log_recl($report_name, $data)
	{
		$data = date("Y-m-d H:i:s") . "\r\n" . $data;
		file_put_contents($this->log_dir . $report_name . ".txt", $data . "\r\n", FILE_APPEND);
	}

	function get_ext($file_name)
	{
		$pos_ext = strrpos($file_name, '.');
		$ext = trim(strtolower(substr($file_name, $pos_ext + 1)));
		return $ext;
	}

	function get_img_type($src) {
		 return str_replace("image/", "", mime_content_type($src));

/*        $finfo = new finfo(FILEINFO_MIME);
        $srcM = $_GET[$src];

		return str_replace("image/", "", var_dump($finfo->buffer(file_get_contents($srcM))));*/
	}
	
	function parse_status($a)
	{
		foreach ($a as $v) {
			$status = $this->status_list[$v["Status"]];
			$stat["title"] = $v["Status"];
			$stat["comment"] = $v["CommentStatus"];
			$stat["date"] = $v["Date"];
			$s[$status][] = $stat;
		}
		return $s;
	}

	function get_recl_img($recl_id, $img_id)
	{
		$file_type = $this->db->selectCell("SELECT file_type FROM recl_files WHERE recl_code_1c =? AND file_name =?", $recl_id, $img_id);
		$path = $this->path . $recl_id . "/images/" . $img_id . "." . $file_type;
		if (file_exists($path)) {
			$image = file_get_contents($path);
			$data["image"] = base64_encode($image);
			$data["ext"] = $file_type;
		}
		return $data;
	}

	function recl_file_list($recl_id, $folder = false)
	{
		$link = $this->link . $recl_id . "/";
		$folder = ($folder) ? " AND file_folder = '" . $folder . "'" : '';
		return $this->db->selectCol("SELECT CONCAT('$link',file_folder,'/',file_name,'.',file_type) FROM recl_files WHERE recl_code_1c =? $folder ORDER BY file_folder", $recl_id);
	}

	function createThumbnail($src, $dest, $targetWidth, $targetHeight = null)
	{
		$imghandlers = array(
			"jpeg" => array(
				"load" => "imagecreatefromjpeg",
				"save" => "imagejpeg",
				"quality" => 80
			),
			"png" => array(
				"load" => "imagecreatefrompng",
				"save" => "imagepng",
				"quality" => 0
			),
			"gif" => array(
				"load" => "imagecreatefromgif",
				"save" => "imagegif"
			)
		);

		$type = $this->get_img_type($src);

		if (!$type || !$imghandlers[$type]) {
			return null;
		}

		$image = call_user_func($imghandlers[$type]["load"], $src);

		if (!$image) {
			return null;
		}

		$width = imagesx($image);
		$height = imagesy($image);

		if ($targetHeight == null) {

			$ratio = $width / $height;

			if ($width > $height) {
				$targetHeight = floor($targetWidth / $ratio);
			} else {
				$targetHeight = $targetWidth;
				$targetWidth = floor($targetWidth * $ratio);
			}
		}

		$thumbnail = imagecreatetruecolor($targetWidth, $targetHeight);

		if ($type == "gif" || $type == "png") {

			imagecolortransparent(
				$thumbnail,
				imagecolorallocate($thumbnail, 0, 0, 0)
			);

			if ($type == "png") {
				imagealphablending($thumbnail, false);
				imagesavealpha($thumbnail, true);
			}
		}

		imagecopyresampled(
			$thumbnail,
			$image,
			0, 0, 0, 0,
			$targetWidth, $targetHeight,
			$width, $height
		);

		return call_user_func(
			$imghandlers[$type]["save"],
			$thumbnail,
			$dest,
			$imghandlers[$type]["quality"]
		);
	}

	function get_return_list($recl_id, $mode = false)
	{
		$mode = ($mode) ? $mode : "pdf";
		$lastname = ($_SESSION["user_info"]["lastname"] != "") ? $_SESSION["user_info"]["lastname"] : "";
		$name = ($_SESSION["user_info"]["name"] != "") ? $_SESSION["user_info"]["name"] : "";
		$parentname = ($_SESSION["user_info"]["parentname"] != "") ? $_SESSION["user_info"]["parentname"] : "";
		$fio = $lastname . (($name) ? " " . $name : "") . (($parentname) ? " " . $parentname : "");
		$mas["FIO"] = $fio;
		$mas["guid"] = $recl_id;
		$return = "";
		$client = $this->init_1c_soap_client(SOAP_1C_ORDERS);
		if ($mode == "pdf") {
			$result_1c = $client->GetPackingSheetPDF($mas);
		} elseif ($mode == "xls") {
			$result_1c = $client->GetPackingSheetXLS($mas);
		}
		if ($result_1c) {
			$return = $result_1c->return;
		}
		return $return;
	}

	function count_recl_str($order_id, $articul, $code_str)
	{
		$recl_count = $this->db->selectCell("SELECT sum(item_count) FROM recl
										WHERE deleted = 0										
										AND order_id =?d AND item_articul =? AND item_code_str =?",
			$order_id, $articul, $code_str);
		$recl_count = ($recl_count) ? $recl_count : 0;
		return $recl_count;
	}

	function hide_recl($id)
	{
		$this->db->query("UPDATE recl SET deleted = 1 WHERE id =?d OR recl_code_1c =?", $id, $id);
		file_put_contents($this->log_dir . "hide_log.txt", "\r\n" . json_encode($_SESSION["user_info"], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK | JSON_PRETTY_PRINT), FILE_APPEND);
	}

	function delete_recl($id)
	{
		$this->db->query("DELETE FROM recl WHERE id =?d", $id);
	}

	function get_recl_id($recl_id)
	{
		return $this->db->selectCell("SELECT id FROM recl WHERE recl_code_1c =? LIMIT 1", $recl_id);
	}

	function update_all()
	{
		$list = $this->db->selectCol("SELECT recl_code_1c,id AS ARRAY_KEY FROM recl WHERE deleted = 0");
		foreach ($list as $id => $recl_id) {
			$this->update_recl($recl_id, $id);
		}
	}

	function save_export_logs($mas, $id, $answer)
	{
		$this->db->query("INSERT INTO export_1c_logs SET 
			date = NOW(),
			mode ='recl',
			user_id =?,
			data_id=?d,
			data =?,
			answer=?",
			$_SESSION["user_info"]["id"],
			$id,
			json_encode($mas, JSON_UNESCAPED_UNICODE | JSON_NUMERIC_CHECK | JSON_UNESCAPED_SLASHES),
			json_encode($answer, JSON_UNESCAPED_UNICODE | JSON_NUMERIC_CHECK | JSON_UNESCAPED_SLASHES)
		);
	}

}

$get = $_GET;
if (isset($_GET["action"])) {
	$action = $get["action"];
}
$recl = new reclamations();
if ($get["recl_id"]) {
	$recl_id = $get["recl_id"];
	if (file_exists($recl->path . $recl_id)) {
		if (isset($action)) {
			switch ($action) {
				case "get_recl":
					$answer = $recl->get_recl($recl_id);
					if ($answer) {
						if (isset($get["verbal"])) {
							helper::pr($answer);
							die();
						}
						$data["recl"] = $answer;
						$data["recl_files"] = $recl->get_files($recl_id);
					}
					break;
				case "upload_file":
					$data = $recl->upload_file($recl_id);
					if ($data) {
						//$recl->save_recl_image($data);
					}
					break;
				case "send_message":
					$mas = $_POST["recl"];
					//$response = $recl->send_message($mas);
					/*if ($response) {
						$data["ok"] = 1;
						//$recl->save_recl_message($mas);
					}*/
					break;
				case "recl_img":
					$data = $recl->get_recl_img($recl_id, $get["recl_img"]);
					break;
				case "recl_file_list":
					$folder = ($get["type"]) ? $get["type"] : '';
					$data = $recl->recl_file_list($recl_id, $folder);
					break;
				case "update_recl":
					$id = $recl->get_recl_id($recl_id);
					$recl->update_recl($recl_id, $id);
					die("OK");
					break;
				case "get_return_list":
					if ($get["mode"]) {
						$content = $recl->get_return_list($recl_id, $get["mode"]);
						$name = "Лист возврата";
						if ($get["mode"] == "pdf") {
							header('Content-Type: application/pdf');
						} elseif ($get["mode"] == "xls") {
							header("Content-Type:   application/vnd.ms-excel; charset=utf-8");
						}
						if ($content) {
							header('Content-Disposition: attachment; filename="' . $name . '.' . $get["mode"] . '"');
							header('Content-Length: ' . strlen($content));
							echo $content;
						}
					}
					die();
					break;
				case "del_recl":
					$recl->hide_recl($recl_id);
					echo "OK";
					die();
					break;
			}
		}
	} else {
		$data["error"] = "Рекламация не найдена!";
	}
} else {
	switch ($action) {
		case "update_all":
			$recl->update_all();
			break;
		case "get_img":
			$data = $recl->get_img($get["code_1c"]);
			break;
		case "resend_recl":
			$id = $get["recl"];
			$arr = $recl->get_recl_data($id);
			$data = $recl->send_recl($arr);
			$recl->save_export_logs($post, $id, $data);
			if ($data) {
				$recl->update_recl($data["recl_id"], $id);
			}
			break;
		case "send_recl":
			$post = $_POST["recl"];
			$recl_kolv = $recl->count_recl_str($post["order_id"], $post["articul"], $post["code_str"]);
			if ($recl_kolv < $post["max_otgrz"]) {
				$id = $recl->save_recl($post);
				$user_code_1c = $_SESSION["user_info"]["code_1c"];
				if ($_SESSION["user_info"]["group_id"] == 1) {
					$order_user_id = $DBS->selectCell("SELECT user_id FROM in_order WHERE id =?d", $post["order_id"]);
					if ($order_user_id) {
						$user_code_1c = $DBS->selectCell("SELECT code_1c FROM user WHERE id=?d", $order_user_id);
						if (!$user_code_1c) {
							$user_code_1c = $_SESSION["user_info"]["code_1c"];
						}
					} else {
						$user_code_1c = $_SESSION["user_info"]["code_1c"];
					}
				}
				$ItemList["code_str"] = $post["code_str"];
				$ItemList["articul"] = $post["articul"];
				$ItemList["amount"] = $post["amount"];
				$ItemList["Реализация_id"] = $post["doc_id"];

				$arr["id"] = $post["order_id"];
				$arr["Заказ_id"] = $post["code_1c"];
				$arr["group_type"] = $post["group_type"];
				$arr["date_create"] = date("Y-m-d", time()) . "T" . date("H:i:s", time());
				$arr["Пользователь_id"] = $user_code_1c;
				$arr["ItemList"]["Item"] = $ItemList;
				$arr["comment"] = $post["comment"];
				$arr["site"] = "1";
				$arr['Links'] = "";
				$arr["Претензия_id"] = "";
				$recl->save_export_logs($post, $id, $arr);
				$data = $recl->send_recl($arr);
				if ($data) {
					$recl->update_recl($data["recl_id"], $id);
					$data["str_kolv"] = $recl_kolv;
				} else {
					$recl->delete_recl($id);
				}
			} else {
				$data["fail"] = "Рекламация не создана!<br/>На данную позицию больше рекламаций создать нельзя.";
			}
			break;
		default:
			$filter = ($_GET["filter"]) ? $_GET["filter"] : array();
			$filter["page"] = ($filter["page"]) ? $filter["page"] : 1;
			$data = $recl->recl_list($filter);
			$data["user_have_recl"] = ($_SESSION["user_info"]["group_id"] == 1) ? 1 : $recl->user_have_recl();
			break;
	}
}
if ($data) {
	header("Content-type: application/json; charset=utf-8");
	echo json_encode($data);
}
