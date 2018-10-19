module.exports = {
  // Filter explanation:
  // 1. PR is from a branch in the local repo.
  // 2. User is not a bot.  If the user is a bot then it was invited to open
  //    pull requests and isn't thekind of mistake this bot was intended to
  //    detect.
  // 3. User does not have push access to the project.  They can't push to
  //    their own PR and it isn't going to be useful.
  filters: [
    '@.pull_request.head.user.login == @.pull_request.base.user.login',
    '@.pull_request.user.type != "Bot"',
    '!@.has_push_access'
  ],
  commentBody: `
Thanks for your submission.

It appears that you've created a pull request using one of our repository's branches. Since this is
almost always a mistake, we're going to go ahead and close this. If it was intentional, please
let us know what you were intending and we can see about reopening it.

Thanks again!
`,
  addLabel: true,
  labelName: 'invalid',
  labelColor: 'e6e6e6'
}
