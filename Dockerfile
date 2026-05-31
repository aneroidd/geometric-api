FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001

# Jika API Anda biasa dijalankan dengan "npm run dev", ubah "start" menjadi "run", "dev"
CMD ["npm", "start"]