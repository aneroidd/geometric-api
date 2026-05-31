FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001

# Jika API Anda biasa dijalankan dengan "npm run dev", ubah "start" menjadi "run", "dev"
CMD ["npm", "start"]