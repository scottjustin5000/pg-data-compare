function CompareMeta(table, primaryKeys, filters) {
	var self = this;
	self.table = table;
	self.primaryKeys = primaryKeys;
	self.filters = filters;
	return self;
}
module.exports = CompareMeta;