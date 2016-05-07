require('dotenv').load({
	path: __dirname + '/.env'
});
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

function processCommand(args){


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
console.log("r-s[TABLENAME]-t[TABLENAME]");
console.log("l-s[TABLENAME]-t[TABLENAME]");
commandPrompt();

process.on('SIGINT', function() {
	process.stdin.destroy();
	console.log('shutting down');
	if (connection) {
		connection.close();
	}
	process.exit();
});

select row_to_json(foo)::text AS s from foo 
SELECT * FROM ( SELECT "TableA"::text AS a FROM "Test"."TableA" ) x
LEFT JOIN (SELECT "TableB"::text AS a FROM "Test"."TableB" ) z ON x.a = z.a
WHERE z.a is null