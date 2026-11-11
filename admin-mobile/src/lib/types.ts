/** Areas of the admin panel, matching src/lib/auth/admin-permissions.ts on the web. */
export type ModuleId =
  | 'overview'
  | 'retreats'
  | 'check-in'
  | 'donations'
  | 'mass-intentions'
  | 'feedback'
  | 'homepage'
  | 'news'
  | 'events'
  | 'articles'
  | 'publications'
  | 'gallery'
  | 'ministries'
  | 'patrons'
  | 'about'
  | 'members'
  | 'leave'
  | 'team';

export type AccessLevel = 'view' | 'edit';
export type AdminRole = 'SUPERADMIN' | 'EDITOR' | 'VIEWER';

export type AdminProfile = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  roleLabel: string;
  access: { id: ModuleId; label: string; group: string; level: AccessLevel }[];
};

export type Paged<T> = { data: T[]; page: number; pageSize: number; total: number };

export type RetreatOption = { id: string; title: string; dateRange: string; status: string };

export type BookingRow = {
  id: string;
  retreatId: string;
  retreatTitle: string;
  fullName: string;
  email: string;
  phone: string;
  partySize: number;
  status: 'pending' | 'approved' | 'rescheduled' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  ticketCode: string | null;
  attended: boolean;
  checkedInAt: string | null;
  createdAt: string;
};

export type BookingsResponse = Paged<BookingRow> & {
  summary: { all: number; status: Record<string, number>; payment: Record<string, number>; checkedIn: number };
  retreats: RetreatOption[];
};

export type BookingDetail = {
  id: string;
  retreatId: string;
  retreatTitle: string;
  fullName: string;
  email: string;
  phone: string;
  whatsapp?: string;
  status: BookingRow['status'];
  paymentStatus: BookingRow['paymentStatus'];
  attended: boolean;
  checkedInAt?: string;
  familyMembers?: Record<string, unknown>[];
  notes?: string;
  cancelledAt?: string;
  rescheduledToRetreatTitle?: string;
  ticketCode?: string;
  formPayload?: Record<string, unknown>;
  createdAt: string;
};

export type Retreat = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  speaker: string;
  conductor: string;
  description: string;
  dateRange: string;
  timeRange: string;
  location: string;
  availability: { total: number; male: number; female: number };
  status: 'Registration Open' | 'Waitlist' | 'Closed';
  imageSrc: string;
  category: string;
  price?: number;
  isPaid?: boolean;
};

export type ScanResult = {
  valid: boolean;
  message?: string;
  error?: string;
  alreadyCheckedIn?: boolean;
  wrongRetreat?: boolean;
  checkedInAt?: string;
  booking?: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    status: string;
    paymentStatus: string;
    ticketCode: string | null;
    partySize: number;
    retreat: { id: string; title: string; dateRange: string; location: string };
  };
};

export type CheckInDesk = {
  data: null | {
    bookings: number;
    bookingsArrived: number;
    guests: number;
    guestsArrived: number;
    pendingApproval: number;
    recent: { id: string; fullName: string; ticketCode: string | null; checkedInAt: string | null; partySize: number }[];
    expected: { id: string; fullName: string; ticketCode: string | null; phone: string; partySize: number }[];
    updatedAt: string;
  };
  retreats: RetreatOption[];
};

export type RecordKind = 'donations' | 'mass-intentions' | 'feedback';

export type Donation = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  prayerIntention: string | null;
  status: 'new' | 'acknowledged' | 'archived';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  adminNotes: string | null;
  createdAt: string;
};

export type MassIntention = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  intentionType: string;
  intentionFor: string;
  intentionDetails: string;
  preferredDate: string | null;
  numberOfMasses: number;
  donationAmount: string | null;
  status: 'new' | 'scheduled' | 'celebrated' | 'cancelled';
  scheduledFor: string | null;
  celebrant: string | null;
  adminNotes: string | null;
  createdAt: string;
};

export type Message = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  adminNotes: string | null;
  createdAt: string;
};

export type GivingSummary = {
  paidTotal: number;
  paidCount: number;
  pendingTotal: number;
  pendingCount: number;
  thisMonth: number;
  lastMonth: number;
  thisYear: number;
  byMethod: { method: string; total: number; count: number }[];
  months: { month: string; total: number; count: number }[];
};

export type RecordsResponse<T> = Paged<T> & {
  summary: {
    status: Record<string, number>;
    giving?: GivingSummary;
    upcoming?: Pick<MassIntention, 'id' | 'fullName' | 'intentionFor' | 'intentionType' | 'scheduledFor' | 'celebrant'>[];
  };
};

export type ContentType = 'publications' | 'news' | 'events' | 'articles';

export type ContentItem = {
  id: string;
  type: ContentType;
  title: string;
  slug: string;
  summary: string | null;
  body: string | null;
  category: string | null;
  status: 'draft' | 'published' | string;
  mediaUrl: string | null;
  publishDate: string | null;
  metadata: Record<string, unknown> | null;
  updatedAt: string;
};

export type Overview = {
  can: { retreats: boolean; checkIn: boolean; donations: boolean; intentions: boolean; inbox: boolean; team: boolean; members?: boolean; leave?: boolean };
  stats: {
    pendingBookings: number;
    bookings30: number;
    checkedIn30: number;
    givingThisMonth: number;
    giftsThisMonth: number;
    newDonations: number;
    newIntentions: number;
    unreadMessages: number;
    teamSize: number;
    pendingLeave?: number;
    awayToday?: number;
  };
  givingMonths: { month: string; total: number }[];
  openRetreats: { id: string; title: string; dateRange: string; location: string; imageSrc: string; status: string; capacity: number; booked: number }[];
  recentBookings: { id: string; retreatId: string; fullName: string; retreatTitle: string; status: string; paymentStatus: string; createdAt: string }[];
  upcomingIntentions: { id: string; fullName: string; intentionFor: string; intentionType: string; scheduledFor: string; celebrant: string | null }[];
  activity: ActivityEntry[];
};

export type ActivityEntry = { id: string; actorName: string | null; action: string; entity: string; summary: string; createdAt: string };

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  allowedModules: string[];
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

export type Invite = {
  id: string;
  email: string;
  name: string | null;
  role: AdminRole;
  allowedModules: string[];
  invitedBy: string | null;
  expiresAt: string;
  createdAt: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
};

export type ModuleInfo = { id: ModuleId; label: string; group: string; description: string };

export type Member = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  memberType: string;
  position: string | null;
  department: string | null;
  status: 'active' | 'inactive';
  startDate: string | null;
  photoUrl: string | null;
  annualLeaveDays: number;
  notes: string | null;
  adminUserId: string | null;
  adminUser?: { id: string; name: string; email: string } | null;
  annualLeaveUsed: number;
  awayUntil?: string | null;
};

export type LeaveRequest = {
  id: string;
  memberId: string;
  member: { id: string; fullName: string; memberType: string; position: string | null; department: string | null; annualLeaveDays: number };
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reviewedByName: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
};
