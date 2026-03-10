# Use a slim Node image
FROM node:20-bullseye-slim

# Install system dependencies
RUN apt-get update && \
    apt-get install -y watchman git && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install -g expo-cli && npm install

# Copy source code
COPY . .

# Expose Expo ports
EXPOSE 8081 19000 19001 19002

# Start Expo dev server
CMD ["npx", "expo", "start", "--tunnel"]