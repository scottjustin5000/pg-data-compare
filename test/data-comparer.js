var _ = require('lodash');
var dataComparer = require('../data-comparer');

describe('test data comparison utility', function() {

	describe('should build find query', function() {
		it('should map query with 3 parameters', function(done){
			var query = dataComparer.buildFind('test', ['one', 'two', 'three']);
			query.should.equal('SELECT row_to_json(test)::text a FROM test one = $1 AND two = $2 AND three = $3;');
			done();
		});
		it('should map query with no parameters', function(done){
			var query = dataComparer.buildFind('test', []);
			query.should.equal('SELECT row_to_json(test)::text a FROM test ;');
			done();
		});
	});

	describe('test buildFilterClause', function() {
		it('should build filter clause with two filters', function(done) {
			var filterClause = dataComparer.buildFilterClause([{'key':'one', 'value':1},{'key':'two', 'value':2}]);
			filterClause.should.equal("WHERE one = 1 AND two = 2");
			done();
		});

		it('should not build filter clause', function(done) {
			var filterClause = dataComparer.buildFilterClause([]); 
			(filterClause === '').should.be.true();
			done();
		});
	});

	describe('object comparison test', function() {
		it('should find objects equal', function(done) {
			var obj1 = {'one':1,'two':2,'three':3, 'four':[1,2,3]};
			var obj2 = {'one':1,'two':2,'three':3, 'four':[1,2,3]};
			var deltas = dataComparer.findDeltas(obj1, obj2);
			deltas.should.be.an.instanceOf(Array);
			deltas.should.have.property('length', 0);
			done();
		});

		it('should find objects not equal (length)', function(done) {
			var obj1 = {'one':1,'two':2,'three':3, 'four':[1,2,3]};
			var obj2 = {'one':1,'three':3, 'four':[1,2,3]};
			var deltas = dataComparer.findDeltas(obj1, obj2);
			deltas.should.be.an.instanceOf(Array);
			deltas.should.have.property('length', 2);
			done();
		});

		it('should find objects not equal', function(done) {
			var obj1 = {'one':1,'two':2,'three':3, 'four': [4,5,6]};
			var obj2 = {'one':1,'three':3, 'four':[1,2,3]};
			var deltas = dataComparer.findDeltas(obj1, obj2);
			deltas.should.be.an.instanceOf(Array);
			deltas.should.have.property('length', 3);
			done();
		});

	});

	describe('test buildRemoteComparison', function() {
		it('should ', function(done) {
			done();
		});

		it('should ', function(done) {
			done();
		});
	});

	describe('integration test -remoteCompare', function() {
		it('should ', function(done) {
			done();
		});

		it('should ', function(done) {
			done();
		});
	});
});