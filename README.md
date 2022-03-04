## Verifier Setup
Use the KILT Distillery CLI to setup: 
- .env
- didConfiguration.json
- encryptionKey.json

Place `.env` at root, `didConfiguration.json` in `/public` and `encryptionKey.json` in `/utils`

For now manually add these vars to `.env`

JWT_EXPIRY="7 days"
JWT_RENEW=true
JWT_SECRET=0x6d6b2cb17a72433762d4e278d0f30b3a

## Getting Started

First, install dependencies:

```bash
yarn install
```

Run the server

```bash
npm run dev
```

It's assumed you have a Sporran wallet installed with Credentials available. 


## TODO
- [ ] improve documentation
- [ ] move the setup flow to CLI
- [ ] CLI feature to create a test user with Credential on Peregrin
- [ ] refactor / organize / comment code
- [ ] add recipe to CLI