require('dotenv').load({
	path: __dirname + '/.env'
});
var _ = require('lodash');

var dataComparer = require('./data-comparer');
var Models = require('./models');

function prompt(question) {
	return new Promise(function(fulfill, reject) {
		var stdin = process.stdin;
		var stdout = process.stdout;
		stdin.resume();
		stdout.write(question + ": ");
		stdin.once('data', function(data) {
			data = data.toString().trim();
			stdin.pause();
			fulfill(data);
		});
	});
}

function extractFilters(filterString) {
	if(!filterString){
		return;
	}
	return _.map(filterString.split(','),function(f){
		var kvp = f.split(':');
		return new Models.Filter(kvp[0],kvp[1]);
	});
}

function compare(args) {
	var filters = extractFilters(args.f);
	var primaryKeys = args.p.split(',');
	var target = new Models.CompareMeta(args.t, primaryKeys, filters);
	var source = new Models.CompareMeta(args.t, primaryKeys, filters);
	var request = new Models.CompareRequest(target,source);
	return dataComparer.compareRemote(request).then(function(response){
		console.log(response);
	});
}

function processCommand(args){
	var values = args.split('-');
	return new Promise(function(fulfill, reject){
		if(values[0] === "?"){
		//show help
		}
		else{
			var cmds = {};
			values.forEach(function(arg){
				cmds[arg[0]] = arg.substring(1);
			});
			return compare(cmds).then(function(f){
				fulfill(f);
			});
		}
	});
}

function commandPrompt(){
	return prompt("Press a Command to Begin...", /.+/).then(function(args) {
		return processCommand(args);
	}).then(function(){
		process.stdin.resume();
		console.log('complete');
		commandPrompt();
	});
};
console.log("####################################################################################################")
console.log("In order for this utility to run please ensure your .env is set up");
console.log("If you are comparing remote databases, you'll need to set both PG_CONNECTION_SOURCE and PG_CONNECTION_TARGET");
console.log("####################################################################################################")
console.log("Commands");
console.log("r-s[TABLENAME]-t[TABLENAME]-f[FILTERS]-p[PRIMARYKEY]");
console.log("l-s[TABLENAME]-t[TABLENAME]-f[FILTERS]-p[PRIMARYKEY]");
console.log("? for help");
commandPrompt();

process.on('SIGINT', function() {
	process.stdin.destroy();
	console.log('shutting down');
	process.exit();
});

// select row_to_json(foo)::text AS s from foo 
// SELECT * FROM ( SELECT "TableA"::text AS a FROM "Test"."TableA" ) x
// LEFT JOIN (SELECT "TableB"::text AS a FROM "Test"."TableB" ) z ON x.a = z.a
// WHERE z.a is null