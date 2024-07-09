import { NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createTransaction } from "@/server/usage/createTransaction";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook Error: ${err}` },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const client = createClient();

    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 400 });
    }

    if (userId) {
      const { error } = await createTransaction({
        client,
        userId,
        amount: session.amount_total!,
        tokensPurchased: 100,
      });

      if (error) {
        console.error("Error updating user tokens:", error);
        return NextResponse.json(
          { error: "Error updating user tokens" },
          { status: 500 }
        );
      }
    }
  }

  return NextResponse.json({ received: true });
}
