export function isLocal() {
  return process.env.NEXT_PUBLIC_LOCAL_MODE === "true";
}
