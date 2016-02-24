//Promise = require("./Promistix.js");
Promise = require("bluebird");

var dones = 0;
var fails = 0;

function getTime() {
	var hrt = process.hrtime();
	return hrt[0] * 1e9 + hrt[1]
}

var t1 = getTime();
var t2 = getTime();

var count = 1000000;
var index = count;

function sink(value) {
	if (--index <= 0) {
		var t2 = getTime();
		console.log((Promise.name || "other") + " => dones:" + dones + " fails:" + fails + " duration:" + ((t2 - t1) / 1e6).toFixed(2));
	}
	return value;
}

for (var i = 0; i < count; ++i) {
	var d = Promise.pending();
	d.promise.then(() => sink(++dones), () => sink(++fails));
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
