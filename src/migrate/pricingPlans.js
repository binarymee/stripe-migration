const config = require('./../config');
const createObject = require('./../util/createObject');
const list = require('./../helpers/list');
const sourceStripe = require('stripe')(config.sourceStripeAPIKey);
const destinationStripe = require('stripe')(config.destinationStripeAPIKey);

/** @funtion migratePricingPlans
 *  Migrate product and plans from the source stripe account to the destination.
 */
const migratePricingPlans = async (sourcePlans) => {
  // Only if the plans are available in source Stripe
  if (sourcePlans.data && sourcePlans.data.length > 0) {
    // Loop all the pricing plans
    for (const plan of sourcePlans.data) {
      // Fetch the product of the plan
      const product = await sourceStripe.products.retrieve(plan.product);
      // Construct a plan object with product
      // Stripe supports setting custom id to both plan and product.
      // So it is easy to create all pricing plans with the same id.
      // It is essential to have same id, since most implementation creates subscription with plan by id.
      const planArguments = createObject(plan, [
        'id', // https://stripe.com/docs/api/plans/create#create_plan-id
        'currency', // https://stripe.com/docs/api/plans/create#create_plan-currency
        'interval', // https://stripe.com/docs/api/plans/create#create_plan-interval  
        'active', // https://stripe.com/docs/api/plans/create#create_plan-active  
        'amount', // https://stripe.com/docs/api/plans/create#create_plan-amount  
        'aggregate_usage', // https://stripe.com/docs/api/plans/create#create_plan-aggregate_usage 
        'billing_scheme', // https://stripe.com/docs/api/plans/create#create_plan-billing_scheme  
        'interval_count', // https://stripe.com/docs/api/plans/create#create_plan-interval_count  
        'metadata', // https://stripe.com/docs/api/plans/create#create_plan-metadata  
        'nickname', // https://stripe.com/docs/api/plans/create#create_plan-nickname  
        'usage_type', // https://stripe.com/docs/api/plans/create#create_plan-usage_type 
      ]);
      planArguments.product = createObject(product, [
        'id',  // https://stripe.com/docs/api/plans/create#create_plan-product-id
        'name', // https://stripe.com/docs/api/plans/create#create_plan-product-name 
        'type', // https://stripe.com/docs/api/plans/create#create_plan-product-type 
        'active', // https://stripe.com/docs/api/plans/create#create_plan-product-active 
        'attributes', // https://stripe.com/docs/api/plans/create#create_plan-product-attributes
        'metadata', // https://stripe.com/docs/api/plans/create#create_plan-product-metadata 
        'statement_descriptor', // https://stripe.com/docs/api/plans/create#create_plan-product-statement_descriptor
      ]);
      // Create plan and product
      await destinationStripe.plans.create(planArguments);
      console.log(`Created Product ${product.name}`);
    }
  }
}

module.exports = async () => {
  try {
    // Fetches all the plans from source stripe
    await list.all(sourceStripe, {
      type: 'plans',
      callback: (sourcePlans) => migratePricingPlans(sourcePlans),
    });
  } catch (err) {
    console.log('Error while migrating pricing plans', err);
  }
};
