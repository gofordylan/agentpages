import { NextRequest, NextResponse } from 'next/server';
import { getProfileByUsername } from '@/lib/redis-data';
import { getX402Server, X402_NETWORK, X402_FACILITATOR_URL } from '@/lib/x402';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string; capabilityId: string }> },
) {
  const { username, capabilityId } = await params;

  try {
    const profile = await getProfileByUsername(username);
    if (!profile || !profile.isPublished) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const cap = profile.capabilities.find((c) => c.id === capabilityId);
    if (!cap || !cap.isPublic) {
      return NextResponse.json({ error: 'Capability not found' }, { status: 404 });
    }

    if (!cap.price) {
      return NextResponse.json({ error: 'This capability is free' }, { status: 400 });
    }

    if (!profile.walletAddress) {
      return NextResponse.json(
        { error: 'Agent has no wallet configured' },
        { status: 400 },
      );
    }

    const paymentHeader =
      req.headers.get('X-PAYMENT') || req.headers.get('x-payment');

    if (!paymentHeader) {
      return NextResponse.json(
        {
          price: cap.price,
          network: X402_NETWORK,
          payTo: profile.walletAddress,
          facilitator: X402_FACILITATOR_URL,
          resource: `/api/hire/${username}/${capabilityId}`,
        },
        { status: 402 },
      );
    }

    // Verify and settle payment via x402
    const server = await getX402Server();

    const resourceConfig = {
      scheme: 'exact' as const,
      payTo: profile.walletAddress,
      price: cap.price,
      network: X402_NETWORK,
    };

    const resourceInfo = {
      url: `/api/hire/${username}/${capabilityId}`,
      description: `Hire ${profile.displayName} for ${cap.name}`,
      mimeType: 'application/json',
    };

    const paymentPayload = JSON.parse(
      Buffer.from(paymentHeader, 'base64').toString('utf-8'),
    );

    const result = await server.processPaymentRequest(
      paymentPayload,
      resourceConfig,
      resourceInfo,
    );

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Payment verification failed',
          details: result.error,
        },
        { status: 402 },
      );
    }

    return NextResponse.json({
      agent: username,
      capability: cap.name,
      contactMethod: cap.contactMethod,
      contactEndpoint: cap.contactEndpoint,
    });
  } catch (error) {
    console.error('Error processing hire request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
