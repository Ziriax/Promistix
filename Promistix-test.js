require("./Promistix.js");

var promisesAplusTests = require("promises-aplus-tests");

Promistix.schedule = process.nextTick;

promisesAplusTests({
    deferred: Promistix.deferred
}, {
    reporter: "spec"
});
