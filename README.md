Project Setup and Development Guide
This document provides the necessary steps to set up and run the development environment for this project. It is important to follow the sequence of commands to avoid potential issues.

Prerequisites
Before you begin, ensure you have the following installed on your system:

PHP (version 8.2 or newer)

Composer

Node.js and NPM

A database server (e.g., MySQL)

Running the Development Environment
To run the full application, you will need to open four (4) separate terminal windows or tabs. Each terminal will run a persistent process required for the application to function correctly.

1. Resetting the Database (migrate:fresh --seed)
This command is used to initialize or reset your local database.

What it does:

migrate:fresh: This part of the command drops all existing tables from your database and rebuilds them from scratch based on your migration files.

--seed: After rebuilding the tables, this flag populates the database with initial data (such as default users, roles, etc.) defined in your seeder files.

When to use it:

When setting up the project for the first time.

After making changes to your migration files (e.g., adding a new column) that need to be applied.

When you want to completely reset all data in your database back to its initial state.

How to use:
In your terminal, run the following command. This is typically done only once during setup or when a database reset is needed.

php artisan migrate:fresh --seed

Note: This command will permanently delete all data in your database. Use it with caution.

2. Running the Backend Server (serve)
This command starts the primary web server for your Laravel application.

What it does:

It serves your Laravel application on a local development server, typically available at http://127.0.0.1:8000.

How to use:
In a new terminal, run:

php artisan serve

Leave this terminal running while you are developing.

3. Running the Frontend Server (npm run dev)
This command starts the server for your frontend assets (React, Vue, CSS).

What it does:

It uses Vite to compile your JavaScript and CSS files on the fly.

It enables Hot Module Replacement (HMR), which automatically refreshes your browser when you make changes to your frontend code, providing a seamless development experience.

How to use:
In a new terminal, run:

npm run dev

Leave this terminal running alongside php artisan serve.

4. Running the Real-time Server (reverb:start)
This is your WebSocket server, responsible for all real-time communication.

What it does:

It starts the Laravel Reverb server, which allows your application to send and receive messages in real-time without requiring a page refresh. This is essential for features like live notifications and chats.

How to use:
In a new terminal, run:

php artisan reverb:start

This must be kept running for any real-time features to work.

5. Running the Queue Worker (queue:work)
This process handles background tasks, including broadcasting real-time events.

What it does:

It listens for any "jobs" that are dispatched to the queue. In this application, when a new document is requested or a status is updated, a broadcasting job is created. The queue worker picks up this job and processes it, which allows Reverb to broadcast the event.

When to use it:

It is always required when using real-time events to ensure they are processed and broadcasted.

How to use:
In a new terminal, run:

php artisan queue:work

Leave this terminal running. You will see output here whenever a background job is processed.

Summary
For a complete development setup, you should have four terminals running simultaneously with the following commands:

Terminal 1: php artisan serve

Terminal 2: npm run dev

Terminal 3: php artisan reverb:start

Terminal 4: php artisan queue:work