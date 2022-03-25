module.exports = {
  reactStrictMode: true,
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
