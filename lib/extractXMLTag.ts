export function extractXMLTag(xml: string, tag: string) {
  const regex = new RegExp(`<${tag}>(.*?)</${tag}>`);
  const match = regex.exec(xml);
  return match ? match[1] : null;
}
