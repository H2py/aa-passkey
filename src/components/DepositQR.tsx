// cspell:ignore qrcode
import QRCode from 'qrcode.react';

export function DepositQR({ address, token, amount }: { address: string; token?: string; amount?: string }) {
  // EIP-681 (토큰 전송 URI를 지원하는 지갑용), 지원 안 되면 address만 보여줌
  const chainId = 5115;
  const eip681 = token
    ? `ethereum:${token}@${chainId}/transfer?address=${address}${amount ? `&uint256=${amount}` : ''}`
    : address;

  return (
    <div style={{ textAlign: 'center' }}>
      <QRCode value={eip681} size={180} />
      <div style={{ marginTop: 8, fontFamily: 'monospace' }}>{address}</div>
      <small>지갑에서 1 USDC를 이 주소로 전송</small>
    </div>
  );
}
