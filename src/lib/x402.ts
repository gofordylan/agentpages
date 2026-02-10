import { HTTPFacilitatorClient, x402ResourceServer } from '@x402/core/server';
import { registerExactEvmScheme } from '@x402/evm/exact/server';

export const X402_NETWORK = (process.env.X402_NETWORK || 'eip155:84532') as `${string}:${string}`;
export const X402_FACILITATOR_URL =
  process.env.X402_FACILITATOR_URL || 'https://x402.org/facilitator';

let _server: x402ResourceServer | null = null;

export async function getX402Server(): Promise<x402ResourceServer> {
  if (_server) return _server;

  const facilitator = new HTTPFacilitatorClient({ url: X402_FACILITATOR_URL });
  const server = new x402ResourceServer(facilitator);
  registerExactEvmScheme(server);
  await server.initialize();

  _server = server;
  return server;
}
