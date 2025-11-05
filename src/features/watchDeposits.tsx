import { createPublicClient, decodeEventLog, getAddress, http, parseAbiItem } from 'viem';
import type { Address, Hash } from 'viem';
import { citrea } from '../chain/citrea';

const TRANSFER = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');

export type DepositEvent = {
  from: Address;
  to: Address;
  value: bigint;
  txHash: Hash;
};

export type WatchUsdcDepositsParams = {
  aaAddress: Address;
  onDeposit: (evt: DepositEvent) => void;
};

export function watchUsdcDeposits({ aaAddress, onDeposit }: WatchUsdcDepositsParams) {
  const rpcUrl = import.meta.env.VITE_CITREA_RPC;
  const usdcAddress = import.meta.env.VITE_USDC;

  if (!rpcUrl || !usdcAddress) {
    console.warn('Cannot start deposit watcher. Missing VITE_CITREA_RPC or VITE_USDC.');
    return () => {};
  }

  const client = createPublicClient({ chain: citrea, transport: http(rpcUrl) });
  const usdc = getAddress(usdcAddress);

  // viem은 websockets가 없으면 폴링으로 자동 대체됨 (poll: true, interval 지정 가능)
  const unwatch = client.watchEvent({
    address: usdc,
    // indexed topic으로 AA 주소 필터링
    // topic[2] (to) = aaAddress
    event: TRANSFER,
    args: { to: aaAddress },
    onLogs: (logs) => {
      for (const log of logs) {
        if (!log.transactionHash) continue;
        const { args } = decodeEventLog({ abi: [TRANSFER], data: log.data, topics: log.topics });
        onDeposit({
          from: args.from as Address,
          to: args.to as Address,
          value: args.value as bigint,
          txHash: log.transactionHash,
        });
      }
    },
    poll: true,
    pollingInterval: 5000, // 5초 폴링
  });

  return unwatch;
}
