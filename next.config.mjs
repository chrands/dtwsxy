/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  
  // 生产环境优化
  swcMinify: true,
  
  // 注意：standalone模式会改变静态资源路径，PM2部署时不需要
  // output: 'standalone',  // 已注释，使用默认模式
  
  // 环境变量配置
  env: {
    CUSTOM_ENV: process.env.NODE_ENV,
  },
  
  // API路由配置
  async headers() {
    // 生产环境应使用具体的域名列表，而非通配符
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['http://localhost:5288'];

    return [
      {
        source: '/api/:path*',
        headers: [
          // 注意：生产环境必须移除通配符，使用具体域名
          { 
            key: 'Access-Control-Allow-Origin', 
            value: process.env.NODE_ENV === 'production' 
              ? allowedOrigins[0] // 生产环境使用第一个允许的域名
              : 'http://localhost:5288' 
          },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          { 
            key: 'Access-Control-Allow-Headers', 
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' 
          },
        ],
      },
      // 确保静态资源正确加载
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default nextConfig;