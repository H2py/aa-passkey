import { encodeFunctionData, getAddress } from 'viem';
import type { Address } from 'viem';
import type { UserOperationReceipt } from 'viem/account-abstraction';
import type { SmartAccountClient } from 'permissionless';

export async function refundUsdc({
  smartAccount,
  to, // 입금 보낸 사람
  amount, // 최소 단위(6 decimals)로
}: {
  smartAccount: SmartAccountClient,
  to: Address,
  amount: bigint,
}): Promise<UserOperationReceipt> {
  const usdcEnv = import.meta.env.VITE_USDC;
  if (!usdcEnv) {
    throw new Error('VITE_USDC is not defined');
  }

  const usdc = getAddress(usdcEnv);

  const data = encodeFunctionData({
    abi: [{
      type: 'function',
      name: 'transfer',
      stateMutability: 'nonpayable',
      inputs: [{ name: 'to', type: 'address' }, { name: 'value', type: 'uint256' }],
      outputs: [{ name: 'ok', type: 'bool' }],
    }],
    functionName: 'transfer',
    args: [to, amount],
  });

  // 스마트 계정에서 직접 토큰 컨트랙트 호출 (가스는 Paymaster가 스폰서)
  const userOpHash = await smartAccount.sendUserOperation({
    calls: [{
      to: usdc,
      data,
      value: 0n,
    }],
  });
  const receipt = await smartAccount.waitForUserOperationReceipt({ hash: userOpHash });
  return receipt;
}
