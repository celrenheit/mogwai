var Q = require("q");

var RexsterClient = require("./rexster");

module.exports = TitanClient = (function(){
  /**
   * A Class describing the behavior of Mogwai when interacting with a Titan
   * server.
   *
   * @param {Mogwai} mogwai
   */
  function TitanClient(mogwai) {
    RexsterClient.apply(this, arguments); // Call parent constructor
    this.indexedKeys = [];
  }

  // Inherit from RexsterClient
  TitanClient.prototype = Object.create(RexsterClient.prototype);
  TitanClient.prototype.constructor = TitanClient;

  /**
   * Asynchronously build Titan types, used for indexing
   * Tested with Titan v0.4.0
   *
   * Loop through each schemas, find keys flagged for indexation, and build
   * types/indexes accordingly.
   *
   * This method does not recreate indexes on already created keys.
   *
   * Note: as per Titan's current limitations, "key index must be created prior
   * to key being used".
   *
   * @link https://github.com/thinkaurelius/titan/wiki/Type-Definition-Overview
   * @link https://github.com/thinkaurelius/titan/wiki/Titan-Limitations#temporary-limitations
   *
   * @param {Function} callback
   */
  TitanClient.prototype.createIndexes = function(callback) {
    var self = this;

    this.getExistingTypes()
    .then(function(result) {
      self.indexedKeys = result.results;
      return self.buildMakeKeyPromise(this.indexedKeys);
    })
    .then(function(success) {
      callback(null, success);
    })
    .fail(function(error) {
      console.error("[Mogwai][TitanClient] Error creating indexes");
      console.error(error);
      callback(error);
    });
  };

  /**
   * Retrieves an array of names of already indexed keys.
   *
   * @return {Promise}
   */
  TitanClient.prototype.getExistingTypes = function() {
    var gremlin = this.mogwai.connection.grex.gremlin(),
        g = gremlin.g;
    
    g.getIndexedKeys("Vertex.class");
    
    return gremlin.exec();
  };

  /**
   * Create data types which Titan uses for indexing.
   *
   * Note that the Mogwai special "$type" key is automatically indexed.
   *
   * This method does not return promise of creation for already created types.
   *
   * @return {Promise} to create all keys
   */
  TitanClient.prototype.buildMakeKeyPromise = function() {
    var promises = [],
        gremlin = this.mogwai.connection.grex.gremlin(),
        g = gremlin.g,
        indexableProperties = this.getIndexableProperties(),
        models = this.mogwai.models,
        schemaProperties,
        property, titanKey;

    // Make sure we index the Mogwai special $type key used for binding a model type to a vertex.
    if (this.isAlreadyIndexed("$type") === false) {

      g.makeKey("$type").dataType("String.class").indexed("Vertex.class");
    
      promises.push(g.gremlin.exec());
    }

    // New gremlin and graph
    

    // Also index keys defined for each model, but skip already indexed keys
    for (var i = 0; i < indexableProperties.length; i++) {
        property = indexableProperties[i];
        // Only index keys that were not indexed before, skip otherwise
        if (this.isAlreadyIndexed(property.name) === false) {
          gremlin = this.mogwai.connection.grex.gremlin();
          g = gremlin.g;
          titanKey = g.makeKey(property.name).dataType(property.getDataType()).indexed("Vertex.class");


          if (property.isUnique()) {
            titanKey.unique();
          }

          promises.push(g.gremlin.exec());
        }
      }
    

    return Q.all(promises);
  };

  /**
   * For all registered Mogwai models with given properties, return an array of
   * of properties (keys) which can be indexed.
   *
   * @return {Array} of properties
   */
  TitanClient.prototype.getIndexableProperties = function() {
    var models = this.mogwai.models,
        schemaProperties,
        property,
        indexableProperties = [];

    for (var modelName in models) {
      schemaProperties = models[modelName].schema.properties;

      for (var propertyName in schemaProperties) {
        property = schemaProperties[propertyName];

        if (property.isIndexable()) {
          indexableProperties.push(property);
        }
      }
    }

    return indexableProperties;
  };

  /**
   * Tell whether a key has already been indexed in the Database or not.
   *
   * @param {String} keyname
   * @return {Boolean}
   */
  TitanClient.prototype.isAlreadyIndexed = function(keyName) {
    if (this.indexedKeys.indexOf(keyName) === -1) {
      return false;
    }
    return true;
  };


  return TitanClient;

})();
