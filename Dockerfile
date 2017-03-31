FROM resin/raspberry-pi2-alpine-node:slim
WORKDIR /usr/src/app
COPY . .
RUN npm install
CMD ["npm", "start"]