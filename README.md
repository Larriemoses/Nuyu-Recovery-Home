# 🌿 Nuyu Recovery Home — Booking & Operations System

A full-stack booking and operations platform for **Nuyu Recovery Home**, designed to streamline client appointments, automate scheduling, manage recovery stays, and provide real-time business insights.

---

## 🚀 Overview

Nuyu Recovery Home is a wellness and post-treatment care brand offering services such as:

* Lymphatic Drainage Massage
* Advanced Body Sculpting
* Recovery Home (Post-op stays)
* Brazilian / Full Body Waxing
* Laser Hair Removal
* Oxygen Healing Therapy
* Morpheus8 Treatment

This system provides a **modern, automated solution** for managing bookings, payments, and daily operations — reducing manual work and improving client experience.

---

## ✨ Features

### 🧑‍💻 Client Experience

* View all services with pricing and details
* Real-time availability (admin-controlled)
* Book appointments instantly
* Secure online payment (Paystack)
* Automatic booking confirmation
* Email notifications

---

### ⚙️ Admin Dashboard

* Manage services and pricing
* Control available dates and time slots
* Block/unblock schedules
* View all bookings and payment status
* Track client activity (new vs returning)
* Monitor revenue and performance

---

### 📊 Reporting & Analytics

* Daily, weekly, and monthly reports
* Total bookings and revenue
* Package sales insights
* Service performance metrics
* Client growth tracking

---

## 🧠 Core System Logic

### 📅 Availability System

* Admin defines available dates and time slots
* Clients can only book visible slots
* Prevents overbooking and scheduling conflicts

---

### ⏳ Slot Reservation (Concurrency Control)

* When a user selects a slot, it is **temporarily held (e.g. 10 minutes)**
* Prevents multiple users from booking the same time
* Slot is released if payment is not completed

---

### 💳 Payment Flow

1. Client selects a service and time slot
2. System reserves slot temporarily
3. Client proceeds to Paystack checkout
4. Payment is verified on backend
5. Booking is confirmed automatically

---

### 🏥 Service Types Supported

* **Appointment-based** (e.g. massages, waxing)
* **Package-based** (e.g. 5, 10, 15 sessions)
* **Stay-based** (Recovery Home: 5–21 days)

---

## 🏗️ Tech Stack

### Frontend

* React.js (TypeScript)
* Tailwind CSS

### Backend

* Supabase (PostgreSQL, Auth, Edge Functions)

### Payments

* Paystack

### Email

* Resend / Postmark

---

## 🔄 System Architecture

```txt
[ React Frontend ]
        ↓
[ Supabase API / Edge Functions ]
        ↓
[ PostgreSQL Database ]
        ↓
[ Paystack + Email Services ]
```

---

## 📦 Project Structure

```txt
src/
  components/
  pages/
  features/
  hooks/
  lib/
  types/
  utils/
```

---

## 🔐 Authentication

* Admin authentication via Supabase
* Role-based access control for dashboard
* Clients do not require login (MVP)

---

## ⚠️ Key Technical Challenges Solved

* Preventing double booking (slot locking)
* Handling concurrent users booking same time
* Payment verification & security
* Managing different booking types (appointment, package, stay)
* Real-time availability updates

---

## 📌 Future Improvements

* SMS / WhatsApp notifications
* Client login & booking history
* Automated reminders
* Multi-staff scheduling
* Multi-location support

---

## 📷 Screenshots (Coming Soon)

*Add screenshots of your UI here once built*

---

## 🤝 Contribution

This project is currently in active development. Contributions, ideas, and feedback are welcome.

---

## 📄 License

This project is proprietary to Nuyu Recovery Home.

---

## 👨‍💻 Author

Built by **Larrie Moses**
Full-stack Developer

---

## 💡 Final Note

This project demonstrates the design and implementation of a **real-world booking system with payment integration, scheduling logic, and business analytics** — similar to platforms like Fresha and Calendly, but tailored to a specialized wellness business.
