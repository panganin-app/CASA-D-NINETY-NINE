/** Ekspor statis: UI di-host sebagai file statis (Firebase Hosting), semua data lewat Cloud Functions. */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
};
export default nextConfig;
