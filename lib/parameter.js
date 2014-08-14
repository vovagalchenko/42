var Parameter = function(typeName, required, extractor) {
  this.type = typeName;
  this.required = required;
  this.extract = extractor;

  this._apiAlias = null;
  this.apiAlias = function(newApiAlias) {
    this._apiAlias = newApiAlias;
    return this;
  };
  this.getApiAlias = function() { return this._apiAlias; };

  this._description = '';
  this.description = function(newDescription) {
    this._description = newDescription;
    return this;
  };
  this.getDescription = function() { return this._description; };
}

var exceptions = require('./exceptions.js');
exports.String = function(required) {
  return new Parameter('String', required, function(rawValue) {
    if (typeof rawValue === 'string') {
      return rawValue;
    } else {
      return undefined;
    }
  });
}

exports.Boolean = function(required) {
  return new Parameter('Boolean', required, function(rawValue) {
    if (rawValue === 0 ||
        rawValue === '0' ||
        rawValue === 'false' ||
        rawValue === false)
      return false;
    else if ( rawValue === 1 ||
              rawValue === '1' ||
              rawValue === 'true' ||
              rawValue === true)
      return true;
    else
      return undefined;
  });
}

exports.Array = function(elementTypeFactory, required) {
  var elementTypeDefinition = elementTypeFactory(true);
  return new Parameter('Array[' + elementTypeDefinition.type + ']', required, function(rawValue) {
    if (rawValue instanceof Array) {
      for (var value in rawValue) {
        if (typeof elementTypeDefinition.extract(value) === "undefined") {
          return undefined;
        }
      }
      return rawValue;
    } else {
      return undefined;
    }
  });
}
