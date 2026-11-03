# Build the React client
FROM node:20-alpine AS client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Run the API and serve the built client
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev
COPY server/ ./server/
COPY --from=client /app/client/dist ./client/dist
EXPOSE 5000
CMD ["node", "server/src/server.js"]
