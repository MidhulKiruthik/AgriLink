# AgriLink

## Deploying to AWS EC2 (Ubuntu)

This app has a Next.js frontend and an Express + MySQL backend. The backend listens on PORT (default 5000); the frontend is served by Next.js on port 3000. Next rewrites proxy /api/* and /uploads/* to the backend.

### 1) Provision EC2
- Ubuntu 22.04 or Amazon Linux 2023
- Inbound security group: TCP 22 (SSH), 80 (HTTP), 443 (HTTPS)

### 2) Install runtime
```
sudo apt-get update -y
sudo apt-get install -y nginx mysql-client
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm i -g pm2
```

### 3) Clone and configure
```
git clone <your-repo-url> /var/www/agrilink
cd /var/www/agrilink
cp .env.example .env
# edit .env to point to your RDS/DB and SECRET_KEY
pnpm i || npm i
```

### 4) Build Next and start services with PM2
```
npm run build
pm2 start ecosystem.config.js
pm2 save
```

### 5) Nginx reverse proxy to Next.js (port 3000)
Create /etc/nginx/sites-available/agrilink and symlink to sites-enabled.

```
server {
	listen 80;
	server_name _;
	client_max_body_size 20m;

	location / {
		proxy_pass http://127.0.0.1:3000;
		proxy_http_version 1.1;
		proxy_set_header Upgrade $http_upgrade;
		proxy_set_header Connection "upgrade";
		proxy_set_header Host $host;
		proxy_cache_bypass $http_upgrade;
	}
}
```

```
sudo ln -s /etc/nginx/sites-available/agrilink /etc/nginx/sites-enabled/agrilink
sudo nginx -t && sudo systemctl restart nginx
```

The backend is proxied by Next.js rewrites at /api/* and /uploads/*.

### Database
Use the schema in schema.sql to initialize your MySQL (RDS/Aurora/MySQL on EC2). Ensure your DB security group allows the EC2 instance to connect.

### Environment
See .env.example for required variables.


# AgriLink  
Agri E-Commerce  
---

# AgriLink - Connecting Farmers & Customers 🌱  

AgriLink is a next-generation **e-commerce platform** that bridges the gap between **farmers** and **customers**. This platform allows customers to directly buy fresh produce from local farmers, ensuring fair pricing and a transparent marketplace. Farmers get complete control over their pricing, while customers receive farm-fresh products straight from the source.  

---

## 🛠 Tech Stack  

- **Frontend:** Next.js (React)  
- **Backend:** Node.js with Express  
- **Database:** MySQL  
- **Styling:** Tailwind CSS  
- **Authentication:** JWT-based user authentication  

---

## 🚀 Features  

✅ **User Authentication**: Customers and farmers can sign up and log in securely.  
✅ **Product Listings**: Farmers can list their products with images, descriptions, and pricing.  
✅ **Search & Filters**: Users can search for specific products.  
✅ **Cart System**: Customers can add products to their cart and place orders.  

✅ **Order Management**: Farmers can track orders placed by customers.  

✅ **Invoice Generation**: Users can successfully generate the invoice.  

✅ **Fair Pricing**: Farmers decide their product pricing without intermediaries.  

---

## 🖼 Screenshots  


![image](https://github.com/user-attachments/assets/917b2fd3-ccd7-4349-969e-0b3473e70470)
![image](https://github.com/user-attachments/assets/ef0c3677-2abd-40f3-ac80-76774c34a64b)
*AgriLink Homepage*

![image](https://github.com/user-attachments/assets/792dab09-26d2-41ed-92ab-7c8296265535)
![image](https://github.com/user-attachments/assets/8ce6f20e-84b0-4b7e-b37b-cb151328197b)
*AgriLink Signup and Loginpage*

![image](https://github.com/user-attachments/assets/2ed14d3d-f529-445b-a0a4-7565bf907ae1)
![image](https://github.com/user-attachments/assets/1884b3bc-5444-4a75-907f-cd8e9607f5fb)

*AgriLink Productspage*

![image](https://github.com/user-attachments/assets/12ad327f-0a12-413d-b290-85bf29106af6)

*AgriLink Cart Page - Showing Added Items*
![image](https://github.com/user-attachments/assets/de53b94a-66f4-4f83-8dc4-7490f5d5728c)
*AgriLink Orderspage*
![image](https://github.com/user-attachments/assets/5b31472d-7edb-4d5c-ad3d-3fe0177f916f)
 ![image](https://github.com/user-attachments/assets/6c592162-4e4e-46fb-8164-901d142cfef4)

*AgriLink Payment Confirmation,Invoice generation*
![image](https://github.com/user-attachments/assets/82b5a206-7e43-4602-a5be-a103b4b43a17)
*Agrilink farmers products selling page*
![image](https://github.com/user-attachments/assets/c2b63fd6-27f0-4e95-9f77-9ddbbb55c311)
*AgriLink Profilepage*
---

## 🏗 Setting Up the Project  

### 1️⃣ Clone the Repository  
```bash
git clone https://github.com/MidhulKiruthik/AgriLink.git
cd agrilink
```

### 2️⃣ Install Dependencies  
```bash
npm install
```

### 3️⃣ Set Up the Database  
- Install MySQL and create a database named **agrilink**  
- Import the SQL schema (`schema.sql`)  

### 4️⃣ Start the Backend Server  
```bash
node server.js
```

### 5️⃣ Start the Frontend  
```bash
npm run dev
```

The app should now be running at **http://localhost:3000** 🎉  

---

## 🛒 User Guide  

### **Sign Up & Login**  
- Customers and farmers can sign up using **Name, Email, Phone Number, and Password**  
- After signing up, login requires only **Email & Password**  

### **Adding Products (For Farmers)**  
- Farmers can list their products with a name, price, and description  
- Products will be visible to customers in the store  

### **Ordering Products**  
- Customers can add items to their cart and place an order  
- Orders are stored in the database and visible in the **Orders** page

### **Payment**  
- Users can pay through cards and download their invoice

---

## 🏗 Future Improvements  
🔹 Farmer Dashboard with Sales Reports  
🔹 Delivery Tracking System  

---

## 📝 Contributing  
If you'd like to contribute, feel free to fork this repo and submit a pull request!  

---
