var path = require("path"),
    fs = require("fs");
var EventEmitter = require("events").EventEmitter;

var inherits = require("inherits");
var _ = require("underscore");

var GraphClientFactory = require("./graphclientfactory");
var GraphConnectionFactory = require("./graphconnectionfactory");

var Schema = require("./schema");
var Model = require("./model");
var ModelCompiler = require("./modelcompiler");

var Utils = require("./utils");
var ElementInitializer = require("./elementinitializer");

module.exports = (function() {
  'use strict';
  /**
   * The main Mogwai class, (currently) instantiated as a Singleton.
   */
  function Mogwai() {
    console.log("Loading Mogwai, object-to-graph mapper");
    this.schemas = {};
    this.models = {};
    this.modelCompiler = new ModelCompiler(this);
    this.elementInitializer = new ElementInitializer(this);
    this.graphClientFactory = new GraphClientFactory(this);
    this.graphConnectionFactory = new GraphConnectionFactory(this);

    this.client = null;
    this.settings = null;
    this.connection = null;
  }

  inherits(Mogwai, EventEmitter);

  // Inherit from EventEmitter
  Mogwai.prototype = Object.create(EventEmitter.prototype);
  Mogwai.prototype.constructor = Mogwai;

  Mogwai.prototype.Schema = Schema;

  /**
   * Instantiate the appropriate graph database client, and ask the Connection
   * class to open a connection to that database.
   *
   * @param {Object} settings - host, port, db name, etc.
   * @param {Function} callback
   */
  Mogwai.prototype.connect = function(settings, callback) {
    this.settings = settings;

    this.connection = this.graphConnectionFactory.createConnection(settings);

    this.connection.open(settings, function(err, g) {
      this.buildClient();

      this.client.createIndexes(function(err, indexes) {
        this.emit("ready", g);

        callback(null, g);
      }.bind(this));
    }.bind(this));
  };

  /**
   * Define Mogwai's client with the client type defined in the settings.
   */
  Mogwai.prototype.buildClient = function() {
    var clientName = this.settings.client.toLowerCase();

    this.client = this.graphClientFactory.createClient(this.settings.bridge, clientName);
  };

  /**
   * Close the connection with the database
   */
  Mogwai.prototype.disconnect = function() {
    this.connection.close();
  };

  /**
   * Check whether a Schema by this name exists or not
   *
   * @return {Boolean}
   */
  Mogwai.prototype.hasSchema = function(schemaName) {
    return _.has(this.schemas, schemaName);
  };

  /**
   * Register a Schema instance to this Mogwai instance
   *
   * @param {String} schemaName
   * @param {Schema} schema - Schema instance
   */
  Mogwai.prototype.registerSchema = function(schemaName, schema) {
    this.schemas[schemaName] = schema;
  };

  /**
   * Retrieve a registered Schema instance by name
   *
   * @param {String} schemaName
   * @param {Schema} - Schema instance
   */
  Mogwai.prototype.getSchema = function(schemaName) {
    return this.schemas[schemaName];
  };

  /**
   * Register a Model class (constructor) to this Mogwai instance
   *
   * @param {String} modelName
   * @param {Function} model - Model class constructor
   */
  Mogwai.prototype.addModel = function(modelName, model) {
    this.models[modelName] = model;
  };

  /**
   * Retrieve a registered Model constructor by name
   *
   * @param {String} modelName
   * @param {Function} - Model class constructor
   */
  Mogwai.prototype.getModel = function(modelName) {
    return this.models[modelName];
  };

  /**
   * Check whether a Model class constructor by this name exists or not
   *
   * @param {String} modelName
   * @return {Boolean}
   */
  Mogwai.prototype.hasModel = function(modelName) {
    return this.models.hasOwnProperty(modelName);
  };

  /**
   * Check for the existence of a .groovy file associated to a Schema, and
   * return its content if present.
   *
   * @param {String} pathToCaller - Path to the file of the calling function
   * @param {String} modelName
   * @param {String} groovyFile - Groovy file content
   */
  Mogwai.prototype.readGroovyFile = function(pathToCaller, modelName) {
    // Read groovy file content if present
    var fileName = path.basename(pathToCaller, path.extname(pathToCaller));
    var groovyFilePath = path.dirname(pathToCaller)+"/"+fileName+".groovy";
    var groovyFile;

    if (fs.existsSync(groovyFilePath)) {
      console.log("Found Gremlin .groovy file for "+ modelName +" Schema");
      groovyFile = fs.readFileSync(groovyFilePath, "utf8");

      return groovyFile;
    }
  };

  /**
   * Define a model, or retrieve it by name.
   * This method *must* be called for each defined Schema, and the resulting
   * model class should be set to module.exports in that Schema file.
   *
   * @param {String} modelName
   * @param {Schema} schema
   * @return {Function} - Model class constructor
   */
  Mogwai.prototype.model = function(modelName, schema) {
    modelName = modelName.toLowerCase();

    if (this.hasSchema(modelName)) {
      return this.getModel(modelName);
    }

    // Add schema to Mogwai and compile Model
    this.registerSchema(modelName, schema);

    var groovyFile = this.readGroovyFile(Utils.getCaller().id, modelName);
    var model = this.modelCompiler.compile(modelName, schema, groovyFile);
    this.addModel(modelName, model);

    return this.getModel(modelName);
  };

  /**
   * For all registered Mogwai models, return an array of properties (keys)
   * which are flagged for indexing.
   *
   * @return {Array<Properties>} of properties
   */
  Mogwai.prototype.getPropertiesToIndex = function() {
    var indexableProperties = [];
    var propertyNames = [];

    _.each(this.models, function(model, modelName, models) {
      var schemaProperties = models[modelName].schema.properties;

      _.each(schemaProperties, function(property) {
        if (property.isIndexable()) {
          indexableProperties.push(property);
          propertyNames.push(property.name);
        }
      });
    });

    console.log('Properties flagged for indexing: ' + propertyNames + ' (count: ' + propertyNames.length + ')');

    return indexableProperties;
  };

  return Mogwai;

})();
