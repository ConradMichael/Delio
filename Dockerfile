FROM mhart/alpine-node:16.4 as first_build

COPY src src
COPY package.json package.json
COPY tsconfig.json tsconfig.json

RUN npm install
RUN npm run build

FROM first_build as second_build

COPY config config
COPY --from=first_build node_modules node_modules
COPY --from=first_build build build

CMD ["npm", "run", "start"]
