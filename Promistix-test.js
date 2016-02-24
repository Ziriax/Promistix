var promisesAplusTests = require("promises-aplus-tests");

var Promistix = require("./Promistix.js");

promisesAplusTests({
    deferred: Promistix.pending
}, {
    reporter: "spec"
});
