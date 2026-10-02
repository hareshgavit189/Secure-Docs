FROM node:20-alpine

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source code
COPY . .

# Expose backend API port
EXPOSE 5001

ENV NODE_ENV=production
ENV PORT=5001

CMD ["node", "src/server.js"]
