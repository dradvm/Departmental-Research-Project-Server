# Base image
FROM node:18

# Tạo thư mục làm việc
WORKDIR /app

# Copy các file cần thiết để cài trước dependencies (tối ưu cache)
COPY package*.json ./

# Cài đặt dependencies
RUN npm install

# Copy toàn bộ mã nguồn
COPY . .

# Tạo Prisma Client (cần có trước khi build)
RUN npm run prisma:generate

# Build NestJS
RUN npm run build

# Mở port cho Render (Render sẽ tự set biến môi trường PORT)
ENV PORT=3001

# Command khi container khởi chạy
CMD ["npm", "run", "start:prod"]
