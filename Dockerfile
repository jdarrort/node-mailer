FROM node:10-alpine
RUN mkdir -p /opt/node_modules && chown -R node:node /opt
WORKDIR /opt
USER node
COPY --chown=node:node . .
RUN npm install

CMD [ "node", "index.js" ]

# docker build -t rws-mailer .  