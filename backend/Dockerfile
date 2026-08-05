FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json ./
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader --no-scripts
FROM php:8.4-cli-alpine
RUN apk add --no-cache libpq-dev icu-dev oniguruma-dev && docker-php-ext-install pdo_pgsql intl mbstring
WORKDIR /var/www/html
COPY --from=vendor /app/vendor ./vendor
COPY . .
RUN mkdir -p storage/framework/{cache,sessions,views} storage/logs bootstrap/cache && chmod -R 775 storage bootstrap/cache
EXPOSE 8080
CMD php artisan migrate --force && php artisan db:seed --force && php artisan serve --host=0.0.0.0 --port=${PORT:-8080}
