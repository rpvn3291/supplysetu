Supply Setu - Feature & Architecture Blueprint

1. Core Philosophy

A "Hyper-local B2B Supply Chain" platform focusing on Speed, Reliability, and Digital Trust.

Vendor App (Mobile & Web): For street food vendors to source supplies instantly with verified origins.

Supplier Portal (Web Only): For wholesalers to manage high-volume orders, inventory, and their on-chain reputation.

2. Microservices Architecture

Auth Service: Handles JWT-based security, roles, and profiles (PostgreSQL).

Product Service: Manages catalog and real-time pricing (MongoDB).

Order Service: Tracks lifecycle from 'PENDING' to 'DELIVERED' (PostgreSQL).

Cart Service: High-speed persistent shopping carts (Redis).

Reviews Service: Manages feedback and triggers blockchain recording (MongoDB).

Community/Market Service: Real-time chat, bidding, and bulk orders (Socket.io).

Blockchain Service (Hardhat): Private Ethereum network for immutable data storage.

Messaging (RabbitMQ): The glue between services (e.g., order.created -> Stock update; review.created -> Blockchain sync).

3. Vendor Mobile App Features (React Native)

Secure Authentication: Persistent login with expo-secure-store.

Live Market: Browse products with trust signals (Verified Badge, Quality Rating).

Atomic Cart: Manage quantities and calculate totals in real-time.

Order History: Detailed logs with status badges and timeline tracking.

Product Traceability: View the "Origin Story" of products, verified by blockchain batch records.

Conditional Tracking: Live GPS tracking unlocks only when status is COLLECTED.

4. Supplier Web Portal Features (Next.js)

Supplier Dashboard: Analytics and business health metrics.

Order Feed: Manage PENDING requests, accept orders (CONFIRMED), and dispatch.

Inventory Control: Add batches to the blockchain for traceability upon creation.

Reputation Management: View immutable star ratings synced from the blockchain.

5. The "Zepto" Logic (Inventory & Tracking)

Instant Deduction: Stock is subtracted immediately upon order placement via RabbitMQ to prevent "Ghost Orders."

Collection Gate: Tracking is restricted until physical collection. This prevents vendor anxiety and ensures the map is only active when supplies are moving.

6. Blockchain & Trust Layer

Immutable Reviews: Feedback is stored on a Solidity Smart Contract (Reviews.sol). Once a vendor reviews an order, the record is permanent and cannot be deleted or forged.

Product Traceability: Every new product batch triggers a product.created event, which the Blockchain service uses to create a "Digital Birth Certificate" (Traceability.sol).

Seamless UX: Users interact with standard web/mobile forms while the backend "Admin Wallet" handles gas fees and blockchain transactions automatically.

7. Security & Networking

API Gateway: Next.js routes protect internal microservice ports (3001-3006).

RBAC: isVendor and isSupplier middlewares ensure data isolation.

Local IP Binding: Configured for physical device testing via 192.168.x.x network.