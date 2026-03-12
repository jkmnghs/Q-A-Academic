FROM node:18-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy client and server package files
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install all dependencies
RUN npm run install:all

# Copy source code
COPY . .

# Build the React client
RUN npm run build

# Expose port
EXPOSE 3001

# Start the server
CMD ["npm", "start"]
