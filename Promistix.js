Promistix = (function () {
    function Deferred() {
	    this.promise = {
		    then: this.then.bind(this)
        };
        this.thens = [];
    }

    function call_thens(state, value, thens) {
        thens.forEach(function (then) {
            var cfn = then[state],
                next_value = value,
                next_state = state;
            if (typeof cfn === "function") {
                try {
                    next_value = cfn(value);
                    next_state = "done";
                } catch (error) {
                    next_value = error;
                    next_state = "fail";
                }
            }
            then.next.transit(next_state, next_value);
        });
    }

    function then_transit(id, state, value) {
        if (this.state === id) {
            delete this.state;
            this.transit(state, value);
        }
    }

	var next_then_id = 0;

    Deferred.prototype = {
        asap: function () {
            var fn = call_thens.bind(this, this.state, this.value, this.thens);
            this.thens = [];
            Promistix.schedule(fn);
        },
        switchTo: function(state, value) {
            this.value = value;
            this.state = state;
            this.asap();
        },
        transit: function (state, value) {
            if (typeof this.state === "undefined") {
                if (typeof value === "function" || (typeof value === "object" && value !== null)) {
                    try {
                        if (value === this.promise)
                            throw new TypeError("A promise cannot return itself");

                        var then = value.then;
                        if (state == "done" && typeof then === "function") {
                            this.promise.then = then.bind(value);
                            var id = this.state = ++next_then_id;
                            try {
                                then.call(value, then_transit.bind(this, id, "done"), then_transit.bind(this, id, "fail"));
                            } catch (error) {
                                if (this.state === id)
	                                this.switchTo("fail", error);
                            } finally {
                                return;
                            }
                        }
                    } catch (error) {
                        value = error;
                        state = "fail";
                    }
                }
                this.switchTo(state, value);
            }
        },
        resolve: function (value) {
            this.transit("done", value);
        },
        reject: function (value) {
            this.transit("fail", value);
        },
        then: function (done, fail) {
            var then = { done: done, fail: fail, next: new Deferred() };

            this.thens.push(then);

            if (this.state)
                this.asap();

            return then.next.promise;
        }
    }
    return {
		deferred: function() { 
			return new Deferred(); 
		},
		schedule: function() { 
			throw new Error("Promistix.schedule must be set to process.nextTick in a nodejs environment, or similar function"); 
		}
    };
})();
