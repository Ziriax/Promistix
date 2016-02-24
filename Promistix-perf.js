Promise = require("./Promistix.js");
//Promise = require("bluebird");

var dones = 0;
var fails = 0;

function getTime() {
	var hrt = process.hrtime();
	return hrt[0] * 1e9 + hrt[1];
}

var t1 = getTime();

var count = 1000000;
var index = count;

function always() {
	if (--index <= 0) {
		var t2 = getTime();
		console.log("dones:" + dones + " fails:" + fails + " duration:" + ((t2 - t1) / 1e6).toFixed(2));
	}
}

for (var i = 0; i < count; ++i) {
	var d = Promise.pending();

	d.promise.then(function () {
		++dones;
		always();
	}, function () {
		++fails;
		always();
	});

	switch (i % 4) {
		case 0:
			d.resolve(42);
			break;
		case 1:
			d.reject("foo");
			break;
		case 2:
			d.resolve({ bar: 13 });
			break;
		case 3:
			d.reject(true);
			break;
	}
}
