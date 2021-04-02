FROM node:14

ENV PORT 5000

COPY package*.json .

RUN npm install
RUN npm run build

CMD ["npm","start"]

EXPOSE ${PORT}