<div align="center">

# 🎓 College Event Hub

### An AI-powered campus event management platform

*Helping students discover relevant events, organizers manage registrations efficiently, and colleges build stronger campus communities.*

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap_5-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)
![OpenRouter](https://img.shields.io/badge/OpenRouter-412991?style=for-the-badge&logo=openai&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)

</div>

---

## 🚀 Overview

College Event Hub is a full-stack web application designed to **centralize event management** within a college campus. Students can discover events, receive personalized recommendations, register instantly, track upcoming activities, and provide feedback after attending.

The platform combines traditional event management with **AI-powered capabilities** — smart recommendations, automatic categorization, content generation, and review summarization — to create a truly modern campus experience.

---

## ✨ Key Features

### 🔐 Authentication & Authorization
- Secure user registration and login via **Passport.js** (Local Strategy & Google OAuth 2.0)
- Role-based access control: **Student**, **Organizer**, **Admin**
- Protected routes and session management

### 📅 Event Management
- **Organizers can**: Create, edit, and delete events, upload poster images directly to **Cloudinary**, track attendee registrations, and manage check-in lists.
- **Students can**: Browse, search, filter upcoming/completed events, wishlist/save events, and submit reviews/ratings post-attendance.

### 🔍 Advanced Event Discovery
- Search events by title, venue, or summary keywords.
- Dynamic filters: Category (Workshop, Hackathon, Seminar, Cultural, Sports), Date (Upcoming, This Week, This Month), Price (Free/Paid), Registration Status, and Popularity.

### 🎟️ Registration & Waitlist System
- One-click registration with credit card visual simulation for paid events.
- **Auto-Waitlist**: Automatically waitlists students when event capacity is full.
- **Auto-Promotion**: Instantly promotes the next waitlisted student to active registration and triggers confirmation emails if someone cancels.

### 🧠 AI-Powered Features (via OpenRouter Free Router)
- **Description Generator**: Auto-generates professional event outlines based on simple title and bullet notes.
- **Smart Categorizer**: Classifies category type and recommends tags dynamically with backend JSON schema verification.
- **Review Summarizer**: Consolidates attendee reviews into a concise feedback report for event hosts.
- **Recommendation Engine**: Custom matching algorithm surfaces relevant upcoming events on dashboards based on user interest profiles and historic participation.

### 📅 Calendar Integration (.ics)
- Export event details directly to Google Calendar or download standard `.ics` invitation files (fully compatible with Apple Calendar and Outlook).

### 📧 Email Notification System
- Nodemailer SMTP setup sending automated emails for registrations, waitlist updates, promotions, and password resets.

### 📍 Venue Location Maps
- Interactive dark-theme geocoding maps. Resolves input addresses to coordinates automatically on the backend using the Nominatim API, rendering interactive markers via Leaflet maps.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | EJS (Embedded JavaScript), Bootstrap 5, Custom CSS, JS |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB, Mongoose ODM |
| **Authentication** | Passport.js, Express Session |
| **Security & Validation** | Joi Validation, Helmet, Express Sanitizer |
| **File Storage** | Cloudinary CDN, Multer |
| **AI Services** | OpenRouter Free Router (google/gemini/llama/gemma) |
| **Maps** | Leaflet.js, OpenStreetMap Nominatim API |
| **Email** | Nodemailer |
| **Calendar** | ical-generator |
| **Export** | SheetJS (xlsx) |

---

## 🏗️ System Architecture

```
Student / Organizer / Admin
            │
            ▼
     Frontend (EJS + JS)
            │
            ▼
      Express.js API
            │
     ┌──────┼──────┐
     ▼      ▼      ▼
  MongoDB  AI API  Cloudinary
            │
            ▼
    Recommendation Engine
```

---

## 📂 Project Structure

```
college-event-hub/
│
├── controllers/          # Route handlers and business logic
├── middleware/           # Auth guards, Joi validation, error handling
├── models/              # Mongoose schemas (User, Event, Registration, Review)
├── routes/              # Express route definitions
├── services/
│   ├── ai/             # OpenRouter description generator, categorizer, summarizer
│   ├── recommendation/ # Personalized interest-based matching engine
│   ├── email/          # Nodemailer templates and triggers
│   └── map/            # Nominatim geocoding service
├── public/              # Static assets (CSS, JS, images, uploads)
├── views/               # EJS template views
├── utils/               # Database seeding and catches
├── app.js               # App entry point
└── package.json
```

---

## 🚀 Getting Started

### 📋 Prerequisites
- Node.js (>=24.0.0)
- MongoDB installed locally (or MongoDB Atlas connection URI)

### ⚙️ Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/BalakaLaluthVardhan/EventHub.git
   cd EventHub
   ```
2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Set up environment variables:
   Create a `.env` file in the root directory based on the `.env.example` file.
4. Seed the database with mock test data:
   ```bash
   npm run seed
   ```
5. Start the local server:
   ```bash
   npm start
   ```
   Open `http://localhost:3000` in your web browser.

---

## 👨‍💻 Developed By

**Laluth Vardhan Balaka**

B.Tech CSE · Full-Stack Developer · Problem Solver

*Building technology that enhances student experiences and campus communities.*
