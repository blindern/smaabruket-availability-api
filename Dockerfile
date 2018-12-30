FROM node:11-alpine

COPY package.json /app/

RUN set -eux; \
    cd /app; \
    npm ci

COPY . /app

EXPOSE 8000

WORKDIR /app
CMD ["npm", "run", "serve"]
