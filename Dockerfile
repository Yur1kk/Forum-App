FROM node:16-buster


WORKDIR /project


COPY package*.json ./


RUN npm install


COPY . .

RUN npm rebuild bcrypt --build-from-source


RUN npm run build


EXPOSE 3000


CMD ["node", "dist/src/main.js"]
