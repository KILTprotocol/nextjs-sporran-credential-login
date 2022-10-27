import {
  IEncryptedMessage,
  DidUri,
  KiltAddress,
  DidResourceUri,
} from '@kiltprotocol/types'
import { HexString } from '@polkadot/util/types'
import { isHex } from '@polkadot/util'
import { SelfSignedProof, VerifiableCredential } from '@kiltprotocol/vc-export'
import { KILT_CREDENTIAL_IRI_PREFIX } from '../utilities/wellKnownDidConfiguration'

export type This = typeof globalThis
const DEFAULT_VERIFIABLECREDENTIAL_CONTEXT =
  'https://www.w3.org/2018/credentials/v1'
export interface PubSubSession {
  listen: (
    callback: (message: IEncryptedMessage) => Promise<void>
  ) => Promise<void>
  close: () => Promise<void>
  send: (message: IEncryptedMessage) => Promise<void>
  encryptionKeyId: DidResourceUri
  encryptedChallenge: string
  nonce: string
}

export interface InjectedWindowProvider {
  startSession: (
    dAppName: string,
    dAppEncryptionKeyId: DidResourceUri,
    challenge: string
  ) => Promise<PubSubSession>
  name: string
  version: string
  specVersion: '1.0'
  signWithDid: (
    plaintext: string
  ) => Promise<{ signature: string; didKeyUri: DidResourceUri }>
  signExtrinsicWithDid: (
    extrinsic: HexString,
    signer: KiltAddress
  ) => Promise<{ signed: HexString; didKeyUri: DidResourceUri }>
}

export interface ApiWindow extends This {
  kilt: Record<string, InjectedWindowProvider>
}

export interface CredentialSubject {
  id: DidUri
  origin: string
}

const context = [
  DEFAULT_VERIFIABLECREDENTIAL_CONTEXT,
  'https://identity.foundation/.well-known/did-configuration/v1',
]
export interface DomainLinkageCredential
  extends Omit<
    VerifiableCredential,
    '@context' | 'legitimationIds' | 'credentialSubject' | 'proof'
  > {
  '@context': typeof context
  credentialSubject: CredentialSubject
  proof: SelfSignedProof
}

export interface VerifiableDomainLinkagePresentation {
  '@context': string
  linked_dids: [DomainLinkageCredential]
}

export function fromCredentialIRI(credentialId: string): HexString {
  const hexString = credentialId.startsWith(KILT_CREDENTIAL_IRI_PREFIX)
    ? credentialId.substring(KILT_CREDENTIAL_IRI_PREFIX.length)
    : credentialId
  if (!isHex(hexString))
    throw new Error(
      'Credential id is not a valid identifier (could not extract base16 / hex encoded string)'
    )
  return hexString
}

export function toCredentialIRI(rootHash: string): string {
  if (rootHash.startsWith(KILT_CREDENTIAL_IRI_PREFIX)) {
    return rootHash
  }
  if (!isHex(rootHash))
    throw new Error('Root hash is not a base16 / hex encoded string)')
  return KILT_CREDENTIAL_IRI_PREFIX + rootHash
}
