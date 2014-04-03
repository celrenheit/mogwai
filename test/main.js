var mogwai = require("../"),
    should = require("should");


describe("Connection", function() {
  it("should connect to a graph database", function(done) {
    var settings = {
      host: "localhost",
      port: 8182,
      graph: "graph",
      client: "titan"
    };

    mogwai.connect(settings, function(err, graphDB) {
      should.not.exist(err);
      should.exist(graphDB);
      done();
    });
  });
});

var model = null;

describe("Schemas", function() {
  var schemaName = "User";

  before(function(done) {
    var Schema = new mogwai.Schema({
      name: {
        type: String
      },
      first_name: {
        type: String
      }
    });
    model = mogwai.model(schemaName, Schema);
    done();
  });

  it("should compile a model", function(done) {
    should.exist(mogwai.models[schemaName.toLowerCase()]);
    done();
  });

});


describe("Model", function() {
  it("should have default methods findByKeyValue and findById", function(done) {
    should.exist(model.findByKeyValue);
    should.exist(model.findById);
    model.findByKeyValue.should.be.a("function");
    model.findById.should.be.a("function");
    done();
  });

  it("should create a new instance", function(done) {
    var name = "Batman";
    var instance = new model({
      name: name
    });
    instance.should.have.property("name");
    instance.name.should.equal(name);
    done()
  });
  it("should save the new model", function(done) {

    var name = "Batman";
    var instance = new model({
      name: name
    });
    instance.save(function(err, results) {console.log("results", results);
      should.exist(results);
      results.success.should.be.true;
      done();
    });
  });
  it("should get data by name", function(done) {
    model.findByName("Bob", function(err, results) {
      should.exist(results);
      done();
    });
  });
});


describe("Connection", function() {
  it("should delete all data in graph database", function(done) {
    var grex = mogwai.connection.grex.gremlin().g;
    grex.clear();
    done();
  });
  it("should disconnect", function(done) {
    var grex = mogwai.connection.grex.gremlin().g;
    grex.shutdown();
    done();
  });
});