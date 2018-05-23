# mistaken-pull-closer

> a GitHub App built with [probot](https://github.com/probot/probot) that automatically closes pull requests that are commonly mistakes.

## Setup

```
# Install dependencies
npm install

# Run the bot
npm start
```

See [docs/deploy.md](docs/deploy.md) if you would like to run your own instance of this app.

## Configuration

You can specify a configuration by adding a file to your repo named
`.github/mistaken-pull-closer.yml`.  Example:
```
# The message to post to the closed PR.
commentBody: |
  You are a developer star
  Who will probably go quite far,
    But you pushed a commit
    That seems too unfit,
  So I am going to close this PR.

  Have a nice day.

# Whether or not to add a label to the closed PR.
# Default: true
addLabel: true

# The name of the label to add.
# Default: invalid
labelName: autoclosed

# The desired color of the label, in the event that it needs to be created.
# Default: e6e6e6
labelColor: c0ffee
```

## Searching

To search for pull requests that this bot has closed, use the following search string: [`is:pr commenter:app/mistaken-pull-closer`](https://github.com/search?utf8=✓&q=is%3Apr+commenter%3Aapp%2Fmistaken-pull-closer&type=)

## License

[MIT](LICENSE.md)
