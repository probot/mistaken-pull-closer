# Deploying

If you would like to run your own instance of this app, see the [docs for deployment](https://probot.github.io/docs/deployment/).

This app requires these **Permissions & events** for the GitHub App:

- Organization members - **Read only**
- Pull Requests - **Read and Write**
  - [x] Check the box for **Pull request** events
- Repository metadata - **Read only**
- Single File - **Read only**
  - Path: `.github/mistaken-pull-closer.yml`
