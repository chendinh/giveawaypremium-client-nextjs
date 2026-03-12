# ===== Stage 1: Build app =====
FROM node:20-alpine AS builder

# Tạo thư mục làm việc
WORKDIR /app

# Copy file cấu hình và package
COPY package*.json ./

# Cài dependencies
RUN npm ci --silent

# Copy toàn bộ mã nguồn
COPY . .

# Build Next.js (tạo .next hoặc dist nếu bạn dùng distDir)
RUN npm run build


# ===== Stage 2: Run app (standalone mode) =====
FROM node:20-alpine AS runner

WORKDIR /app

# Copy output standalone + static + public
# Nếu bạn có `output: 'standalone'` trong next.config.mjs thì Next.js tạo thư mục này
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
RUN echo "Hello World" > ./public/hello.txt

# Thiết lập môi trường
ENV NODE_ENV=development
ENV PORT=3000

# Mở cổng ứng dụng
EXPOSE 3000

# Lệnh chạy server standalone
CMD ["node", "server.js"]
