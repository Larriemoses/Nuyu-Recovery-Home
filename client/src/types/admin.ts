export type AdminRole = "admin" | "staff";

export type AdminIdentity = {
  id: string;
  email: string;
  fullName: string;
  role: AdminRole;
};

export type AdminSessionResponse = {
  user: AdminIdentity;
};

export type AdminSetupStatus = {
  supabaseConfigured: boolean;
  paystackConfigured: boolean;
  emailConfigured: boolean;
};

export type AdminMetrics = {
  servicesCount: number;
  activeServicesCount: number;
  totalBookings: number;
  pendingBookings: number;
  heldBookings: number;
  confirmedBookings: number;
  activeHolds: number;
  totalRevenueKobo: number;
  totalClients: number;
  stayRequests: number;
};

export type AdminRecentBooking = {
  id: string;
  serviceName: string;
  clientName: string;
  clientEmail?: string | null;
  bookingKind: "appointment" | "package" | "stay";
  status: "pending" | "held" | "confirmed" | "cancelled" | "completed";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  totalAmountKobo: number;
  slotStartsAt?: string | null;
  slotEndsAt?: string | null;
  checkInDate?: string | null;
  checkOutDate?: string | null;
  createdAt: string;
};

export type AdminHold = {
  id: string;
  bookingId?: string | null;
  serviceName: string;
  clientEmail: string;
  startsAt: string;
  endsAt: string;
  expiresAt: string;
};

export type AdminServicePerformance = {
  serviceId: string;
  serviceName: string;
  bookingKind: "appointment" | "package" | "stay";
  bookingsCount: number;
  heldCount: number;
  pendingCount: number;
  estimatedValueKobo: number;
  activeHoldsCount: number;
};

export type AdminBookingRecord = {
  id: string;
  serviceId: string;
  serviceName: string;
  clientId: string;
  clientName: string;
  clientEmail?: string | null;
  clientPhone?: string | null;
  bookingKind: "appointment" | "package" | "stay";
  status: "pending" | "held" | "confirmed" | "cancelled" | "completed";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  totalAmountKobo: number;
  quantity: number;
  paystackReference?: string | null;
  slotStartsAt?: string | null;
  slotEndsAt?: string | null;
  checkInDate?: string | null;
  checkOutDate?: string | null;
  notes?: string | null;
  createdAt: string;
};

export type AdminServiceRecord = {
  id: string;
  slug: string;
  name: string;
  summary: string;
  bookingKind: "appointment" | "package" | "stay";
  isActive: boolean;
  basePriceKobo: number;
  durationMinutes?: number | null;
  minStayDays?: number | null;
  maxStayDays?: number | null;
  packages: Array<{
    id: string;
    label: string;
    sessions_count: number;
    package_price_kobo: number;
  }>;
  availabilityWindows: Array<{
    id: string;
    weekday: number;
    start_time: string;
    end_time: string;
    slot_length_minutes: number;
    capacity: number;
  }>;
  bookingsCount: number;
  heldCount: number;
  pendingCount: number;
  confirmedCount: number;
  nextBlockedSlot?: {
    startsAt: string;
    endsAt: string;
    reason?: string | null;
  } | null;
};

export type AdminClientRecord = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  notes?: string | null;
  createdAt: string;
  totalBookings: number;
  heldBookings: number;
  pendingBookings: number;
  totalQuotedKobo: number;
  totalPaidKobo: number;
  latestBookingAt?: string | null;
  latestServiceName?: string | null;
};

export type AdminOperationSummary = {
  blockedSlots: Array<{
    id: string;
    serviceId: string;
    serviceName: string;
    startsAt: string;
    endsAt: string;
    reason?: string | null;
    createdAt: string;
  }>;
  manualAvailabilitySlots: Array<{
    id: string;
    serviceId: string;
    serviceName: string;
    startsAt: string;
    endsAt: string;
    createdAt: string;
  }>;
  availabilityWindows: Array<{
    id: string;
    serviceId: string;
    serviceName: string;
    weekday: number;
    startTime: string;
    endTime: string;
    slotLengthMinutes: number;
    capacity: number;
  }>;
  activeHolds: Array<{
    id: string;
    serviceId: string;
    serviceName: string;
    clientEmail: string;
    startsAt: string;
    endsAt: string;
    expiresAt: string;
    bookingId?: string | null;
  }>;
  payments: Array<{
    id: string;
    bookingId: string;
    provider: string;
    reference: string;
    amountKobo: number;
    status: "pending" | "paid" | "failed" | "refunded";
    verifiedAt?: string | null;
    createdAt: string;
  }>;
  paymentSummary: {
    totalRecords: number;
    pendingCount: number;
    paidCount: number;
    failedCount: number;
    refundedCount: number;
    verifiedAmountKobo: number;
  };
  bookingStatusSummary: Array<{
    status: "pending" | "held" | "confirmed" | "cancelled" | "completed";
    count: number;
  }>;
};

export type AdminDashboardResponse = {
  setup: AdminSetupStatus;
  metrics: AdminMetrics;
  recentBookings: AdminRecentBooking[];
  activeHolds: AdminHold[];
  servicePerformance: AdminServicePerformance[];
  bookings: AdminBookingRecord[];
  services: AdminServiceRecord[];
  clients: AdminClientRecord[];
  operations: AdminOperationSummary;
};

export type AdminReportPeriod = "daily" | "weekly" | "monthly" | "yearly";

export type AdminReportResponse = {
  period: AdminReportPeriod;
  anchorDate: string;
  generatedAt: string;
  range: {
    label: string;
    startsAt: string;
    endsAt: string;
  };
  summary: {
    bookingsCreated: number;
    newClients: number;
    pendingBookings: number;
    heldBookings: number;
    confirmedBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    stayRequests: number;
    activeHoldsNow: number;
    quotedValueKobo: number;
    paidValueKobo: number;
  };
  bookingTypeSummary: Array<{
    bookingKind: "appointment" | "package" | "stay";
    count: number;
    quotedValueKobo: number;
  }>;
  statusSummary: Array<{
    status: "pending" | "held" | "confirmed" | "cancelled" | "completed";
    count: number;
  }>;
  paymentSummary: {
    totalRecords: number;
    pendingCount: number;
    paidCount: number;
    failedCount: number;
    refundedCount: number;
    verifiedAmountKobo: number;
  };
  serviceSummary: Array<{
    serviceId: string;
    serviceName: string;
    bookingKind: "appointment" | "package" | "stay";
    bookingsCount: number;
    stayRequests: number;
    quotedValueKobo: number;
    paidValueKobo: number;
  }>;
  recentActivity: Array<{
    id: string;
    createdAt: string;
    serviceName: string;
    clientName: string;
    clientEmail?: string | null;
    bookingKind: "appointment" | "package" | "stay";
    status: "pending" | "held" | "confirmed" | "cancelled" | "completed";
    paymentStatus: "pending" | "paid" | "failed" | "refunded";
    totalAmountKobo: number;
  }>;
  exportBookings: Array<{
    id: string;
    createdAt: string;
    serviceName: string;
    clientName: string;
    clientEmail?: string | null;
    appliedOption?: string | null;
    bookingKind: "appointment" | "package" | "stay";
    status: "pending" | "held" | "confirmed" | "cancelled" | "completed";
    paymentStatus: "pending" | "paid" | "failed" | "refunded";
    totalAmountKobo: number;
    paidAmountKobo: number;
    slotStartsAt?: string | null;
    slotEndsAt?: string | null;
    checkInDate?: string | null;
    checkOutDate?: string | null;
  }>;
};
