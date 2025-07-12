<p align="center">
  <img src="https://dynamic.design.com/preview/logodraft/bb381381-8c37-418c-8694-71a77e118b76/image/large.png" alt="ReWear Logo" width="80"/>
</p>

<h1 align="center">♻ ReWear – Community Clothing Exchange</h1>

<p align="center">
  <i>Promoting sustainable fashion through clothing swaps and redemptions</i>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Active-brightgreen?style=flat-square"/>
  <img src="https://img.shields.io/badge/Backend-Flask-blue?style=flat-square&logo=python"/>
  <img src="https://img.shields.io/badge/Frontend-React-blue?style=flat-square&logo=react"/>
  <img src="https://img.shields.io/badge/Database-MongoDB-green?style=flat-square&logo=mongodb"/>
  <img src="https://img.shields.io/badge/Hosted%20On-Render%20&%20Vercel-black?style=flat-square&logo=vercel"/>
</p>

---
# 👚 ReWear – Community Clothing Exchange

> A web-based platform that encourages sustainable fashion by allowing users to swap or redeem unused clothing items through a point-based system.

---

## 🌿 Overview

*ReWear* is designed to reduce textile waste by giving garments a second life. It provides users a friendly platform to:
- Upload and list wearable clothing
- Swap clothes directly with other users
- Redeem clothing using a point-based system
- Encourage a circular fashion economy

---

## ✨ Features

### 👥 User Features
- *Authentication*: Email and password signup/login
- *Add New Items*: Upload images, specify details like type, size, condition, and tags
- *Item Browse & Search*: Explore approved items
- *Swap or Redeem*: Request swaps or use earned points to redeem clothes
- *Dashboard*: Track uploaded items, ongoing and past swaps, and point balance

### 🛡 Admin Features
- Moderate pending item listings
- Approve or reject user submissions
- Remove spam or inappropriate content

---

## 🛠 Tech Stack

### Frontend:
- React.js
- Tailwind CSS
- Swiper.js (for carousel)

### Backend:
- Python Flask
- Flask-JWT-Extended (Auth)
- Flask-CORS
- PyMongo (MongoDB)
- Bcrypt (Password Hashing)

### Other:
- MongoDB Atlas (Cloud DB)
- Cloudinary (Image Storage)
- Render / Railway (Deployment)

---

## 🚀 Project Setup

### Backend:
```bash
cd server
pip install -r requirements.txt
python run.py
