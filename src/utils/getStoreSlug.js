export const getStoreSlug = () => {
  const host = window.location.hostname;
  // maitripostest.localhost

  const parts = host.split(".");

  // localhost → no slug
  if (parts.length < 2) return null;

  // maitripostest.localhost → slug = maitripostest
  if (parts[parts.length - 1] === "localhost") {
    return parts[0];
  }

  return null;
};
