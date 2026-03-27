FROM node:18

WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm install

# Copy code
COPY . .

# Generate Prisma
RUN npx prisma generate

# Build NestJS
RUN npm run build

# Expose port
EXPOSE 5000

# Run production build
CMD ["node", "dist/main.js"]