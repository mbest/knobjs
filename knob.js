(function (factory) {
    if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like enviroments that support module.exports,
        // like Node.
        module.exports = factory(require('knockout'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['knockout'], factory);
    } else {
        // Browser globals
        knob = factory(ko);
    }
}(function(ko, undefined) {
    var objCreate = Object.create || function(o) {
        function F(){};
        F.prototype = o;
        return new F();
    };

    // Map of all defined classes
    var map = {};

    // Make sure there's nothing defined in map
    for (var prop in map) {
        map[prop] = undefined;
    }

    var knob = function(classPath, superPathOrClass, protoObject) {
        if (typeof classPath !== 'string') {
            throw Error('invalid class-path: ' + classPath);
        }

        var func = map[classPath], arglen = arguments.length;

        // Retrieve
        if (arglen === 1) {
            if (func) {
                return func;
            } else {
                throw Error('non-existent class: ' + classPath);
            }
        }

        if (arglen === 2) {
            // No super-class (second argument is proto-object)
            protoObject = superPathOrClass;

            // Null proto given: delete class from map and return
            if (protoObject === null) {
                map[classPath] = undefined;
                return func;
            }
        } else {
            // Look up super-class path if a string is given
            var superClass = typeof superPathOrClass === 'string' ? map[superPathOrClass] : superPathOrClass;

            if (typeof superClass !== 'function') {
                throw Error('invalid super-class: ' + superPathOrClass);
            }
        }

        // Proto-object must be an object
        if (!protoObject || typeof protoObject !== 'object') {
            throw Error('invalid proto-object given for: ' + classPath);
        }

        // Create the constructor function dynamically so it has the appropriate name.
        func = map[classPath] = (new Function("c", "return function " + classPath.replace(/[^\w$]/g, '_') + "(){ c.apply(this, arguments); };")) (
            function () {
                // Instatiate any properties that need it
                for (var prop in prototype) {
                    if (prototype[prop] && prototype[prop].instantiate) {
                        this[prop] = prototype[prop].instantiate(this);
                    }
                }
                if (prototype.initialize) {
                    // Call the initialize method from the prototype
                    prototype.initialize.apply(this, arguments);
                }
            }
        );

        // Save the class-path for reference
        func.$classpath = classPath;

        var prototype = func.prototype;

        // Extend from the super-class
        if (superClass) {
            prototype = func.prototype = objCreate(superClass.prototype);
            prototype.constructor = func;

            // Save shortcuts to super-class constructor and prototype
            func.$superclass = superClass;
            func.$super = superClass.prototype;
        }

        // Copy the methods from the proto-object to the prototype
        ko.utils.extend(prototype, protoObject);

        return func;
    }

    function knobExtend(extenders) {
        var origInstantiate = this.instantiate;
        this.instantiate = function(binding) {
            return origInstantiate.call(this, binding).extend(extenders);
        }
        return this;
    };

    knob.computed = function(readFunction, writeFunction) {
        readFunction.instantiate = function(binding) {
            return ko.computed(readFunction, binding, {deferEvaluation:true, write:writeFunction});
        };
        readFunction.extend = knobExtend;
        return readFunction;
    };

    knob.observable = function(initialValue) {
        return {
            instantiate: function() {
                return ko.observable(initialValue);
            },
            extend: knobExtend,
            v: initialValue
        };
    };

    knob.observableArray = function() {
        return {
            instantiate: function() {
                return ko.observableArray();
            },
            extend: knobExtend
        };
    };

    knob.bound = function(func) {
        func.instantiate = function(binding) {
            return func.bind(binding);
        };
        return func;
    };

    return knob;
}));
