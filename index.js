const getConfig = require('probot-config')

const defaultConfig = {
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

async function addLabel (context, issue, name, color) {
  const params = Object.assign({}, issue, {labels: [name]})

  await ensureLabelExists(context, {name, color})
  await context.github.issues.addLabels(params)
}

async function close (context, params) {
  const closeParams = Object.assign({}, params, {state: 'closed'})

  return context.github.issues.edit(closeParams)
}

async function comment (context, params) {
  return context.github.issues.createComment(params)
}

async function ensureLabelExists (context, {name, color}) {
  try {
    return await context.github.issues.getLabel(context.repo({name}))
  } catch (e) {
    return context.github.issues.createLabel(context.repo({name, color}))
  }
}

async function hasPushAccess (context, params) {
  const permissionResponse = await context.github.repos.reviewUserPermissionLevel(params)
  const level = permissionResponse.data.permission

  return level === 'admin' || level === 'write'
}

module.exports = (robot) => {
  robot.on('pull_request.opened', async context => {
    const config = await getConfig(context, 'mistaken-pull-closer.yml', defaultConfig) || defaultConfig
    const {owner} = context.repo()
    const branchLabel = context.payload.pull_request.head.label

    robot.log.debug(`Inspecting: ${context.payload.pull_request.html_url}`)

    // If the branch label starts with the owner name, then it is a PR from a branch in the local
    // repo
    if (branchLabel.startsWith(owner)) {
      robot.log.debug(`PR created from branch in the local repo`)
      const user = context.payload.pull_request.user

      // If the user is a bot then it was invited to open pull requests and isn't the
      // kind of mistake this bot was intended to detect
      if (user.type !== 'Bot') {
        robot.log.debug(`User creating the PR is not a bot`)

        const username = user.login
        const canPush = await hasPushAccess(context, context.repo({username}))

        // If the user creating the PR from a local branch is not a bot and doesn't have push
        // access, then they can't push to their own PR and it isn't going to be useful
        if (!canPush) {
          robot.log.debug(`PR created from repo branch and user cannot push - closing PR`)

          await comment(context, context.issue({body: config.commentBody}))
          if (config.addLabel) {
            await addLabel(
                context, context.issue(), config.labelName, config.labelColor)
          }

          return close(context, context.issue())
        }
      }
    }
  })
}
