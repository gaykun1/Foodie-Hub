# 🍔 FoodieHub — Food Delivery Service

FoodieHub is a web application for online food ordering with a shopping cart, order management, and Stripe payment integration.  
This project was built to practice full-stack development: from frontend UI to backend APIs and secure payments.

---

## 🚀 Live Demo
[👉 View Live Demo](https://foodie-hub-9n96.vercel.app/)  


---

## 📌 API Documentation
The backend API is available under `/api`.  
Example endpoints:
- `POST /api/auth/login` — User login  
- `GET /api/order/orders` — Fetch user orders  
- `POST /api/order/orders` — Create a new order  
- `POST /api/payment/payment-intent` — Initiate Stripe payment  

---

## 🧪 Tests
- **Unit & Integration**: covered with **Jest**  
- **End-to-End (E2E)**: main user flows covered with **Playwright**  
  - User login  
  - Adding meals to cart  
  - Placing and paying for an order  

Run tests:
```bash
Frontend
npm run test        # unit & integration tests (Jest)
npx playwright test    # e2e tests (Playwright)
Backend
npm run test        # unit & integration tests (Jest & Supertest)

