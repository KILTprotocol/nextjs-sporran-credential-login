module.exports = {
  reactStrictMode: true,
  output: { publicPath: '/' },
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
