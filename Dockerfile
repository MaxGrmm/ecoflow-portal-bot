FROM mcr.microsoft.com/playwright:v1.58.2-jammy
ENV DEBIAN_FRONTEND=noninteractive

# Xvfb installieren
RUN apt-get update && \
    apt-get install -y xvfb net-tools && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .


CMD /bin/bash -c "\
    rm -f /tmp/.X99-lock && \
    Xvfb :99 -screen 0 1920x1080x24 & \
    node healthcheck.js & \
    node bot.js"
