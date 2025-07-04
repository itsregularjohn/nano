import Stripe from "stripe";
import config from "../core/config";
import { UserModel } from "../models";

const stripe = new Stripe(config.stripe!.apiKey!);

export interface CreateCheckoutSessionInput {
  userId: string;
  userEmail: string;
  successUrl: string;
  cancelUrl: string;
}

export async function createCheckoutSession(input: CreateCheckoutSessionInput) {
  // Check if user already has a customer ID
  const user = await UserModel.findById(input.userId);
  if (!user) throw new Error("User not found");

  // Create or retrieve Stripe customer
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        userId: user.id,
      },
    });
    customerId = customer.id;

    // Save customer ID to user (but don't save pro status)
    await UserModel.updateStripeCustomerId(user.id, customerId);
  }

  // Create checkout session for subscription
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [
      {
        price: config.stripe!.priceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    metadata: {
      userId: user.id,
    },
  });

  return session;
}

export async function createPortalSession(
  customerId: string,
  returnUrl: string
) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

export interface SubscriptionStatus {
  isActive: boolean;
  subscriptionId: string | null;
  status: string | null;
  currentPeriodEnd: Date | null;
}

export async function checkSubscriptionStatus(
  userId: string
): Promise<SubscriptionStatus> {
  const user = await UserModel.findById(userId);
  if (!user || !user.stripeCustomerId) {
    return {
      isActive: false,
      subscriptionId: null,
      status: null,
      currentPeriodEnd: null,
    };
  }

  try {
    // Get all subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: "all",
    });

    // Find the most recent active subscription
    const activeSubscription = subscriptions.data.find(
      (sub) => sub.status === "active" || sub.status === "trialing"
    );

    if (activeSubscription) {
      return {
        isActive: true,
        subscriptionId: activeSubscription.id,
        status: activeSubscription.status,
        currentPeriodEnd: new Date(activeSubscription.ended_at!),
      };
    }

    return {
      isActive: false,
      subscriptionId: null,
      status: subscriptions.data[0]?.status || null,
      currentPeriodEnd: null,
    };
  } catch (error) {
    console.error("Error checking subscription status:", error);
    return {
      isActive: false,
      subscriptionId: null,
      status: "unknown",
      currentPeriodEnd: null,
    };
  }
}

export { stripe };
