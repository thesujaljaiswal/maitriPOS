export const getStoreSlug = () => {
  const host = window.location.hostname;
  const parts = host.split(".");

  // localhost (no subdomain)
  if (host === "localhost") return null;

  // subdomain.localhost
  if (host.endsWith(".localhost")) {
    return parts[0];
  }

  // subdomain.maitripos.com
  if (parts.length >= 3) {
    return parts[0];
  }

  return null;
};
