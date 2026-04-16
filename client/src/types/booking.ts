export type BookingKind = "appointment" | "package" | "stay";

export type BookingStatus =
  | "pending"
  | "held"
  | "confirmed"
  | "cancelled"
  | "completed";

export type ServicePackage = {
  id?: string;
  label: string;
  sessionsCount: number;
  packagePriceKobo: number;
};

export type ServiceCatalogItem = {
  id?: string;
  slug: string;
  name: string;
  summary: string;
  bookingKind: BookingKind;
  basePriceKobo: number;
  durationMinutes?: number;
  sessionsCount?: number;
  minStayDays?: number;
  maxStayDays?: number;
  packages?: ServicePackage[];
  sortOrder?: number;
};

export type ReserveSlotPayload = {
  mode: "timed" | "stay";
  serviceId: string;
  client: {
    fullName: string;
    email: string;
    phone: string;
    notes?: string;
  };
  quantity?: number;
  startsAt?: string;
  endsAt?: string;
  packageId?: string;
  checkInDate?: string;
  checkOutDate?: string;
};

export type ReserveSlotResponse = {
  bookingId: string;
  holdId?: string;
  expiresAt?: string;
  status: "pending" | "held";
  integrationMode: string;
  serviceName?: string;
  amountKobo?: number;
  mode?: "timed" | "stay";
  nextStep?: string;
  message?: string;
};

export type ServiceCatalogSource = "supabase" | "fallback";

export type ServiceCatalogState = {
  services: ServiceCatalogItem[];
  source: ServiceCatalogSource;
  isLoading: boolean;
  errorMessage?: string;
};

export type AvailabilitySlot = {
  startsAt: string;
  endsAt: string;
  label: string;
};

export type AvailabilityResponse = {
  serviceId: string;
  date: string;
  timezone: string;
  slots: AvailabilitySlot[];
};

export type AdminOverviewResponse = {
  setup: {
    supabaseConfigured: boolean;
    paystackConfigured: boolean;
    emailConfigured: boolean;
  };
  metrics: {
    servicesCount: number;
    activeServicesCount: number;
    totalBookings: number;
    pendingBookings: number;
    heldBookings: number;
    activeHolds: number;
    totalRevenueKobo: number;
  };
  recentBookings: Array<{
    id: string;
    serviceName: string;
    clientName: string;
    clientEmail?: string | null;
    bookingKind: BookingKind;
    status: BookingStatus | "held";
    paymentStatus: "pending" | "paid" | "failed" | "refunded";
    totalAmountKobo: number;
    slotStartsAt?: string | null;
    slotEndsAt?: string | null;
    checkInDate?: string | null;
    checkOutDate?: string | null;
    createdAt: string;
  }>;
  activeHolds: Array<{
    id: string;
    bookingId?: string | null;
    serviceName: string;
    clientEmail: string;
    startsAt: string;
    endsAt: string;
    expiresAt: string;
  }>;
  servicePerformance: Array<{
    serviceId: string;
    serviceName: string;
    bookingKind: BookingKind;
    bookingsCount: number;
    heldCount: number;
    pendingCount: number;
    estimatedValueKobo: number;
  }>;
};
