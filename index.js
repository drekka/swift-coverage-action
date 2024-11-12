const core = require('@actions/core')
const glob = require('@actions/glob')

async function generateReport() {
    try {

        core.summary.addHeading('Code coverage', '1')
        core.summary.addRaw('Code coverage results', true)

        const globber = await glob.create('**/*.json', {followSymbolicLinks: false})
        const files = await globber.glob()
        for (const file of files) {
            console.log('JSON file found: ' + file)
        }

    } catch (error) {
        // Handle errors and indicate failure
        core.setFailed(error.message);
    }
}

generateReport()
