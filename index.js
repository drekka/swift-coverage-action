const core = require('@actions/core');
const github = require('@actions/github');
const glob = require('@actions/glob');

try {

    core.summary.addHeading('Code coverage', '1')
    core.summary.addRaw('Code coverage results', true)

    const globber = await glob.create('**/*.json')
    for await (const file of globber.globGenerator()) {
        console.log('JSON file found: ' + file)
    }

} catch (error) {
    // Handle errors and indicate failure
    core.setFailed(error.message);
}
