# City Control Service Desk - Backend API

A robust incident management and technical support backend system built with Node.js (Express), MongoDB, and Redis.

## 🚀 Key Features
- **Role-Based Access Control (RBAC)**: Distinct permissions for Administrator, Support, and User roles.
- **Advanced Security**: JWT authentication via `httpOnly` cookies, token rotation, and Redis-based blacklisting.
- **Incident Management**: Automated ID generation (e.g., INC-000001), status tracking, and priority levels.
- **Service Desk Dashboard**: Kanban-ready ticket system with audit logs (status history) and internal/public comments.

---

## 🛠 Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Caching/Security**: Redis (Refresh token JTI blacklisting)
- **Authentication**: JWT (Access & Refresh token flow)
- **Validation**: Joi / Express-validator

---

## 🏗 System Architecture



### Authentication Flow
1. **Login**: Server issues two tokens delivered via `httpOnly` cookies.
2. **Refresh Token Rotation**: Upon session renewal, the old token's `jti` is added to the Redis blacklist, and a new pair is issued.
3. **Security Layers**: Built-in protection against CSRF (`SameSite: Strict`) and XSS (`HttpOnly`).

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- Node.js v16+
- MongoDB (Local or Atlas)
- Redis server

### 2. Clone & Install
```bash
git clone [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git)
cd service-desk-backend
npm install