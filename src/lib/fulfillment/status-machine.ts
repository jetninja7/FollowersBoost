import { OrderStatus } from '@prisma/client';

// Valid status transitions
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'FAILED', 'CANCELLED'],
  COMPLETED: ['REFUNDED'],
  CANCELLED: [],
  FAILED: [],
  REFUNDED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) || false;
}

export function validateTransition(
  from: OrderStatus,
  to: OrderStatus
): { valid: boolean; error?: string } {
  if (!canTransition(from, to)) {
    return {
      valid: false,
      error: `Cannot transition from ${from} to ${to}`,
    };
  }
  return { valid: true };
}

// Status that require refunds when transitioning to them
export const REFUND_STATUSES: OrderStatus[] = ['CANCELLED', 'FAILED', 'REFUNDED'];

// Active statuses (orders being worked on)
export const ACTIVE_STATUSES: OrderStatus[] = ['PENDING', 'PROCESSING', 'IN_PROGRESS'];

// Final statuses (orders complete)
export const FINAL_STATUSES: OrderStatus[] = ['COMPLETED', 'CANCELLED', 'FAILED', 'REFUNDED'];
