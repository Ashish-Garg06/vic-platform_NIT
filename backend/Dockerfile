FROM node:20-slim
WORKDIR /app
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm install --production
COPY . .
RUN node src/db/seed.js
EXPOSE 5000
CMD ["node","src/index.js"]
