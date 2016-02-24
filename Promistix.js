module.exports = (function () {
	var WAIT = 0;
	var DONE = 1;
	var FAIL = 2;
	var last_pipe_state_id = 3;

	var queue = [];

	function run_queued() {
		var q = queue;
		var l = q.length;
		queue = [];

		for (var i = 0; i < l; i++) {
			var entry = q[i];
			var state = entry.state;
			var value = entry.value;
			var then = entry.thens;
			while (then) {
				var cfn = then[state],
					next_value = value,
					next_state = state;
				if (typeof cfn === "function") {
					try {
						next_value = cfn(next_value);
						next_state = DONE;
					} catch (error) {
						next_value = error;
						next_state = FAIL;
					}
				}
				transit(then.deferred, next_state, next_value);
				then = then.next;
			};
		}
	}

	function deferred() {
		var def = {
			state: WAIT,
			head: null,
			tail: null,
			value: "",
			promise: { then: function (res, rej) { return then(def, res, rej); } },
			resolve: function (value) { transit(def, DONE, value); },
			reject: function (value) { transit(def, FAIL, value); }
		};
		return def;
	};

	function schedule(def) {
		var thunk = { state: def.state, value: def.value, thens: def.head };
		def.head = def.tail = null;
		queue.push(thunk);
		if (queue.length === 1)
			Promistix.schedule(run_queued);
	}

	function then(def, done, fail) {
		var then = { 1: done, 2: fail, deferred: deferred(), next: null };
		if (def.tail) {
			def.tail.next = then;
			def.tail = then;
		} else {
			def.head = def.tail = then;
		}
		if (def.state !== WAIT)
			schedule(def);
		return then.deferred.promise;
	}

	function then_transit(def, id, state, value) {
		if (def.state === id) {
			def.state = WAIT;
			transit(def, state, value);
		}
	}

	function switch_to(def, state, value) {
		def.value = value;
		def.state = state;
		schedule(def);
	}

	function transit(def, state, value) {
		if (def.state !== WAIT)
			return;

		if (typeof value === "function" || (typeof value === "object" && value !== null)) {
			try {
				if (value === def.promise)
					throw new TypeError("A promise cannot return itself");
				var then = value.then;
				if (state === DONE && typeof then === "function") {
					def.promise.then = then.bind(value);
					var id = def.state = last_pipe_state_id++;
					try {
						then.call(value,
							function (next) {
								then_transit(def, id, DONE, next);
							}, function (next) {
								then_transit(def, id, FAIL, next);
							});
					} catch (error1) {
						if (def.state === id)
							switch_to(def, FAIL, error1);
					}
					return;
				}
			} catch (error2) {
				value = error2;
				state = FAIL;
			}
		}
		switch_to(def, state, value);
	}

	var Promistix = {
		name: "Promistix",
		pending: deferred,
		schedule: setImmediate || (process && process.nextTick) || function () {
			throw new Error("Promistix.schedule must be set to setImmediate in a nodejs environment, or a similar function");
		}
	};

	return Promistix;
})();
