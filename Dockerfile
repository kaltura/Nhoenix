ARG NODE_VERSION=10
FROM node:${NODE_VERSION} as builder

RUN npm install --global mocha

ADD . .

RUN npm install

CMD npm test