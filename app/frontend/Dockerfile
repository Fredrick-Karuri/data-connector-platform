FROM node:20-alpine AS base

WORKDIR /app

COPY app/frontend/package*.json ./
RUN npm install

COPY app/frontend/ .

EXPOSE 3000

CMD ["npm", "run", "dev"]
