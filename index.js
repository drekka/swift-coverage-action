const core = require('@actions/core')
const glob = require('@actions/glob')

const fs = require("node:fs")
const path = require('node:path')

const micromatch = require('micromatch')

class CoverageChecker {

    // We need the workspace directory so we can slice it off the file paths.
    #projectDir = process.env["GITHUB_WORKSPACE"]
    #buildDir = core.getInput('build-dir')
    #minCoverage = core.getInput('coverage')
    #showAllCoverage = core.getBooleanInput('show-all-files')
    #sortByName = core.getBooleanInput('sort-by-name')
    #coverageFileSource
    #includes
    #excludes

    constructor() {
        //console.log(`Project environment: ${process.env.stringify}`)
        console.log(`Project directory: ${this.#projectDir}`)
        const coverageFileFilter = core.getInput('coverage-files')
        this.#coverageFileSource = path.join(this.#buildDir, coverageFileFilter)
        this.#includes = this.#readFilterGlobs('Reporting on files matching', 'includes')
        this.#excludes = this.#readFilterGlobs('Excluding files matching', 'excludes')
    }

    async generateReport() {
        try {
            console.log(`Loading coverage from: ${this.#coverageFileSource}`)
            const globber = await glob.create(this.#coverageFileSource, {followSymbolicLinks : false})
            const coverageFiles = await globber.glob()
            for (const coverageFile of coverageFiles) {
                this.#processCoverage(coverageFile)
            }

        } catch (error) {
            // Handle errors and indicate failure
            core.setFailed(error.message);
        }
    }

    // Reads a filter from the input arguments and generates a list of globs.
    #readFilterGlobs(logTitle, input) {
        return core.getInput(input).split(',')
        .filter(glob => glob.trim())
        .map(glob => {
            console.log(`${logTitle}: ${glob}`)
            return glob
        })
    }

    // Processes a single coverage file.
    #processCoverage(file) {

        console.log(`Reading coverage file: ${file}`)

        fs.readFile(file, (err, rawData) => {

            if (err) throw err;

            // Parse the raw coverage JSON into a data structure.
            const coverage = JSON.parse(rawData);

            // Read the file coverage summaries, rejecting files from the build dir as they'll be dependencies.
            var coverageData = coverage.data[0].files.filter(fileCoverage => fileCoverage.filename.indexOf(this.#buildDir) == -1)

            // Filter the coverage data using the specified Globs.
            coverageData = this.#filter(coverageData, this.#includes)
            coverageData = this.#filter(coverageData, this.#excludes, true)

            // Build the report.
            console.log(`Coverage on ${coverageData.length} files being processed…`)
            var failedCoverage = []
            coverageData.forEach(coverage => {
                const lines = coverage.summary.lines
                console.log(`File: ${coverage.filename}, lines: ${lines.count}, coverage: ${lines.percent.toFixed(2)}%`)
                if (lines.percent < this.#minCoverage) {
                    failedCoverage.push(coverage)
                }
            })

            // Generate the coverage report.
            this.#report(this.#showAllCoverage ? coverageData : failedCoverage, failedCoverage.length == 0)
        });
    }

    // Generates the coverage report.
    #report(coverageData, success) {

        core.summary.addHeading('Coverage report', '1')

        if (success) {
            core.summary.addRaw(`<p>Coverage is above ${this.#minCoverage}%.</p>`, true).write()
            if (this.#showAllCoverage) {
                this.#reportSources(coverageData)
            }
            core.summary.write()
            return
        }

        core.summary.addRaw(`<p>Coverage is expected to be > ${this.#minCoverage}%. One or more files are below that.</p>`, true)
        this.#reportSources(coverageData)
        core.summary.write()

        core.setFailed(`Coverage below ${this.#minCoverage}%`);
    }

    // Adds a table of the passed coverage data to the summary.
    #reportSources(coverageData) {

        const tableData = [[
            {data : 'File', header : true},
            {data : 'LOC', header : true},
            {data : 'Coverage', header : true}
        ]]

        let projectDirIndex = this.#projectDir.length
        coverageData
        .toSorted(this.#sortByName ? this.#sortCoverageByName : this.#sortCoverageByPct)
        .forEach(coverage => {
            const lines = coverage.summary.lines
            const failedCoverage = lines.percent < this.#minCoverage
            tableData.push([
                {data : this.#highlightIf(failedCoverage, false, coverage.filename.slice(projectDirIndex)) },
                {data : lines.count},
                {data: this.#highlightIf(failedCoverage, true, `${lines.percent.toFixed(2)}%`)}
            ])
        })

        core.summary.addTable(tableData)
    }

    // Sorts two coverage entries by their coverage, defauling to name if the
    // coerage is the same.
    #sortCoverageByPct(left, right) {
        const order = left.summary.lines.percent - right.summary.lines.percent
        return order == 0 ? this.#sortCoverageByName(left, right) : order
    }

    // Sorts two coverage entries by filename.
    #sortCoverageByName(left, right) {
        const leftName = left.filename
        const rightName = right.filename
        if (leftName < rightName) {
            return -1
        }
        if (leftName > rightName) {
            return 1
        }
        return 0
    }

    // Wraps a piece of text in HTML tags to highlight it if requested.
    // But only if we are showing all the files.
    #highlightIf(highlighted, alert, text) {
        return this.#showAllCoverage && highlighted ? `<b><i>${text}${alert ? ' ‼️' : ''}</i></b>` : text
    }

    // Returns a list of glob filtered coverage data.
    #filter(coverageData, globs, invert = false) {

        if (globs.length == 0) {
            return coverageData
        }

        const matcher = micromatch.matcher(globs)
        return coverageData.filter(coverage => matcher(coverage.filename) && !invert)
    }

}


await new CoverageChecker().generateReport()
