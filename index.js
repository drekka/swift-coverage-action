const core = require('@actions/core')
const glob = require('@actions/glob')
const fs = require("fs")

async function generateReport() {
    try {

        const coverageFileFilter = core.getInput('filter')

        const globber = await glob.create(coverageFileFilter, {followSymbolicLinks: false})
        const files = await globber.glob()
        for (const file of files) {
            console.log('JSON file found: ' + file)
            fs.readFile(file, function(err, data) {
                if (err) throw err;
                const coverage = JSON.parse(data);
                console.log('Summary: ' + coverage.summary)
            });
        }

        core.summary.addHeading('Code coverage', '1')
        core.summary.addRaw('Code coverage results', true)
        core.summary.write()

    } catch (error) {
        // Handle errors and indicate failure
        core.setFailed(error.message);
    }
}

generateReport()
