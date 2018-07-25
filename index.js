const defaultConfig = require('./default-config')
const getConfig = require('probot-config')

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

module.exports = (app) => {
  app.on('pull_request.opened', async context => {
    const config = await getConfig(context, 'mistaken-pull-closer.yml', defaultConfig) || defaultConfig
    const {owner} = context.repo()
    const branchLabel = context.payload.pull_request.head.label
    const htmlUrl = context.payload.pull_request.html_url

    app.log.info(`Inspecting: ${htmlUrl}`)

    // If the branch label starts with the owner name, then it is a PR from a branch in the local
    // repo
    if (branchLabel.startsWith(owner)) {
      app.log.info(`PR created from branch in the local repo ✅ [1 of 3]`)
      const user = context.payload.pull_request.user

      // If the user is a bot then it was invited to open pull requests and isn't the
      // kind of mistake this bot was intended to detect
      if (user.type !== 'Bot') {
        app.log.info(`User creating the PR is not a bot ✅ [2 of 3]`)

        const username = user.login
        const canPush = await hasPushAccess(context, context.repo({username}))

        // If the user creating the PR from a local branch is not a bot and doesn't have push
        // access, then they can't push to their own PR and it isn't going to be useful
        if (!canPush) {
          app.log.info(`PR created from repo branch and user cannot push ✅ [3 of 3]`)

          await comment(context, context.issue({body: config.commentBody}))
          if (config.addLabel) {
            await addLabel(context, context.issue(), config.labelName, config.labelColor)
          }

          app.log.info(`Close PR ${htmlUrl}`)
          return close(context, context.issue())
        }
      }
    }
  })
}
