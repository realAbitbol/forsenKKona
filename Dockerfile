FROM node:alpine
LABEL maintainer="nobody@nobody.org"

LABEL org.label-schema.name="damastah/forsenKKona"
LABEL org.label-schema.description="The forsenKKona Twitch bot 🦅 🇺🇸"

EXPOSE 3000

WORKDIR /app
# Copy package.json, package-lock.json, and other project files
COPY package*.json ./
RUN npm install
# Copy the rest the code
COPY . .
# Set entry point for the container (runs npm start command)
CMD ["npm", "start"]
