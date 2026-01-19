export const getStoreSlug = () => {
  const host = window.location.hostname;
  const parts = host.split(".");

  // localhost
  if (host === "localhost") return null;

  // subdomain.localhost
  if (host.endsWith(".localhost")) {
    const sub = parts[0];
    return sub !== "www" ? sub : null;
  }

  // subdomain.maitripos.com
  if (parts.length > 2) {
    const sub = parts[0];
    return sub !== "www" ? sub : null;
  }

  return null;
};
