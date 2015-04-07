var cheerio = require("cheerio");
var request = require("request");
var mime = require("mime");

var fs = require("fs");

var Q = require("q");

var argv = require("minimist")(process.argv.slice(2), {
	alias: {
		userId: "id",
		level: "lvl",
		limit: "lim"
	}
});

var findFriends = function (id, currLevel, callback) {
	var url = "https://api.vk.com/method/friends.get?user_id=" + id + "&v=5.29";

	request(url, function (err, response, body) {
		if (err) {
			return callback(err, null);
		}


		items = JSON.parse(body);

		if (!items.error) {
			items = items.response.items;

			var length = items.length;

			console.log("Found %d friends", length);
			setUserToList(id, length);

			items = items.slice(0, 5);
			if (currLevel > 0 && items.length) {
				--currLevel;

				items.forEach(function (item) {
					findFriends(item, currLevel, callback);
				});
			} else {
				callback(null, items);
			}
		} else {
			var error = items.error.error_msg;
			console.log(error);
			callback(error, null);
		}
	});
};

var findProfileAudio = function (id, callback) {

};

var getProfileFullName = function(id) {
	var url = "https://api.vk.com/method/users.get?fields=bdate&user_id=" + id + "&v=5.29";
	var deferred = Q.defer();
	request(url, function (err, response, body) {
		if (err) {
			return deferred.resolve("Anonymus");
		}


		//HOW TO SET RUS SYMBOLS HEADER???
		body = JSON.parse(body).response[0];
		var fullName = body.first_name + " " + body.last_name;

		deferred.resolve(fullName);
	});

	return deferred.promise;
};

var getTopByLimit = function (arr, limit) {
	return arr.sort().slice(-limit);
};

var topList = [];

var setUserToList = function (id, friends) {
	topList.push({
		userId: id,
		friends: friends
	});
};

var detectVanilla = function (targetId, levels, limit, callback) {
	findFriends(targetId, levels, function (err, friends) {
		if (err) {
			return console.log(err);
		}

		if (friends) {
			Q.all(
				friends.map(getProfileFullName)
			).then(function (res) {
				res.forEach(function (item) {
					console.log("FullName: %s", item);
				});
			});
		}
	});
};

module.exports.detectVanilla = detectVanilla;
