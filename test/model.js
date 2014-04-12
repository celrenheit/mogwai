var should = require('should');
var mogwai = require('../');


var UserSchema = new mogwai.Schema({
  name: String
});

User = mogwai.model('User', UserSchema);

var user;

describe('Model', function() {
  it('should instantiate a new model', function() {
    user = new User();
    user.should.be.an.instanceOf(model);
  });

  it('should have properties', function() {
    user.foo = 'bar';
    user.should.have.property('foo', 'bar');
  });

  describe('save()', function() {
    it('should insert a new model to the graph database', function(done) {
      user.save(function(err, user, response) {
        should.not.exist(err);
        should.exist(response);
        done();
      });
    });
  });

  describe('findById()', function() {
    it('should find a user by id', function(done) {
      user.scripts.findById(user._id).query(function(err, response) {
        should.not.exist(err);
        should.exist(response);
        done();
      });
    });
  });

  describe('fetch()', function() {
    it('should post process results', function(done) {
      var gremlin = user.g.gremlin();

      gremlin.g.V().fetch(function(err, users) {
        should.not.exist(err);
        should.exist(users);
        users[0].should.be.instanceOf(model);

        done();
      });
    });
  });

});

var secondUser;

describe('Relationships', function() {
  before(function(done) {
    secondUser = new User();
    secondUser.name = 'Alice';
    secondUser.save(function(err, user, results) {
      done();
    });
  });
  describe('addEdge()', function() {
    it('should save a new edge between the two models', function(done) {
      user.addOutgoingEdge(secondUser, 'follows', { foo : 'bar' }, function(err, results) {console.log(err, results);
        var edge = results[0];

        results.length.should.equal(1);
        edge.should.have.property('_type', 'edge');

        edge.should.have.property('_outV', user._id);
        edge.should.have.property('_inV', secondUser._id);
        edge.should.have.property('_label', 'follows');
        edge.should.have.property('foo', 'bar');
      });
    });
  });

});
