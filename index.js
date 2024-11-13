const core = require('@actions/core')
const glob = require('@actions/glob')

const fs = require("node:fs")
const path = require('node:path');

const minimatch = require("minimatch")

async function generateReport() {
    try {

        const buildDir = core.getInput('build-dir')
        const coverageFileFilter = core.getInput('coverage-files')
        const coverageFilter = path.join(buildDir, coverageFileFilter)

        console.log('Loading coverage from: ' + coverageFilter)

        const includes = core.getInput('includes').split(',').map(glob => path.join(buildDir, glob.trim()))
        for (const glob of includes) {
            console.log('Including: ' + glob)
        }
        const excludes = core.getInput('excludes').split(',').map(glob => path.join(buildDir, glob.trim()))
        for (const glob of includes) {
            console.log('Excluding: ' + glob)
        }

        const globber = await glob.create(coverageFilter, {followSymbolicLinks: false})
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

                const projectFiles = coverage.data[0].files.filter(file => file.filename.indexOf(buildDir) == -1)

                for (const file of projectFiles) {
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
