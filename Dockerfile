FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Ganti EXPOSE 3001 menjadi EXPOSE 8080
EXPOSE 8080
CMD ["npm", "start"]