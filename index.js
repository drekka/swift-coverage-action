const core = require('@actions/core')
const glob = require('@actions/glob')
const fs = require("fs")

async function generateReport() {
    try {

        const coverageFileFilter = core.getInput('filter')

        const globber = await glob.create(coverageFileFilter, {followSymbolicLinks: false})
        const coverageFiles = await globber.glob()
        for (const coverageFile of coverageFiles) {
            console.log('JSON file found: ' + coverageFile)
            fs.readFile(coverageFile, function(err, rawData) {

                if (err) throw err;

                const coverage = JSON.parse(rawData);

                console.log('Data count: ' + coverage.data.length)
                console.log('Lines  : ' + coverage.data[0].totals.lines.count)
                console.log('Covered: ' + coverage.data[0].totals.lines.covered)
                console.log('%      : ' + coverage.data[0].totals.lines.percent)

                for (const file of coverage.data[0].files) {
                    console.log('File: ' + file.filename)
                }

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
