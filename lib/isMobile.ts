export function isMobile() {
  return (
    typeof window !== "undefined" &&
    (window.innerWidth < 768 || window.innerHeight < 768)
  );
}
