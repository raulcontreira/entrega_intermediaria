FROM mcr.microsoft.com/playwright:v1.46.0-jammy

WORKDIR /app
COPY package*.json ./
RUN npm ci --silent

RUN npx playwright install --with-deps chromium

COPY . .
RUN node scripts/build-extension.mjs

CMD ["npm","test"]

