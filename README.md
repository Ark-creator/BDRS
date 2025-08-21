# Barangay Document Request System (BDRS)
<p style="color: gray; margin: -20px 0 38px; font-style: italic"> A streamlined, real-time solution for managing and processing resident document requests. </p>

| ROLES | MEMBERS |
| :--- | :--- |
| **LEAD DEVELOPER / PROJECT MANAGER** | JOHN MICHAEL JONATAS |
| **UI/UX DESIGNER** | TEAM MEMBER 2 |
| **BACKEND DEVELOPER** | TEAM MEMBER 3 |
| **QA / TESTER** | TEAM MEMBER 4 |
---
---

# How to Run the Project

Follow these steps to get the development environment up and running.

1.  **Install Dependencies**
    Run composer to install the required PHP packages.
    ```bash
    composer install
    ```

2.  **Setup Environment File**
    Copy the `.env.example` file to a new file named `.env`.
    ```bash
    cp .env.example .env
    ```
    Then, generate an application key:
    ```bash
    php artisan key:generate
    ```
    Finally, update your `.env` file with your database credentials (DB_DATABASE, DB_USERNAME, DB_PASSWORD).

3.  **Reset and Seed the Database**
    This command will build your database schema and populate it with initial data.
    ```bash
    php artisan migrate:fresh --seed
    ```
    **Note:** This command will permanently delete all data in your database.

4.  **Run the Development Servers**
    For the application to be fully functional, you must run four commands in **four separate terminal windows**.

    * **Terminal 1: Start the Backend Server**
        ```bash
        php artisan serve
        ```

    * **Terminal 2: Start the Frontend Server**
        ```bash
        npm run dev
        ```

    * **Terminal 3: Start the Real-time Server**
        ```bash
        php artisan reverb:start
        ```

    * **Terminal 4: Start the Queue Worker**
        ```bash
        php artisan queue:work
        ```

Once all four servers are running, the application will be available at `http://127.0.0.1:8000`.