module.exports = (function () {
	var WAIT = 0;
	var DONE = 1;
	var FAIL = 2;
	var last_pipe_state_id = 3;

	function Deferred() {
		var self = this;
		self.state = WAIT;
		self.head = this.tail = null;
		self.value = "";
		self.promise = {
			then: function(res, rej) {
				 return self.then(res, rej);
			}
		};
	};

    function call_thens(state, value, then) {
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
            then.deferred.transit(next_state, next_value);
			then = then.next;
		};
    }

    function then_transit(id, state, value) {
        if (this.state === id) {
            this.state = WAIT;
            this.transit(state, value);
        }
    }

    Deferred.prototype = {
    	asap: function () {
		    var state = this.state,
			    value = this.value,
			    thens = this.head;
            this.head = this.tail = null;
            Promistix.schedule(function() {
	            call_thens(state, value, thens);
            });
        },
        switchTo: function(state, value) {
        	this.value = value;
            this.state = state;
            this.asap();
        },
        transit: function (state, value) {
	        if (this.state !== WAIT)
	        	return;

            if (typeof value === "function" || (typeof value === "object" && value !== null)) {
                try {
                    if (value === this.promise)
                        throw new TypeError("A promise cannot return itself");
                    var then = value.then;
                    if (state === DONE && typeof then === "function") {
                        this.promise.then = then.bind(value);
                        var id = this.state = last_pipe_state_id++;
                        try {
                            then.call(value, then_transit.bind(this, id, DONE), then_transit.bind(this, id, FAIL));
                        } catch (error1) {
                            if (this.state === id)
	                            this.switchTo(FAIL, error1);
                        }
                        return;
                    }
                } catch (error2) {
                    value = error2;
                    state = FAIL;
                }
            }
            this.switchTo(state, value);
        },

        resolve: function (value) {
            this.transit(DONE, value);
        },

        reject: function (value) {
            this.transit(FAIL, value);
        },

        then: function (done, fail) {
        	var then = { 1: done, 2: fail, deferred: new Deferred(), next: null };
        	if (this.tail) {
		        this.tail.next = then;
		        this.tail = then;
	        } else {
		        this.head = this.tail = then;
	        }
        	if (this.state !== WAIT)
            	this.asap();
			return then.deferred.promise;
        }
    }

    var Promistix = {
    	name: "Promistix",

		pending: function() {
			return new Deferred();
		},
		schedule: setImmediate || (process && process.nextTick) || function() {
			throw new Error("Promistix.schedule must be set to process.nextTick in a nodejs environment, or similar function");
		}
	};

	return Promistix;
})();
