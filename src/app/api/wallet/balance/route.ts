import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const session = await requireAuth();

    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
      select: {
        balance: true,
        currency: true,
      },
    });

    if (!wallet) {
      return NextResponse.json(
        { error: { message: 'Wallet not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        balance: wallet.balance,
        currency: wallet.currency,
      },
    });
  } catch (error) {
    console.error('Wallet balance fetch error:', error);
    return NextResponse.json(
      { error: { message: 'Failed to fetch wallet balance' } },
      { status: 500 }
    );
  }
}
