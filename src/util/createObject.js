/** @funtion createObject
 *  Utility function to create a sub object from a parent. Accepts list of keys that has to be created in the object.
 *  @param {Object} parent - Parent object.
 *  @param {string[]} attributes[] - Contains list of keys to be extracted from the parent key.
 *  @returns {Object} Returns sub object from parent object.
 */
module.exports = (parent, attributes) => {
  return attributes.reduce((obj, key) => {
    let childObj = obj; 
    if (parent[key] !== undefined && parent[key] !== null) {
      childObj = Object.assign(obj, { [key]: parent[key] })
    }
    return childObj;
  }, {});
};