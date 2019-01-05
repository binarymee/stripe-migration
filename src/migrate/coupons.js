const config = require('./../config');
const createObject = require('./../util/createObject');
const sourceStripe = require('stripe')(config.sourceStripeAPIKey);
const destinationStripe = require('stripe')(config.destinationStripeAPIKey);
const list = require('./../helpers/list');

/** @funtion migrateCoupons
 *  Migrate coupons from the source stripe account to the destination.
 */
const migrateCoupons = async () => {
  // Only if the coupons are available in source Stripe
  if (coupons.data && coupons.data.length > 0) {
    // Loop all the coupons
    for (const coupon of coupons.data) {
      // Creating only when the source coupon is valid
      if (coupon.valid) { 
        const couponArguments = createObject(coupon, [
          'id', // https://stripe.com/docs/api/coupons/create#create_coupon-id 
          'duration', // https://stripe.com/docs/api/coupons/create#create_coupon-duration 
          'amount_off', // https://stripe.com/docs/api/coupons/create#create_coupon-amount_off 
          'currency', // https://stripe.com/docs/api/coupons/create#create_coupon-currency 
          'duration_in_months', // https://stripe.com/docs/api/coupons/create#create_coupon-duration_in_months
          'max_redemptions', // https://stripe.com/docs/api/coupons/create#create_coupon-max_redemptions 
          'metadata', // https://stripe.com/docs/api/coupons/create#create_coupon-metadata 
          'name', // https://stripe.com/docs/api/coupons/create#create_coupon-name 
          'percent_off', // https://stripe.com/docs/api/coupons/create#create_coupon-percent_off 
          'redeem_by', // https://stripe.com/docs/api/coupons/create#create_coupon-redeem_by
        ]);
        // Create coupon in destination stripe account
        await destinationStripe.coupons.create(couponArguments);
        console.log(`Coupon ${coupon.id} is created`);
      }
    }
  }
};

module.exports = async () => {
  try {
    // Fetches all the coupons from source stripe
    await list.all(sourceStripe, {
      type: 'coupons',
      callback: (sourcePlans) => migrateCoupons(sourcePlans),
    });
    
  } catch (err) {
    console.log('Error while migrating coupons', err);
  }
};