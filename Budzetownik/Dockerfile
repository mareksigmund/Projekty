FROM php:8.2-fpm
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
# Zainstaluj potrzebne rozszerzenia
RUN docker-php-ext-install pdo pdo_mysql

WORKDIR /var/www
