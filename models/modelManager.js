exports.saveModel = function(model, values, modelType) {
  var saveModelPromise = null;
  if (model) {
    saveModelPromise = model.save(values, { method: 'update' });
  } else {
    saveModelPromise = new modelType().save(values, { method: 'insert' });
  }
  return saveModelPromise;
}
