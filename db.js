var pg = require('pg');
pg.defaults.parseInt8 = true;

var query = function(sql, values, connection) {
	return new Promise(function(fulfill, reject) {
		pg.connect(connection, function(error, db, done) {
			if (error) {
				console.error('error fetching client from pool', error);
				reject(error);
				return;
			}
			db.query(sql, values, function(err, result) {
				done();
				if (err) {
					console.error('error running query', err);
					reject(err);
					return;
				}
				fulfill(result);
			});
		});
	});
};

module.exports = {
	query: query
};