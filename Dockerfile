FROM node:14

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the application
COPY . .

# Create public directory
RUN mkdir -p public

# Set correct permissions
RUN chown -R node:node /usr/src/app

# Switch to non-root user
USER node

# Expose ports
EXPOSE 3000
EXPOSE 80

CMD ["node", "app.js"]