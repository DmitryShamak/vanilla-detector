var cheerio = require("cheerio");
var request = require("request");
var mime = require("mime");

var fs = require("fs");

var Q = require("q");

var argv = require("minimist")(process.argv.slice(2), {
	alias: {
		userId: "id"
	}
});

function VanillaDetector() {
	var self = this;

	self.setRequest = function (url, cb) {
		request({
			url: url
		}, function (err, res, data) {
			console.log(data);
		});
	};

	self.getData = function (file, callback) {
		fs.readFile("./vanilla-detector/test_data/" + file, function (err, data) {
			callback(err, data);
		});
	};

	self.getSongsByAuthor = function (id, author, cb) {
		/*var url = "https://api.vk.com/method/audio.get";

		url = "https://vk.com/dev?act=a_run_method&al=1&hash=1428052806%3Ac18a9ce691922268c9&method=users.getFollowers&param_count=2&param_fields=photo_50&param_user_id=85059589&param_v=5.29";

		request({
			url: url,
			method: "POST",
			header: { 'Content-Type': 'application/x-www-form-urlencoded' }
		}, function (err, res, data) {
			console.dir(data.response);
		});

		self.setRequest(url, cb);*/


	};

	self.getProfileById = function (id, cb) {
		var url = "https://vk.com/id" + id;

		self.setRequest(url, cb);
	};

	self.getFriendsOfFriends = function (arr, deep) {
		var promises = [];

		console.log("getFriendsOfFriends: ", arr, deep);

		arr.forEach(function(elem, ind) {
			promises.push(self.getFriendsList(elem));
		});

		var friendsList = null;

		var q = Q.all(
			promises
		).then(function (results) {
			console.log("results: ", results[0]);

			friendsList = results[0];

			if (deep <= 0 || !arr || !arr.length) {
				console.log("return friends");
				return Promise.resolve(results[0]);
			}

			console.log("start new deep");
			return self.getFriendsOfFriends(results[0], --deep);
		});
	};

	self.getFriendsList = function (profile) {
		//find all friends
		var deferred = Q.defer();
		
		setTimeout(function () {
			// setTimeout to resolve the deferred, which will trigger the fulfillment handler of the promise.
			if (profile.friends && profile.friends.length) {
				deferred.resolve(profile.friends);
			} else {
				deferred.resolve(false);
			}
		}, 100);
		// return the promise of the deferred.
		return deferred.promise;
	};

	self.getTopByValue = function (arr, volue, limit, cb) {
		var resArr = [];

		var maxValue = arr[0][value],
			minValue = null;

		arr.forEach(function(elem, ind) {
			//push to resArr position
		});

		return resArr.slice(0, limit)
	};

	self.startSearch = function (userId, author, depthLimit, topLimit, callback) {
		//get af user friends list by depthLimit
		var allFriendsOfTarget = null;

		Q.all([self.getFriendsList(userId)]).then(function (resolve) {
			self.getFriendsOfFriends(resolve, depthLimit)
			.then(function (resolve) {
				allFriendsOfTarget = resolve;
				console.log("allFriendsOfTarget: ", allFriendsOfTarget);
			});
		});

		//get all songs in users list by author

		//get topLimit users with audio length
	};
};

var vanillaDetector = new VanillaDetector();

module.exports = vanillaDetector;
