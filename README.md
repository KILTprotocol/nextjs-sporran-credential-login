# Web3 Verification Credential Login

The following code is example code and requires the user to add business logic and security to the application. 

The Web3 DID login with credential verification gives a new flow for authentication by giving the control of the users data back into their hands, whilst providing utility into the builders of the application and unloading the burden of users personal data. 

The flow from the application: ​​User -> website -> logins in with DID -> Website requests credential -> User gives premisssion access a credential -> Creates Access token -> Website saves credential hash connected to the did in backend excluding personal info

## Getting Started

Lets get going! Lets see how you can start a web3 DID login with credentials verification.

### Requirements

`Node` installed and [sporran wallet](https://github.com/BTE-Trusted-Entity/sporran-extension/tree/main) for testing use the test sporran walleter. For installation follow the steps in the sporran wallet repository.

### Verifier Setup

You will need a DID and verification of the domain for so the users, can see the entity (website) are the same entity that controls an Internet domain, this is called the [well known domain linkage credential](https://identity.foundation/specs/did-configuration/).

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

Consider a user comes to the website, they have a credential with their email address that user provides the website access to the credential to verify the information. Once confirmed, the application can delete the personal information and store the credential hash to the user DID and unique login ID for the site. The user buys an item from your store or uses a service that requires information about shipping. The credential hash can be stored once again in the associated place in the database and requested during the short process, and removed after processing the shipment. The user can rely on the website for getting the information and feel comfortable with the process of trust.

The utility can be expanded further. Let's look at the credential login process now and go over what each step is doing and where you can take the code and add it to your existing project or start from scratch from this point.
