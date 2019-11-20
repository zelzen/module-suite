import url from 'url';

/**
 * This function formats the url with
 * the url node util lib.
 */
export default function formatUrl(inputURL: string) {
  // If a user passes a URL with no protocol
  // default to using insecure http.
  return inputURL.startsWith('//', 0) ? url.parse(`http:${inputURL}`) : url.parse(inputURL);
}
