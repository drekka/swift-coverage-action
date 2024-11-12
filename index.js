const core = require('@actions/core')
const { glob } = require('@actions/glob')

try {

    core.summary.addHeading('Code coverage', '1')
    core.summary.addRaw('Code coverage results', true)

    const globber = glob.create('**/*.json')
    for (const file of globber.glob()) {
        console.log('JSON file found: ' + file)
    }

} catch (error) {
    // Handle errors and indicate failure
    core.setFailed(error.message);
}
