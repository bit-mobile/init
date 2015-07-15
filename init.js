// @reqiure ./init.css
var $ = require("modules-common/zepto/zepto.js"),
	Backbone = require("modules-common/backbone/backbone.js"),
	// ios不支持js直接调用框架的函数，需要通过url来做中转，WebViewJavascriptBridge封装了此操作
	WebViewJavascriptBridge = require("modules-common/webView-javascript-bridge/webView-javascript-bridge.js"),
	fastclick = require("modules-common/fastclick/fastclick.js");

// 设置backbone的$为zepto
Backbone.$ = $;

// 设置全局变量
window.global = window.global || {};
window.global.data = {};
window.global.modules = {};

// 消除click事件的延迟
fastclick(document.body);

// api url头部设置
global.baseUrl = "https://api.starfish.im/v1";

// 设置ajax
$.ajaxSettings.timeout = 15000;
$.ajaxSettings.xhrFields = {
	withCredentials: true  //设置后，跨域也会附带cookies信息
};

// 常量定义
global.DEST_TYPE = {
	ORG_MEMBER: 0,
	DISCUSSION_GROUP: 1,
	ORG: 2,
	DEPARTMENT: 3
}

global.MSG_TYPE = {
	TYPE_FILES_CREATED: 48
}

global.UPLOAD_FILE_STATE = {
	WAIT: 1,
	SENDING: 2,
	FINISH: 3,
	ERROR: 4
};

global.ACTION_TYPE = {
	NEW_SUBJECT: 1,
	REPLY: 2,
	FORWARD: 4
}

global.SRC_TYPE = {
	SYSTEM: 0,
	ORG_MEMBER: 1,
	EXTERNAL_CONTACTS: 2
}

// 平台设置
var userAgent = navigator.userAgent;
if ( !!userAgent.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/) ){
	global.platform = "ios";
} else if ( userAgent.indexOf('Android') > -1 || userAgent.indexOf('Linux') > -1 ) {
	global.platform = "android";
}


// 由于ios不能像安卓一样向webview注入接口，需要使用WebViewJavascriptBridge来辅助实现和安卓一样的接口
if ( global.platform === "ios" ) {
	WebViewJavascriptBridge.init();
	window.starfish = {
		get: function(type, callback) {
			window.WebViewJavascriptBridge.callHandler("get", type, callback);
		},
		finish: function() {
			window.WebViewJavascriptBridge.callHandler("close", null, null);
		},
		refresh: function() {
			window.WebViewJavascriptBridge.callHandler("refresh", null, null);
		},
		set: function(type, value, callback) {
			window.WebViewJavascriptBridge.callHandler("set", {
				type: type,
				value: value
			}, callback);
		}
	};
	$("html").addClass("ios");
}


module.exports = function(fn) {

	function handle(data) {

		global.data.orgId = data.orgId;
		global.data.from = data.from;

		global.data.user = new Backbone.Model(data.user);
		global.data.peopleList = new Backbone.Collection(data.peopleList);
		global.data.leftList = new Backbone.Collection(data.leftList);
		global.data.departmentList = new Backbone.Collection(data.departmentList);
		global.data.groupList = new Backbone.Collection(data.groupList);
		global.data.peopleListSeq = new Backbone.Collection(data.peopleListSeq);

		fn();
	}

	// 如果在starfish框架中加载
	if (window.starfish && window.starfish.get) {

		if (global.platform === "ios") {
			starfish.get("user,peopleList,peopleListSeq,leftList,orgId,from,departmentList,groupList", function(data) {
				handle(data);
			});
		} else {
			var starfishData = window.starfish.get("user,peopleList,peopleListSeq,leftList,orgId,from,departmentList,groupList");

			starfishData = JSON.parse(starfishData);

			starfishData.user = JSON.parse(starfishData.user);
			starfishData.peopleList = JSON.parse(starfishData.peopleList);
			starfishData.leftList = JSON.parse(starfishData.leftList);
			starfishData.departmentList = JSON.parse(starfishData.departmentList);
			starfishData.groupList = JSON.parse(starfishData.groupList);
			starfishData.peopleListSeq = JSON.parse(starfishData.peopleListSeq);

			handle(starfishData);
		}


	} else {
		// 如果在浏览器上加载，使用测试数据
		var data = require("./data.js");
		handle( data );
	}
}