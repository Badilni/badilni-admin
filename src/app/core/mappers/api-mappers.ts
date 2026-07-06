import { User } from '../models/user';
import { Listing } from '../models/listing';
import { Transaction } from '../models/transaction';
import { Category } from '../models/category';
import { Booking } from '../models/booking';

export interface NormalizedPagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export function normalizePagination(
  pagination: Record<string, number | undefined>,
): NormalizedPagination {
  const page = pagination['page'] ?? 1;
  const limit = pagination['limit'] ?? 10;
  const totalCount = pagination['totalCount'] ?? pagination['total'] ?? 0;
  const totalPages =
    pagination['totalPages'] ??
    pagination['pages'] ??
    Math.max(1, Math.ceil(totalCount / limit));

  return { page, limit, totalCount, totalPages };
}

export function mapUserFromApi(raw: Record<string, unknown>): User {
  const active = raw['active'] as boolean | undefined;
  let status: User['status'] = 'active';
  if (active === false) status = 'suspended';

  return {
    _id: String(raw['_id'] ?? ''),
    name: String(raw['name'] ?? ''),
    email: String(raw['email'] ?? ''),
    role: (raw['role'] as User['role']) ?? 'user',
    photo: (raw['avatar'] as { url?: string })?.url,
    bio: raw['bio'] as string | undefined,
    isVerified: Boolean(raw['isVerified']),
    status,
    skillTags: raw['skillTags'] as string[] | undefined,
    walletBalance: Number(raw['walletBalance'] ?? 0),
    creditsInEscrow: Number(raw['creditsInEscrow'] ?? 0),
    totalSessionsCompleted: Number(raw['totalSessionsCompleted'] ?? 0),
    averageRating: Number(raw['averageRating'] ?? 0),
    createdAt: raw['createdAt'] as string | undefined,
    updatedAt: raw['updatedAt'] as string | undefined,
  };
}

export function mapUserToApi(data: Partial<User> & { password?: string }): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  if (data.name !== undefined) payload['name'] = data.name;
  if (data.email !== undefined) payload['email'] = data.email;
  if (data.role !== undefined) payload['role'] = data.role;
  if (data.bio !== undefined) payload['bio'] = data.bio;
  if (data.password) payload['password'] = data.password;

  if (data.status !== undefined) {
    payload['active'] = data.status === 'active';
  }

  return payload;
}

export function mapListingFromApi(raw: Record<string, unknown>): Listing {
  const user = raw['user'];
  let provider = '';
  if (typeof user === 'object' && user !== null) {
    provider = String((user as Record<string, unknown>)['_id'] ?? (user as Record<string, unknown>)['name'] ?? '');
  } else if (user) {
    provider = String(user);
  }

  const category = raw['category'];
  let categoryName = '';
  if (typeof category === 'object' && category !== null) {
    categoryName = String((category as Record<string, unknown>)['name'] ?? (category as Record<string, unknown>)['_id'] ?? '');
  } else if (category) {
    categoryName = String(category);
  }

  const isActive = raw['isActive'] !== false;

  return {
    _id: String(raw['_id'] ?? ''),
    title: String(raw['title'] ?? ''),
    provider,
    price: Number(raw['hourlyRate'] ?? 0),
    tags: (raw['tags'] as string[]) ?? [],
    status: isActive ? 'active' : 'inactive',
    category: categoryName,
    description: raw['description'] as string | undefined,
    createdAt: raw['createdAt'] as string | undefined,
    updatedAt: raw['updatedAt'] as string | undefined,
  };
}

export function mapListingToApi(data: Partial<Listing>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  if (data.title !== undefined) payload['title'] = data.title;
  if (data.description !== undefined) payload['description'] = data.description;
  if (data.category !== undefined) payload['category'] = data.category;
  if (data.price !== undefined) payload['hourlyRate'] = data.price;

  if (data.status !== undefined) {
    payload['isActive'] = data.status === 'active';
  }

  return payload;
}

export function mapTransactionFromApi(raw: Record<string, unknown>): Transaction {
  const fromUser = raw['fromUser'];
  const toUser = raw['toUser'];

  const resolveParty = (party: unknown): string => {
    if (party === null || party === undefined) return 'System';
    if (typeof party === 'object') {
      const obj = party as Record<string, unknown>;
      return String(obj['name'] ?? obj['_id'] ?? '—');
    }
    return String(party);
  };

  const createdAt = raw['createdAt'];
  let dateStr = '';
  if (createdAt) {
    dateStr = new Date(String(createdAt)).toLocaleString();
  }

  return {
    _id: String(raw['_id'] ?? ''),
    sender: resolveParty(fromUser),
    receiver: resolveParty(toUser),
    booking: raw['booking'] ? String(raw['booking']) : undefined,
    type: raw['type'] as Transaction['type'],
    amount: Number(raw['amount'] ?? 0),
    status: 'completed',
    description: raw['description'] as string | undefined,
    createdAt: dateStr,
  };
}

export function mapCategoryFromApi(raw: Record<string, unknown>): Category {
  return {
    _id: String(raw['_id'] ?? ''),
    name: String(raw['name'] ?? ''),
    slug: String(raw['slug'] ?? ''),
    icon: '📁',
    order: 0,
    active: true,
    createdAt: raw['createdAt'] as string | undefined,
    updatedAt: raw['updatedAt'] as string | undefined,
  };
}


export function mapBookingFromApi(raw: Record<string, unknown>): Booking {
  const resolveParty = (party: unknown): string => {
    if (party === null || party === undefined) return '';
    if (typeof party === 'object') {
      const obj = party as Record<string, unknown>;
      return String(obj['name'] ?? obj['_id'] ?? '');
    }
    return String(party);
  };

  const resolveTitle = (item: unknown): string | undefined => {
    if (!item) return undefined;
    if (typeof item === 'object') {
      const obj = item as Record<string, unknown>;
      return String(obj['title'] ?? obj['_id'] ?? '');
    }
    return String(item);
  };

  return {
    _id: String(raw['_id'] ?? ''),
    provider: resolveParty(raw['provider']),
    receiver: resolveParty(raw['receiver']),
    listing: resolveTitle(raw['listing']),
    request: resolveTitle(raw['request']),
    scheduledAt: raw['scheduledAt'] ? String(raw['scheduledAt']) : '',
    durationHours: Number(raw['durationHours'] ?? 0),
    creditsTotal: Number(raw['creditsTotal'] ?? 0),
    status: raw['status'] as Booking['status'],
    providerConfirmed: Boolean(raw['providerConfirmed']),
    receiverConfirmed: Boolean(raw['receiverConfirmed']),
    createdAt: raw['createdAt'] as string | undefined,
    updatedAt: raw['updatedAt'] as string | undefined,
  };
}
