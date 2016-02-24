Promise = require("./Promistix.js");
//Promise = require("bluebird");

function benchmark() {
	var dones = 0;
	var fails = 0;

	function getTime() {
		var hrt = process.hrtime();
		return hrt[0] * 1e9 + hrt[1]
	}

	var t1 = getTime();

	for (var i = 0; i < 200000; ++i) {
		var d = Promise.pending();
		d.promise.then(() => ++dones, () => ++fails);
		switch (i % 1) {
			case 0:
				d.resolve(42);
				break;
			case 1:
				d.reject("foo");
				break;
			case 2:
				d.resolve("bar");
				break;
			case 3:
				d.reject(666);
				break;
		}
	}

	setImmediate(() => {
		var t2 = getTime();
		console.log((Promise.name || "other")+ " => dones:" + dones + " fails:" + fails + " duration:" + ((t2 - t1) / 1e6).toFixed(2));
	});
}

benchmark();

