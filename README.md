# ⚠️ We no longer recommend using this app

Use the action instead: https://github.com/lee-dohm/mistaken-pull-closer

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

```yml
# The JSONPath filter expression used to identify which PRs to close.
# The data filtered is the pull request data along with other metadata passed in
# by probot.
# See http://goessner.net/articles/JsonPath/
# Default behavior: matches all non-Bot created PRs where the user does not have
# permission to push to the PR itself.
filters:
    - @.pull_request.number == 13
    - @.pull_request.base.repo.name == "superstitions"
    - @.pull_request.base.repo.description == "A project opposed to unlucky numbers"

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

## What PRs does this app close?

This Probot app closes PRs where **all** of the following are true:

* Created using a branch that exists in the repo, not a fork
* Created by someone who does not have push access to the repo
* Not created by an app or bot

Because the PR author doesn't have push access to the branch the PR is built on, they can't even submit changes to their own PR. This is why it is generally considered to be a mistake.

GitHub recently added a feature where it will not allow PRs like the above to be created if and only if the PR body is empty. For repositories using PR templates, this is never the case, hence the continuing need for this app.

## Searching

To search for pull requests that this bot has closed, use the following search string: [`is:pr commenter:app/mistaken-pull-closer`](https://github.com/search?utf8=✓&q=is%3Apr+commenter%3Aapp%2Fmistaken-pull-closer&type=)

## License

[MIT](LICENSE.md)
