# Deploying Your AI Recipe Universe Application

This guide provides step-by-step instructions on how to deploy your AI Recipe Universe application to the web. We will use Heroku as our primary example because it's a popular and straightforward platform for hosting this type of project.

## Prerequisites

Before you begin, make sure you have the following:

*   **A Git repository:** Your project should be a Git repository. If you haven't already, you can initialize one by running `git init` in your project's root directory.
*   **A Heroku Account:** You'll need a free Heroku account. You can sign up at [heroku.com](https://heroku.com).

## Local Setup for Deployment

To get your application ready for a production environment, we need to make two small additions to your project.

### 1. Add a Production Web Server

Your application uses Flask's built-in server, which is great for development but not suitable for production. We'll use **Gunicorn**, a robust and reliable web server, for the live application.

I have already added `gunicorn` to your `requirements.txt` file, so there's nothing you need to do for this step.

### 2. Create a `Procfile`

Hosting platforms like Heroku need to know how to run your application. A `Procfile` is a simple text file that provides this instruction.

I have already created a `Procfile` in your project with the following content:

```
web: gunicorn app:app
```

This command tells Heroku to start a web process by running your `app` (from `app.py`) using the `gunicorn` server.

## Step-by-Step Deployment to Heroku

Now that your project is configured for deployment, follow these steps to get it live on the web.

### Step 1: Install the Heroku CLI

The Heroku Command Line Interface (CLI) is a tool that allows you to manage your Heroku apps from your terminal. You can download and install it from the official Heroku website:

[**Download the Heroku CLI**](https://devcenter.heroku.com/articles/heroku-cli)

### Step 2: Log In to Heroku

Once the Heroku CLI is installed, open your terminal and log in to your Heroku account:

```bash
heroku login
```

This command will open a new browser window where you can enter your Heroku credentials.

### Step 3: Commit Your Changes

If you haven't already, make sure all your latest changes are committed to your Git repository:

```bash
git add .
git commit -m "Prepare for deployment"
```

### Step 4: Create a New Heroku App

Now, create a new application on Heroku. This is where your project will live.

```bash
heroku create your-unique-app-name
```

Replace `your-unique-app-name` with a name of your choice. This name must be unique across all of Heroku. If you don't provide a name, Heroku will generate a random one for you.

### Step 5: Set Your API Keys on Heroku

Your API keys are stored in `config.py`, which is not committed to your Git repository for security reasons. You need to set these keys as **environment variables** on Heroku.

1.  Go to your Heroku dashboard at [dashboard.heroku.com](https://dashboard.heroku.com).
2.  Click on your newly created application.
3.  Navigate to the **Settings** tab.
4.  Click on the **Reveal Config Vars** button.
5.  Here, you will add your API keys one by one. For each key, enter the name in the `KEY` field and the value in the `VALUE` field.

You need to add the following keys:

*   `GEMINI_API_KEY`
*   `GOOGLE_API_KEY`
*   `CUSTOM_SEARCH_ENGINE_ID_WEB`
*   `CUSTOM_SEARCH_ENGINE_ID_IMAGE`

**This is a critical step. Your application will not work without these keys.**

### Step 6: Deploy Your Application

You are now ready to deploy your code to Heroku. This is done with a simple `git push`:

```bash
git push heroku main
```

If you are using a different branch name (e.g., `master`), replace `main` with your branch name.

Heroku will now build and deploy your application. You will see the progress in your terminal.

## Post-Deployment

Once the deployment is complete, you can open your live application in your browser with the following command:

```bash
heroku open
```

Congratulations! Your AI Recipe Universe application is now live on the web.

## Other Hosting Options

While this guide focuses on Heroku, there are other great platforms for hosting Flask applications:

*   **Render:** Very similar to Heroku, with a simple and intuitive deployment process.
*   **DigitalOcean App Platform:** A flexible and powerful platform for deploying applications.
*   **AWS Elastic Beanstalk** and **Google App Engine:** More advanced options for applications that require high scalability and more configuration.

The general principles of using a production server, setting environment variables, and deploying from a Git repository apply to these platforms as well.
