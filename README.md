# Web3 Verification Credential Login

The following code is example code and requires the user to add business logic and security to the application.

The Web3 DID login with credential verification gives a new flow for authentication by giving the control of the users data back into their hands, whilst providing utility into the builders of the application and unloading the burden of users personal data.

The flow from the application

![](./public/web3LoginFlow.png)

## Getting Started

Lets get going! Lets see how you can start a web3 DID login with credentials verification.

### Requirements

`Node` installed and [sporran wallet](https://github.com/BTE-Trusted-Entity/sporran-extension/tree/main) for testing use the test sporran walleter. For installation follow the steps in the sporran wallet repository.

### Verifier Setup

In order to use the web3 login, the service needs its own DID and provide a [well known domain linkage credential](https://identity.foundation/specs/did-configuration/). A well known domain linkage credential provides a credential for users to verify the domain belongs to the given service. Creating a way to share public keys with the application and user.

You can create and attest your well known domain linkage credential or you can use the verification setup tool in the [KILT Distillery CLI](https://github.com/KILTprotocol/kilt-distillery-cli/tree/main/recipes)

Use the KILT Distillery CLI to setup:

- .env
- didConfiguration.json

After you have a create the well known domain linkage for the application, you will need to add it to the `.env` file as shown below 

```BASH
VERIFIER_MNEMONIC="Enter your twelve word mnemonic phrase here "
VERIFIER_ADDRESS=Enter your address
VERIFIER_DID_URI=Enter your DID URI
```

Now you can add the well known domain linkage credential, `didConfigyration.json`, to the `public` folder of the application. The credential must be issued and matches the verifier DID’s.

```JSON
{
  "@context": "https://identity.foundation/.well-known/did-configuration/v1",
  "linked_dids": [
    {
      "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://identity.foundation/.well-known/did-configuration/v1"
      ],
      "issuer": "did:kilt:4o3zUbeEowBHbAu4aLsNXyNQHEw16KZbinLyd6BwXVkzdJKn",
      "issuanceDate": "2022-04-07T07:54:39.384Z",
      "expirationDate": "2027-04-06T07:54:39.386Z",
      "type": [
        "VerifiableCredential",
        "DomainLinkageCredential",
        "KiltCredential2020"
      ],
      "credentialSubject": {
        "id": "did:kilt:4o3zUbeEowBHbAu4aLsNXyNQHEw16KZbinLyd6BwXVkzdJKn",
        "origin": "http://localhost:3000",
        "rootHash": "0x54da9dd88fdf83063d6549295721c84ab59f9d802f49ebfb20e5a00e250625ec"
      },
      "proof": {
        "type": "KILTSelfSigned2020",
        "proofPurpose": "assertionMethod",
        "verificationMethod": "did:kilt:4o3zUbeEowBHbAu4aLsNXyNQHEw16KZbinLyd6BwXVkzdJKn#0x5e7ea14081452641c4970081552f774d4b2495ce918ddc0e35fd50735e5d7e1c",
        "signature": "0x044fe1502df8e9c057f016986826c8e3108d8c8dcae055af041f9fa51ce34a201d6c4428242fb6d6690fc3833f040b3e5c91b94c997e7a4232f5c5ee1ca7eb89"
      }
    }
  ]
}

```

### Setup

Clone the repository and go into the folder. You can setup a whole project from start to finish following the KILT Distillery CLI for recipe creation.

Now install with the following command

```js
npm run install 
```

Once you have installed the application and the environmental variables are setup from [verifier setup](#verifier-setup), you can now start the application with the following command

```js
npm run dev
```

## What can you do with the credentials?

You can make applications that require credentials to access parts of the services. For example,  having a credential for the user's shipping information, the database links the user DID to specific hashes of stored credentials. When someone wants to make a purchase, they can provide the data to the site and not rely on a centralised service.

Consider a user, they comes to the website and want to use a service needing shipping information and a way to contact the user. The website accepts credentials issued by socialKYC as they trust the service. This user can provide the website with the credentials to verify the given information, and the application can validate the credentials by querying the KILT chain.

Once confirmed, the application can create a unique login with the DID plus other information, such as a password. After creating the login, the application can delete all personal information and store any credential hashes for later uses.

Now, the user wants to buy an item from your store or uses a service that requires information about shipping. Instead of the user entering or the application knowing the personal information, the website can request a new or existing credential the user owns, assoicated to a given CType. The website validates the information, creates the order, issues an invoice and deletes all personal information afterwards. The user can rely on the website for getting the information and feel comfortable with the process of trust.

The utilities can be expanded further. Let's look at the credential login process now and go over what each step is doing and where you can take the code and add it to your existing project or start from scratch from this point.
