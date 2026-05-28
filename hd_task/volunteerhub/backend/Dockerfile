FROM node:20-alpine
ARG PORT
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY . .
EXPOSE ${PORT}
ENTRYPOINT ["sh", "docker-entrypoint.sh"]
