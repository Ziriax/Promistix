module.exports=function(){function d(){this.state=0;this.head=this.tail=null;this.value="";var b=this;this.promise={then:function(a,c){return b.then(a,c)}}}function f(b,a,c){this.state===b&&(this.state=0,this.transit(a,c))}var l=3;d.prototype={asap:function(){var b=this.state,a=this.value,c=this.head;this.head=this.tail=null;h.schedule(function(){for(var e=c;e;){var k=e[b],g=a,d=b;if("function"===typeof k)try{g=k(g),d=1}catch(f){g=f,d=2}e.deferred.transit(d,g);e=e.next}})},switchTo:function(b,a){this.value=
a;this.state=b;this.asap()},transit:function(b,a){if(0===this.state){if("function"===typeof a||"object"===typeof a&&null!==a)try{if(a===this.promise)throw new TypeError("A promise cannot return itself");var c=a.then;if(1===b&&"function"===typeof c){this.promise.then=c.bind(a);var e=this.state=l++;try{c.call(a,f.bind(this,e,1),f.bind(this,e,2))}catch(d){this.state===e&&this.switchTo(2,d)}return}}catch(d){a=d,b=2}this.switchTo(b,a)}},resolve:function(b){this.transit(1,b)},reject:function(b){this.transit(2,
b)},then:function(b,a){var c={1:b,2:a,deferred:new d,next:null};this.tail?this.tail=this.tail.next=c:this.head=this.tail=c;0!==this.state&&this.asap();return c.deferred.promise}};var h={name:"Promistix",pending:function(){return new d},schedule:setImmediate||process&&process.nextTick||function(){throw Error("Promistix.schedule must be set to setImmediate in a nodejs environment, or a similar function");}};return h}();