import { stripe } from '../../../utils/stripe';
import { prisma } from '../../../utils/db';
import { headers } from 'next/headers';

export async function POST(req) {
  const body = await req.text();
  const signature = (await headers()).get('stripe-signature');

  let event;

  try {
    // Note: You need to set STRIPE_WEBHOOK_SECRET in .env.local for this to work securely.
    // For local testing without a secret, you can skip verification, but in prod you MUST verify.
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (secret) {
      event = stripe.webhooks.constructEvent(body, signature, secret);
    } else {
      event = JSON.parse(body); // Unsafe fallback for local testing without webhook secret
    }
  } catch (err) {
    return Response.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.client_reference_id;

    if (userId) {
      // Upgrade user to Pro in database
      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: 'pro',
          stripeCustomerId: session.customer,
        },
      });
    }
  }

  return Response.json({ received: true });
}
