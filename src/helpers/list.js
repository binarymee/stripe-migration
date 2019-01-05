/** @funtion list.all
 *  wrapper function to list all the objects in stripe.
 *  @param {Object} stripe - Stripe object.
 *  @param {Object} options - Information required for fetching the data.
 *  @param {string} options.type - Required. Type of stripe object. Ex: subscriptionItems.
 *  @param {Object} options.args - Optional. Additonal args for the fetching.
 *  @param {function} options.callback - Required. Callback to be executed on every fetch.
 */
module.exports.all = async (stripe, options = {}) => {
  if (options.type || options.callback) {
    throw new Error('Please pass the necessary options for list.all');
  }
  let data = { has_more: true };
  // Loop till has_more is false
  while (data.has_more) {
    // Fetches the 100 data every turn
    data = await stripe[options.type].list({ limit: 100, ...(options.args || {}) });
    // Execute the callback after the data us fetched.
    options.callback(data);
  }
};
