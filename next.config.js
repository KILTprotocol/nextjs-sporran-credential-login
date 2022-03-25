module.exports = {
  reactStrictMode: true,
  webpack: (config) => {
    config.output = { publicPath: '/' }
    return config
  },
  async redirects() {
    return [
      {
        source: '/.well-known/did-configuration.json',
        destination: '/didConfiguration.json',
        permanent: true,
      },
    ]
  },
}
