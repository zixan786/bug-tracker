import Stripe from 'stripe';
import { AppDataSource } from '../config/database';
import { Organization } from '../models/Organization';
import { Subscription } from '../models/Subscription';
import { Plan } from '../models/Plan';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export class StripeService {
  /**
   * Create Stripe customer for organization
   */
  static async createCustomer(organization: Organization, email: string): Promise<string> {
    const customer = await stripe.customers.create({
      email,
      name: organization.name,
      metadata: {
        organizationId: organization.id.toString(),
      },
    });

    return customer.id;
  }

  /**
   * Create checkout session for subscription
   */
  static async createCheckoutSession(
    organizationId: number,
    planId: number,
    customerId?: string
  ): Promise<string> {
    const organizationRepo = AppDataSource.getRepository(Organization);
    const planRepo = AppDataSource.getRepository(Plan);

    const organization = await organizationRepo.findOne({ where: { id: organizationId } });
    const plan = await planRepo.findOne({ where: { id: planId } });

    if (!organization || !plan) {
      throw new Error('Organization or plan not found');
    }

    // Create customer if not exists
    if (!customerId) {
      customerId = await this.createCustomer(organization, 'admin@' + organization.slug + '.com');
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${plan.name} Plan`,
              description: plan.description || '',
            },
            unit_amount: Math.round(plan.priceMonthly! * 100), // Convert to cents
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/billing/canceled`,
      metadata: {
        organizationId: organizationId.toString(),
        planId: planId.toString(),
      },
    });

    return session.url!;
  }

  /**
   * Handle successful checkout
   */
  static async handleCheckoutSuccess(sessionId: string): Promise<void> {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });

    if (!session.metadata?.organizationId || !session.metadata?.planId) {
      throw new Error('Missing metadata in checkout session');
    }

    const organizationId = parseInt(session.metadata.organizationId);
    const planId = parseInt(session.metadata.planId);

    const subscriptionRepo = AppDataSource.getRepository(Subscription);
    const organizationRepo = AppDataSource.getRepository(Organization);

    // Update or create subscription
    let subscription = await subscriptionRepo.findOne({
      where: { organizationId }
    });

    const stripeSubscription = session.subscription as Stripe.Subscription;

    if (subscription) {
      subscription.stripeSubscriptionId = stripeSubscription.id;
      subscription.stripeCustomerId = session.customer as string;
      subscription.planId = planId;
      subscription.status = 'active';
      subscription.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
      subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
    } else {
      subscription = subscriptionRepo.create({
        organizationId,
        planId,
        stripeSubscriptionId: stripeSubscription.id,
        stripeCustomerId: session.customer as string,
        status: 'active',
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      });
    }

    await subscriptionRepo.save(subscription);

    // Update organization subscription status
    const organization = await organizationRepo.findOne({ where: { id: organizationId } });
    if (organization) {
      organization.subscriptionStatus = 'active';
      await organizationRepo.save(organization);
    }
  }

  /**
   * Handle webhook events
   */
  static async handleWebhook(event: Stripe.Event): Promise<void> {
    const subscriptionRepo = AppDataSource.getRepository(Subscription);
    const organizationRepo = AppDataSource.getRepository(Organization);

    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object as Stripe.Subscription;
        
        const dbSubscription = await subscriptionRepo.findOne({
          where: { stripeSubscriptionId: subscription.id },
          relations: ['organization']
        });

        if (dbSubscription) {
          dbSubscription.status = subscription.status as any;
          dbSubscription.currentPeriodStart = new Date(subscription.current_period_start * 1000);
          dbSubscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
          
          await subscriptionRepo.save(dbSubscription);

          // Update organization status
          const organization = dbSubscription.organization;
          organization.subscriptionStatus = subscription.status === 'active' ? 'active' : 'canceled';
          await organizationRepo.save(organization);
        }
        break;

      case 'invoice.payment_failed':
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const failedSubscription = await subscriptionRepo.findOne({
            where: { stripeSubscriptionId: invoice.subscription as string },
            relations: ['organization']
          });

          if (failedSubscription) {
            failedSubscription.status = 'past_due';
            await subscriptionRepo.save(failedSubscription);

            const organization = failedSubscription.organization;
            organization.subscriptionStatus = 'past_due';
            await organizationRepo.save(organization);
          }
        }
        break;

      case 'invoice.payment_succeeded':
        // Handle successful payment
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(organizationId: number): Promise<void> {
    const subscriptionRepo = AppDataSource.getRepository(Subscription);
    const subscription = await subscriptionRepo.findOne({
      where: { organizationId }
    });

    if (!subscription?.stripeSubscriptionId) {
      throw new Error('No active subscription found');
    }

    await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
  }

  /**
   * Get billing portal URL
   */
  static async createBillingPortalSession(organizationId: number): Promise<string> {
    const subscriptionRepo = AppDataSource.getRepository(Subscription);
    const subscription = await subscriptionRepo.findOne({
      where: { organizationId }
    });

    if (!subscription?.stripeCustomerId) {
      throw new Error('No customer found');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL}/billing`,
    });

    return session.url;
  }

  /**
   * Get usage for billing
   */
  static async reportUsage(organizationId: number, metric: string, quantity: number): Promise<void> {
    // Implementation depends on your usage-based billing setup
    // This is for metered billing with Stripe
    console.log(`Usage reported for org ${organizationId}: ${metric} = ${quantity}`);
  }
}
