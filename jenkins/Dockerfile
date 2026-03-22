FROM jenkins/jenkins:lts

USER root

# Установка Node.js, Java и зависимостей
RUN apt-get update && apt-get install -y \
    nodejs \
    npm \
    openjdk-17-jdk \
    curl \
    wget \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Установка Allure
RUN wget https://github.com/allure-framework/allure2/releases/download/2.24.1/allure-2.24.1.tgz \
    && tar -zxvf allure-2.24.1.tgz -C /opt/ \
    && ln -s /opt/allure-2.24.1/bin/allure /usr/bin/allure \
    && rm allure-2.24.1.tgz

# Установка плагинов Jenkins
RUN jenkins-plugin-cli --plugins \
    allure-jenkins-plugin:latest \
    git:latest \
    github:latest \
    workflow-aggregator:latest \
    blue-ocean:latest \
    nodejs:latest

USER jenkins