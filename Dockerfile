FROM node:10-slim
COPY ./ /app
WORKDIR /app
RUN npm install && npm run build-app

FROM nginx:alpine
RUN mkdir /app
COPY --from=0 /app/dist-app /app
COPY nginx.conf /etc/nginx/nginx.conf
