var _ = require('lodash');
var Promise = require('bluebird');
var db = require('./db');

function findDeltas(source, target) {
	var deltas = [];
	var aProps = Object.getOwnPropertyNames(source);
	var bProps = Object.getOwnPropertyNames(target);

	if (aProps.length != bProps.length) {
		deltas.push({
			'property': 'length',
			'source': aProps.length,
			'target': bProps.length
		});
	}

	for (var i = 0; i < aProps.length; i++) {
		var propName = aProps[i];
		//special treatment for arrays
		if (source[propName] instanceof Array && target[propName] instanceof Array) {
			if (!_.isEqual(source[propName].sort(), target[propName].sort())) {
				deltas.push({
					'property': propName,
					'source': source[propName],
					'target': target[propName]
				});
			}
		}
		// If values of same property are not equal, objects are not equivalent
		else if (source[propName] != target[propName]) {
			deltas.push({
				'property': propName,
				'source': source[propName],
				'target': target[propName]
			});
		}
	}
	return deltas;
}

function buildFind(tableName, keys) {
	var base = 'SELECT row_to_json(' + tableName + ')::text a FROM ' + tableName + ' ';
	if (keys && keys.length) {
		base += ' where ';
	}
	var keyString = _.map(keys, function(key, index) {
		return key + ' = ' + '$' + (index + 1);
	});
	return base + keyString.join(' AND ') + ';';
}

function buildFilterClause(filters) {
	if (!filters || !filters.length) {
		return '';
	}
	var filterClause = _.map(filters, function(filter) {
		return filter.key + ' = ' + filter.value;
	});
	return 'WHERE ' + filterClause.join(' AND ');
}

function extractKeyValues(keys, object) {
	return _.map(keys, function(key) {
		return object[key];
	});
}

function buildComparison(compareRequest) {
	var localQuery = 'SELECT row_to_json(' + compareRequest.target.table.trim() + ')::text AS a FROM ' + compareRequest.target.table.trim() + ' ' + buildFilterClause(compareRequest.target.filters) || '';
	var remoteQuery = 'SELECT row_to_json(' + compareRequest.source.table.trim() + ')::text AS b FROM ' + compareRequest.source.table.trim() + ' ' + buildFilterClause(compareRequest.source.filters) || '';
	return compareRequest.isRemote ? "SELECT * FROM ("+localQuery + ") x LEFT JOIN(SELECT r.* FROM dblink('" + process.env.PG_CONNECTION_SOURCE + "','" + remoteQuery + "') as r(b text)) AS z ON x.a = z.b WHERE z.b is null"
	: "SELECT * FROM ("+localQuery + ") x LEFT JOIN ("+remoteQuery + ") z ON x.a = z.b WHERE z.b is null";
}

function compare(compareRequest) {
	var compare = buildComparison(compareRequest);
	var getter = buildFind(compareRequest.source.table, compareRequest.source.primaryKeys);
	return db.query(compare, undefined, process.env.PG_CONNECTION_TARGET).then(function(results) {
		if(results.rowCount === 0){
			return Promise.resolve('Tables Match!');
		}
		return Promise.map(results.rows, function(row) {
			var comp = JSON.parse(row.a);
			var pkValues = extractKeyValues(compareRequest.source.primaryKeys, comp);
			return db.query(getter, pkValues, process.env.PG_CONNECTION_SOURCE).then(function(source) {
				var item = JSON.parse(source.rows[0].a);
				var obj = {};
				_.forEach(compareRequest.source.primaryKeys, function(key) {
					obj[key] = item[key];
				});
				obj.deltas = findDeltas(comp, item);
				return obj;
			});
		});
	}).then(function(results) {
		return results;
	});
}

module.exports = {
	compare: compare,
	findDeltas: findDeltas,
	buildFilterClause: buildFilterClause,
	buildFind: buildFind
}
