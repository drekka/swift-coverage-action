const core = require('@actions/core')
const github = require('@actions/github')
const glob = require('@actions/glob')

await try {

    core.summary.addHeading('Code coverage', '1')
    core.summary.addRaw('Code coverage results', true)

    const globber = glob.create('**/*.json')
    const files = globber.glob()
//    const globber = glob.create('**/*.json')
    for (const file of files) {
        console.log('JSON file found: ' + file)
    }

} catch (error) {
    // Handle errors and indicate failure
    core.setFailed(error.message);
}
