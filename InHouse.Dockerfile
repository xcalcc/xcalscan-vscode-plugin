FROM node:14

ENV WORK_DIR=/home/sdlc

RUN apt update && \
    apt install -y libsecret-1-dev && \
    mkdir -p $WORK_DIR

COPY . $WORK_DIR

RUN cd $WORK_DIR &&\
    npm i &&\
    npm install --unsafe-perm=true --allow-root vsce -g &&\
    rm README.md &&\
    touch README.md &&\
    vsce package

