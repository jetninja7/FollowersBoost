import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/auth/require-admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;

    const body = await request.json();
    const { operation, amount, reason } = body;

    // Validation
    if (!['ADD', 'SUBTRACT'].includes(operation)) {
      return NextResponse.json(
        { error: { message: 'operation must be ADD or SUBTRACT' } },
        { status: 400 }
      );
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: { message: 'amount must be a positive number' } },
        { status: 400 }
      );
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json(
        { error: { message: 'reason is required' } },
        { status: 400 }
      );
    }

    // Check user and wallet exist
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        wallet: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: { message: 'User not found' } },
        { status: 404 }
      );
    }

    if (!user.wallet) {
      return NextResponse.json(
        { error: { message: 'User wallet not found' } },
        { status: 404 }
      );
    }

    // Check for sufficient balance when subtracting
    if (operation === 'SUBTRACT') {
      const currentBalance = Number(user.wallet.balance);
      if (currentBalance < amount) {
        return NextResponse.json(
          { error: { message: 'Insufficient balance' } },
          { status: 400 }
        );
      }
    }

    // Atomic transaction: update wallet + create transaction record
    const result = await prisma.$transaction(async (tx: any) => {
      const updatedWallet = await tx.wallet.update({
        where: { id: user.wallet!.id },
        data: {
          balance: {
            [operation === 'ADD' ? 'increment' : 'decrement']: amount,
          },
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          walletId: user.wallet!.id,
          type: operation === 'ADD' ? 'DEPOSIT' : 'WITHDRAWAL',
          amount,
          status: 'COMPLETED',
          metadata: {
            reason: reason.trim(),
            adminId: session.user.id,
            adminName: session.user.name || session.user.email,
            performedAt: new Date().toISOString(),
          },
        },
      });

      return { wallet: updatedWallet, transaction };
    });

    return NextResponse.json({
      data: {
        success: true,
        wallet: {
          balance: result.wallet.balance.toString(),
        },
        transaction: {
          id: result.transaction.id,
          type: result.transaction.type,
          amount: result.transaction.amount.toString(),
          status: result.transaction.status,
          createdAt: result.transaction.createdAt.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Error adjusting wallet:', error);
    return NextResponse.json(
      {
        error: {
          message:
            error instanceof Error ? error.message : 'Failed to adjust wallet',
        },
      },
      { status: error instanceof Error && error.message === 'Admin access required' ? 403 : 500 }
    );
  }
}
