/** @funtion list.all
 *  wrapper function to list all the objects in stripe.
 *  @param {Object} stripe - Stripe object.
 *  @param {Object} options - Information required for fetching the data.
 *  @param {string} options.type - Required. Type of stripe object. Ex: subscriptionItems.
 *  @param {Object} options.args - Optional. Additonal args for the fetching.
 *  @param {function} options.callback - Required. Callback to be executed on every fetch.
 */
module.exports.all = async (stripe, options = {}) => {
  if (!options.type || !options.callback) {
    throw new Error('Please pass the necessary options for list.all');
  }
  let fetchResult = { has_more: true };
  // Loop till has_more is false
  while (fetchResult.has_more) {
    const stripeOptions = { 
      limit: 100, // Fetches the 100 data every turn
      ...(options.args || {}) //Custom arguments
    };
    //This is to fetch after the last fetched item
    if (fetchResult.data) {
      stripeOptions.starting_after = fetchResult.data[fetchResult.data.length - 1].id;
    }
    fetchResult = await stripe[options.type].list(stripeOptions);
    // Execute the callback after the data us fetched.
    options.callback(fetchResult);
  }
};
