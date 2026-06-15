import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyPassword } from '@/lib/auth/password';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    console.log('[TEST-AUTH] Testing auth for:', email);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        debug: { email, userExists: false }
      });
    }

    if (!user.password) {
      return NextResponse.json({
        success: false,
        error: 'No password set',
        debug: { email, userExists: true, hasPassword: false }
      });
    }

    // Test password
    const isValid = await verifyPassword(password, user.password);

    return NextResponse.json({
      success: isValid,
      error: isValid ? null : 'Password mismatch',
      debug: {
        email,
        userExists: true,
        hasPassword: true,
        passwordLength: password.length,
        hashLength: user.password.length,
        hashPrefix: user.password.substring(0, 7),
        isValid
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
