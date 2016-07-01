function CompareRequest(targetMeta, sourceMeta) {
	var self = this;
	self.target = targetMeta;
	self.source = sourceMeta;
	self.isRemote = false;
	return self;
}
module.exports = CompareRequest;