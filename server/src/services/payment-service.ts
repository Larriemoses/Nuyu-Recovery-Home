import { env } from "../config/env.js";

class PaymentService {
  async verifyPayment(reference: string) {
    return {
      reference,
      provider: "paystack",
      verified: false,
      integrationMode: env.PAYSTACK_SECRET_KEY ? "credentials-present" : "not-configured",
      message:
        "Payment verification is scaffolded here. Add the live Paystack verification request and update the associated booking once your keys are in place.",
    };
  }
}

export const paymentService = new PaymentService();
