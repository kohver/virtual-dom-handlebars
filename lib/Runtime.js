// Handlebars polyfill

var extend = require('./extend');

module.exports = Runtime;

// I hope this is passed by ref
function Runtime() {}

// Called from compiled js
Runtime.callHelper = function(name, object, args, yield, parentContext) {
	object = object || {};
	args = args || {};
	args.fn = yield;
	if (typeof Runtime.fn[name] !== 'function') {
		throw 'Undefined helper function: ' + name;
	}
	return Runtime.fn[name].call(object, object, args, yield, parentContext);
};

// Called from compiled js
Runtime.helperExists = function(name) {
	return (typeof Runtime.fn[name] !== 'undefined');
};

// Useful in helper code
Runtime.isFalsy = function(x) {
	if ((typeof x === undefined) || !x) return true;
	if (x.constructor === Array) return (x.length == 0);
	if ((x == "") || (x == null) || (x == 0) || isNaN(x)) return true;
	return false;
};

// Public register method
Runtime.registerHelper = function(name, fn) {
	Runtime.fn[name] = fn;
};
Runtime.registerPartial = function(name, fn) {
	Runtime.templates[name] = fn;
};
Runtime.registerPartials = function(partials) {
	extend(Runtime.templates, partials);
};

// Templates
Runtime.templates = {};

// Helpers
Runtime.fn = {

	// Simple helpers just return strings
	// because they cannot contain HTML tags
	// TODO: make this function sanitize output
	// and another matching "unsafe" output helper
	'=': function(object){ 
		return "" + object;
	},

	// Block helpers always return an array of VNodes
	'each': function(object, options) {
		var i, r = [];
		for (i in object) {
			if (object.hasOwnProperty(i)) {
				r = r.concat(options.fn(object[i]));
			}
		}
		return r;
	},

	'if': function(object, options) {
		return !Runtime.isFalsy(object) ? options.fn(object) : [];
	},

	'unless': function(object, options) {
		return Runtime.isFalsy(object) ? options.fn(object) : [];
	},

	'with': function(object, options) {
		return options.fn(object);
	},

	'_moustacheSection': function(object, options, yield, parentContext) {
		var helper = 'with';
		if (object && (object.constructor === Array)) {
			helper = 'each';
		}
		return Runtime.callHelper(helper, object, options, yield, parentContext);
	},

	'>': function(partialName, context, options, yield, parentContext) {
		return Runtime.templates[partialName](extend(context || {}, options));
	}
};
