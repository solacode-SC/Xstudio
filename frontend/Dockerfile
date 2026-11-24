FROM node:20-alpine

WORKDIR /app

ENV PORT=3001
ENV NEXT_TELEMETRY_DISABLED=1

# Used by next.config.js rewrites during `next build`
ARG BACKEND_ORIGIN
ENV BACKEND_ORIGIN=${BACKEND_ORIGIN}

COPY package*.json ./
RUN npm ci || npm install

COPY . .

RUN npm run build

EXPOSE 3001

CMD ["npm", "run", "start", "--", "-p", "3001", "-H", "0.0.0.0"]
