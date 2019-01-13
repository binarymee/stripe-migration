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

      // If the coupon is not valid, it could be an expired one
      // When a coupon is deleted or expired, it won't affect the subscription with coupon applied
      // So we may need to recreate expired coupons and apply it while migration
      if (!coupon.valid) {
        if (couponArguments.redeem_by) {
          const date = new Date();
          const month = date.getMonth();
          //Get Unix TimeStamp of next month
          const ts = (date.setMonth(date.getMonth() + 1))/1000;
          couponArguments.redeem_by = ts;
        }
        if (couponArguments.max_redemptions) {
          // Doubling max redemptions to be on safer side
          couponArguments.max_redemptions = couponArguments.max_redemptions * 2;
        }
      }
      try {
        // Create coupon in destination stripe account
        await destinationStripe.coupons.create(couponArguments);
        console.log(`Coupon ${coupon.id} is created`);
      } catch (err) {
        console.log(`Coupon ${coupon.id} is not created. Coupon probably exists`);
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