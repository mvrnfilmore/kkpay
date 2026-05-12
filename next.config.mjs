/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tambahkan ini untuk bypass pengecekan host di jaringan lokal
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ];
  },
};

export default nextConfig;