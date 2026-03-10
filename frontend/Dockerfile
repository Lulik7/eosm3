FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

# Запускаем Vite с доступом извне контейнера
CMD ["npm", "run", "dev", "--", "--host"]