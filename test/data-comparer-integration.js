var _ = require('lodash');
var dataComparer = require('../data-comparer');
var db = require('../db');
var Models = require('../models');

if (!process.env.NODE_ENV) {
	require('dotenv').load({
		path: __dirname + '/../.env'
	});
}

describe('test local data comparison', function() {
	before(function(done) {
		var createCommand = 'CREATE TABLE ab (id int not null, i int, CONSTRAINT "pk_a" PRIMARY KEY("id"));INSERT INTO ab VALUES (1,1), (2,3); CREATE TABLE ba (id int not null, i int, CONSTRAINT "pk_b" PRIMARY KEY("id")); INSERT INTO ba VALUES (1,1), (2,2)';
		return db.query(createCommand,undefined, process.env.PG_CONNECTION_TARGET).then(function(){
			done();
		});
	});
	after(function(done) {
		var deleteCommand = 'DROP TABLE ab; DROP TABLE ba;'
		return db.query(deleteCommand, undefined, process.env.PG_CONNECTION_TARGET).then(function(){
			done();
		});
	});
	describe('test simple local comparison', function() {
		it('foo', function(done){
			var target = new Models.CompareMeta('ab', ['id']);
			var source = new Models.CompareMeta('ba', ['id']);
			var request = new Models.CompareRequest(target, source);
			return dataComparer.compare(request).then(function(response){
				response.should.be.instanceOf(Array).and.have.length(1);
				response[0].should.be.instanceOf(Object).and.have.property('deltas');
				var deltas = response[0].deltas;
				deltas.should.be.instanceOf(Array).and.have.length(1);
				var obj = deltas[0];
				obj.should.have.property('source', 3);
				obj.should.have.property('target', 2);
				done();
			});
		})
	});
});