export type BookingClientInput = {
  fullName: string;
  email: string;
  phone: string;
  notes?: string;
};

export type ReserveTimedBookingInput = {
  mode: "timed";
  serviceId: string;
  startsAt: string;
  endsAt: string;
  packageId?: string;
  client: BookingClientInput;
  quantity: number;
};

export type ReserveStayBookingInput = {
  mode: "stay";
  serviceId: string;
  checkInDate: string;
  checkOutDate: string;
  client: BookingClientInput;
  quantity: number;
};

export type ReserveBookingInput =
  | ReserveTimedBookingInput
  | ReserveStayBookingInput;
