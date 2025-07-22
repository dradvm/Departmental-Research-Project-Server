# Base image
FROM node:18

# Tạo thư mục làm việc
WORKDIR /app

# Copy package.json và package-lock.json trước để tối ưu cache
COPY package*.json ./

# Cài đặt các phụ thuộc
RUN npm install

# Copy toàn bộ project vào image
COPY . .

# Generate Prisma client
RUN npm run prisma:pull
RUN npm run prisma:generate

# Nếu cần biến môi trường
ENV PORT=3001

# Mở cổng 3001 (giúp render hiểu container này dùng port gì)
EXPOSE 3001

# Lệnh chạy ứng dụng
CMD ["node", "dist/main.js"]
