FROM node:20-alpine
WORKDIR /usr/src/app
COPY package*.json tsconfig*.json nest-cli.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]