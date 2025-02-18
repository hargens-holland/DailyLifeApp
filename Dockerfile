FROM node:14

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

# Copy backend files
COPY app.js ./

# Ensure public directory exists and copy frontend files
RUN mkdir -p public
COPY public/ public/

EXPOSE 3000

CMD ["node", "app.js"]

