import { createPublicClient, http, type Address, type PublicClient } from 'viem';
import { entryPoint06Address, entryPoint07Address } from 'viem/account-abstraction';
import { privateKeyToAccount, type PrivateKeyAccount } from 'viem/accounts';
import { createSmartAccountClient, type SmartAccountClient } from 'permissionless';
import { createPimlicoClient } from 'permissionless/clients/pimlico';
import { toLightSmartAccount, type LightAccountVersion } from 'permissionless/accounts';
import { citrea } from '../chain/citrea';

type EntryPointVersion = '0.6' | '0.7';

const entryPointVersion: EntryPointVersion =
  import.meta.env.VITE_ENTRYPOINT_VERSION === 'V06' ? '0.6' : '0.7';

const entryPointAddress = entryPointVersion === '0.6' ? entryPoint06Address : entryPoint07Address;
const lightAccountVersionMap: Record<EntryPointVersion, LightAccountVersion<EntryPointVersion>> = {
  '0.6': '1.1.0',
  '0.7': '2.0.0',
};

export interface AaClientContext {
  owner: PrivateKeyAccount;
  publicClient: PublicClient;
  smartAccount: SmartAccountClient;
  accountAddress: Address;
}

export async function makeAaClients(ownerPrivkey?: `0x${string}`): Promise<AaClientContext> {
  // 데모용: 로컬 프라이빗키로 EOA 생성 (실전은 지갑 연결 권장)
  const ownerKey = ownerPrivkey ?? ('0x1'.padEnd(66, '0') as `0x${string}`);
  const owner = privateKeyToAccount(ownerKey);

  const rpcUrl = import.meta.env.VITE_CITREA_RPC;
  if (!rpcUrl) {
    throw new Error('VITE_CITREA_RPC is not defined');
  }

  const publicClient = createPublicClient({
    chain: citrea,
    transport: http(rpcUrl),
  });

  const entryPoint = {
    address: entryPointAddress,
    version: entryPointVersion,
  } as const;

  const lightAccount = await toLightSmartAccount({
    client: publicClient,
    owner,
    entryPoint,
    version: lightAccountVersionMap[entryPointVersion],
  });

  const pimlicoUrl = import.meta.env.VITE_PIMLICO_URL;
  if (!pimlicoUrl) {
    throw new Error('VITE_PIMLICO_URL is not defined');
  }

  const pimlicoClient = createPimlicoClient({
    chain: citrea,
    transport: http(pimlicoUrl),
    entryPoint,
  });

  // 스마트 어카운트 클라이언트 (가스 스폰서 연결)
  const smartAccount = createSmartAccountClient({
    account: lightAccount,
    chain: citrea,
    bundlerTransport: http(pimlicoUrl),
    paymaster: pimlicoClient,
  });

  return {
    owner,
    publicClient,
    smartAccount,
    accountAddress: lightAccount.address,
  };
}
