FROM mcr.microsoft.com/playwright:v1.61.0-noble

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx playwright install

RUN apt-get update && apt-get install -y \
  fonts-noto-core \
  fonts-noto-extra \
  && rm -rf /var/lib/apt/lists/* \
  && fc-cache -fv

CMD ["npx", "playwright", "test"]