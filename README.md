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

## Searching

To search for pull requests that this bot has closed, use the following search string: [`user:atom is:pr commenter:app/mistaken-pull-closer commenter:app/mistaken-pull-closer-test`](https://github.com/search?utf8=%E2%9C%93&q=user%3Aatom+is%3Apr+commenter%3Aapp%2Fmistaken-pull-closer+commenter%3Aapp%2Fmistaken-pull-closer-test&type=)

## License

[MIT](LICENSE.md)
