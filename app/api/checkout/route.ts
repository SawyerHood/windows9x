import { getUser } from "@/lib/auth/getUser";
import { redirect } from "next/navigation";

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(): Promise<Response> {
  const user = await getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID,
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}`,
    metadata: {
      userId: user.id,
    },
  });

  return redirect(session.url!);
}
