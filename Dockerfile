FROM node:18-alpine

WORKDIR /app

# Install server dependencies
COPY server/package*.json ./server/
RUN npm install --prefix server

# Install client dependencies (explicitly not production so vite is included)
COPY client/package*.json ./client/
RUN npm install --prefix client

# Copy all source code
COPY . .

# Build the React client
RUN npm run --prefix client build

# Expose port
EXPOSE 3001

# Start the server
CMD ["node", "server/index.js"]
