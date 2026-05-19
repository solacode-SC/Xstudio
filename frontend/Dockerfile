FROM node:20-alpine

WORKDIR /app

ENV PORT=3001

# Used by next.config.js rewrites during `next build`.
ARG BACKEND_ORIGIN
ENV BACKEND_ORIGIN=${BACKEND_ORIGIN}

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
