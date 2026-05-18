#!/bin/bash

if [ ! -d "vendor" ]; then
    composer install --no-interaction --optimize-autoloader
fi

if [ ! -f ".env" ]; then
    cp .env.example .env
    php artisan key:generate
fi

chown -R www-data:www-data storage bootstrap/cache
chmod -R 777 storage bootstrap/cache

php artisan migrate --force

exec "$@"