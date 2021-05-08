FROM node:14-alpine
RUN mkdir -p /opt/node_modules && chown -R node:node /opt
WORKDIR /opt
USER node
COPY --chown=node:node . .
RUN npm install

ENV TZ /Europe/Paris

CMD [ "node", "index.js" ]

# docker build -t rws-mailer .  