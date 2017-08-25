const commentBody = `
Thanks for your submission.

It appears that you've created a pull request using one of our release branches. Since this is
almost always a mistake, we're going to go ahead and close this. If you meant to do this, please
let us know what you were intending and we can see about reopening it.

Thanks again!
`

async function close (context, params) {
  const closeParams = Object.assign({}, params, {state: 'closed'})

  return context.github.issues.edit(closeParams)
}

async function comment (context, params) {
  return context.github.issues.createComment(params)
}

module.exports = (robot) => {
  robot.on('pull_request.opened', async context => {
    // If the payload.head.label matches then it is a PR against a releases branch which is
    // invariably a mistake
    if (context.payload.pull_request.head.label.match(/^atom:\d+\.\d+-releases$/)) {
      await comment(context, context.issue({body: commentBody}))

      return close(context, context.issue())
    }
  })
}
