var cheerio = require("cheerio");
var request = require("request");
var mime = require("mime");

var fs = require("fs");

var Promise = require("bluebird");

var argv = require("minimist")(process.argv.slice(2), {
	alias: {
		userId: "id"
	}
});

var getSettledData = function(data) {
	data = data.map(function(item) {
		return item._settledValue;
	});
	data = [].concat.apply([], data);

	return data;
};

var getProfileFriends = function(id, resolver) {
	var url = "https://api.vk.com/method/friends.get?user_id=" + id + "&v=5.29";

	request(url, function (err, response, body) {
		if (err) {
			return resolver.reject(err);
		}


		var items = JSON.parse(body);

		//return only 5 friends for easy test
		var friends = items.response.items.slice(0, 6);

		resolver.resolve(friends);
	});
};

var crawlFriends = function(friends, level, resolver) {
	var resolver = Promise.pending();

	console.log("start crawl", friends, level);

	if(level > 0) {
		var promises = friends.map(function(id) {
			var innerResolver = Promise.pending();
			
			getProfileFriends(id, innerResolver);

			return innerResolver.promise;
		});

		Promise.settle(promises).then(function(res) {
			resolver.resolve(res);
			//need to go deeper --level
		});
	}

	return resolver.promise;
};

var getProfileFollowers = function(id, author, resolver) {
	var url = "https://api.vk.com/method/users.getFollowers?user_id=" + id + "&v=5.29";

	request(url, function (err, response, body) { //get followers -> change to get audio in future
		if (err) {
			return resolver.reject(err);
		}
		
		body = JSON.parse(body).response;
		var result = {id: id, count: body.count};

		resolver.resolve(result);
	});
};

var findAudios = function(userList, author) {
	var resolver = Promise.pending();

	userList = getSettledData(userList);

	var promises = userList.map(function(id) {
		var innerResolver = Promise.pending();
		
		getProfileFollowers(id, author, innerResolver);

		return innerResolver.promise;
	});

	Promise.settle(promises).then(function(res) {
		resolver.resolve(res);
	});	

	return resolver.promise;
};

var compare = function(a,b) {
	var key = "count";

	if (a[key] < b[key]) {
		return -1;
	}
	if (a[key] > b[key]) {
		return 1;
	}

	return 0;
}

var getTopList = function(list, limit) {
	return list.sort(compare).reverse().slice(0, ++limit);
};

var startDetecting = function(id, author, level, callback) { //userId, media author, how deep we will search by friends, callback after all done  
	crawlFriends([id], level).then(function(res) {
		return findAudios(res, author);
	}).then(function(res) {
		res = getSettledData(res);

		callback(null, getTopList(res, 3));
	});
};

module.exports.startDetecting = startDetecting;
