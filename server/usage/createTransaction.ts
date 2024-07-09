import { Client } from "@/lib/supabase/server";

export async function createTransaction({
  client,
  userId,
  amount,
  tokensPurchased,
}: {
  client: Client;
  userId: string;
  amount: number;
  tokensPurchased: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await client.from("transactions").insert({
      user_id: userId,
      amount: amount,
      tokens_purchased: tokensPurchased,
    });

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error("Error creating transaction:", error);
    return { success: false, error: "Failed to create transaction" };
  }
}
