var _ = require('lodash');
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
		base + ' where ';
	}
	var keyString = _.map(keys, function(key, index) {
		return key + ' = ' + '$' + (index + 1);
	});
	return base + keyString.join(' AND ') + ';';
}

function buildFilterClause(filters) {
	if (!filters || !filters.length) {
		return;
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

function buildRemoteComparison(target, targetFilters, source, sourceFilters) {
	var localQuery = 'SELECT row_to_json(' + target + ')::text AS a FROM ' + target + ' ' + buildFilterClause(targetFilters) || '';
	var remoteQuery = 'SELECT row_to_json(' + source + ')::text AS b FROM ' + source + ' ' + buildFilterClause(sourceFilters) || '';
	return localQuery + ' LEFT JOIN(SELECT r.* FROM dblink(' + process.env.PG_CONNECTION_SOURCE + ',' + remoteQuery + ') as r(b) AS z ON x.a = r.b WHERE z.b is null';
}

function compareRemote(compareRequest) {
	var compare = buildRemoteComparison(compareRequest.target.table, compareRequest.target.filters, compareRequest.source.table, compareRequest.source.filters);
	var getter = buildFind(compareRequest.sourceTable, compareRequest.primaryKeys);
	return db.query(compare, undefined, process.env.PG_CONNECTION_TARGET).then(function(results) {
		return Promise.map(results, function(result) {
			var pkValues = extractKeyValues(compareRequest.source.primaryKeys, result);
			return db.query(getter, pkValues, process.env.PG_CONNECTION_SOURCE).then(function(source) {
				var item = source.rows[0];
				var obj = {};
				_.forEach(compareRequest.source.primaryKeys, function(key) {
					obj[key] = result[key];
				});
				obj.deltas = findDeltas(mapped, result);
				return obj;
			});
		});
	}).then(function(results) {
		return results;
	});
}

function compare(compareRequest) {

}

module.exports = {
	compareRemote: compareRemote,
	compare: compare,
	findDeltas: findDeltas,
	buildFilterClause: buildFilterClause,
	buildFind: buildFind
}
