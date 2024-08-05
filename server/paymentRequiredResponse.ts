export function createPaymentRequiredResponse() {
  return new Response(
    JSON.stringify({
      error: "INSUFFICIENT_TOKENS",
      message:
        "Insufficient tokens. Use a custom key or buy tokens to continue.",
    }),
    {
      status: 402,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}
