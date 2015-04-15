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

var getProfileFriends = function(id) {
	var url = "https://api.vk.com/method/friends.get?user_id=" + id + "&v=5.29";

	var resolver = Promise.pending();

	request(url, function (err, response, body) {
		if (err) {
			return resolver.reject(err);
		}

		var items = JSON.parse(body);

		//return only 3 friends for easy test
		if(items.error) {
			return resolver.reject(items.error);
		}

		var max = 3;
		var friends = items.response.items.slice(0, max);

		resolver.resolve(friends);
	});

	return resolver.promise;
};

var crawlFriends = function(friends, level, results, resolver) {
	var resolver = (resolver) ? resolver : Promise.pending();

	results = (results) ? results : [];

	var promises = friends.map(function(id) { //timeout need to replace with concurency in future
		return setTimeout(function() {
			return getProfileFriends(id);
		}, 1000); 
	});

	Promise.settle(promises).then(function(res) {
		res = getSettledData(res);

		results = results.concat(res);
		if(level > 0) {
			crawlFriends(res, --level, results, resolver);
		} else {
			resolver.resolve(results);
		}
	}, function(rej) {
		console.log("Reject", rej);
	});

	return resolver.promise;
};

var getProfileFollowers = function(id, author) {
	var url = "https://api.vk.com/method/users.getFollowers?user_id=" + id + "&v=5.29";

	var resolver = Promise.pending();

	request(url, function (err, response, body) { //get followers -> change to get audio in future
		if (err) {
			return resolver.reject(err);
		}
		
		items = JSON.parse(body).response;

		if(items.error) {
			console.log("Error followers", items.error);
			return resolver.reject(items.error);
		}

		var result = {id: id, followersCount: items.count};

		resolver.resolve(result);
	});

	return resolver.promise;
};

var findAudios = function(userList, author) {
	var resolver = Promise.pending();

	var promises = userList.map(function(id) {	//timeout need to replace with concurency in future
		return setTimeout(function() {
			return getProfileFollowers(id, author);
		}, 1000);
	});

	Promise.settle(promises).then(function(res) {
		res = getSettledData(res);
		resolver.resolve(res);
	}, function(rej) {
		console.log("Reject", rej);
	});	

	return resolver.promise;
};

var compare = function(a,b) {
	var key = "followersCount";

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

var startDetecting = function(id, author, level) { //userId, media author, how deep we will search by friends, callback after all done  
	return crawlFriends([id], level).then(function(res) {
		return findAudios(res, author);
	}, function(rej) {
		console.log("Reject", rej);
	});
};

module.exports.startDetecting = startDetecting;

module.exports.getTopList = getTopList;
