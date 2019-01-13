const config = require('./../config');
const createObject = require('./../util/createObject');
const list = require('./../helpers/list');
const sourceStripe = require('stripe')(config.sourceStripeAPIKey);
const destinationStripe = require('stripe')(config.destinationStripeAPIKey);

/** @funtion suspendSourceSubscription
 *  Suspend source Subscription to avoid future billing in source Stripe
 */
const suspendSourceSubscription = async (subscriptionIds) => {
  const promises = []
  for (const subscriptionId of subscriptionIds) {
    promises.push(sourceStripe.subscriptions.del(subscriptionId))
  }
  await Promise.all(promises);
  console.log('Suspended ', subscriptionIds);
}

/** @funtion migrateSubscriptions
 *  Migrate Subscriptions from the source stripe account to the destination.
 *  Suspend the subscription from source account to avoid billig twice.
 */
const migrateSubscriptions = async (customers) => {
  const newSubscriptionIds = [];
  const oldSubcriptionIds = [];
  // Only if the customers are available in source Stripe
  if (customers.data && customers.data.length > 0) {
    // Loop all the customer
    for (const customer of customers.data) {
      // Retrieve the upcoming invoice to set the next billing date of subscription in destination Stripe 
      const invoice = sourceStripe.invoices.retrieveUpcoming(customer.id);
      let subscriptionArgs = {
        customer: customer.id,
        trial_end: invoice.date, //This will make sure that destination Stripe bills the subscription on the next invoice date
        // billing_cycle_anchor can also be used instead of trial_end
      };
      for (const subscription of customer.subscriptions.data) {
        if (subscription.items && subscription.items.data) { // Only when subscription items are available
          // Add Coupon to the subscription if needed
          if (subscription.discount && subscription.discount.coupon) {
            subscriptionArgs.coupon = subscription.discount.coupon.id;
          }
          subscriptionArgs.items = [];
          // Adding Subscription Items
          for (const subscriptionItem of subscription.items.data) {
            subscriptionArgs.items.push({
              plan: subscriptionItem.plan.id, // https://stripe.com/docs/api/subscription_items/object#subscription_item_object-plan
              metadata: subscriptionItem.metadata, // https://stripe.com/docs/api/subscription_items/object#subscription_item_object-metadata
              quantity: subscriptionItem.quantity, // https://stripe.com/docs/api/subscription_items/object#subscription_item_object-quantity
            });
          }
          subscriptionArgs = {
            ...subscriptionArgs,
            ...createObject(customer.subscriptions.data, [
              'application_fee_percent', // https://stripe.com/docs/api/subscriptions/object#subscription_object-application_fee_percent
              'billing', // https://stripe.com/docs/api/subscriptions/object#subscription_object-billing
              'billing_cycle_anchor', // https://stripe.com/docs/api/subscriptions/object#subscription_object-billing_cycle_anchor
              'cancel_at_period_end', // https://stripe.com/docs/api/subscriptions/object#subscription_object-cancel_at_period_end
              'days_until_due', // https://stripe.com/docs/api/subscriptions/object#subscription_object-days_until_due
              'metadata', // https://stripe.com/docs/api/subscriptions/object#subscription_object-metadata
              'tax_percent', // https://stripe.com/docs/api/subscriptions/object#subscription_object-tax_percent
              'trial_end', // https://stripe.com/docs/api/subscriptions/object#subscription_object-trial_end
            ]),
          };
          //Create new subscription in destination Stripe
          const newSubscription = await destinationStripe.subscriptions.create(subscriptionArgs);
          console.log(`Created the Subscription `, newSubscription.id);
          oldSubcriptionIds.push(subscription.id);
          newSubscriptionIds.push(newSubscription.id);
        }
      }
      await suspendSourceSubscription(oldSubcriptionIds);
      console.log('Migrated the subscription of the customer ', customer.id);
    }
  }
}

module.exports = async () => {
  try {
    // Fetches all the customers from source stripe
    await list.all(sourceStripe, {
      type: 'customers',
      callback: (customers) => migrateSubscriptions(customers),
    });
  } catch (err) {
    console.log('Error while migrating subscriptions', err);
  }
};
