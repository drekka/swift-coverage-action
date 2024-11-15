# Swift Coverage report action

This action can be run after any `swift build --enable-code-coverage …` action to gather the coverage and append a  report to the build's summary.

# Usage

Minimal usage:

    - uses: drekka/swift-coverage-action@main@v1

Available arguments. All of these are optional and listed here with their default values.

    - uses: drekka/swift-coverage-action@main@v1
      with:
        # The minimum percentage of coverage each source file
        # must have for the action to be successful.
        coverage: 80

        # Display all the selected sources files in the report. 
        # Default is to only display those that don't met
        # the minimum coverage.
        show-all-files: false        

        # The Swift build directory.
        # This should match the Swift compilers --scratch-path argument.
        # This directory is searched for the JSON code 
        # coverage files. All other files in this directory
        # are ignored.
        build-dir: .build

        # Glob used within the build-dir to locate the 
        # code coverage JSON files.
        coverage-files: **/codecov/*.json
        
        # Comma list of globs which define the source
        # files we want coverage for. 
        includes: **/Sources/**
        
        # Comma list of globs which define source
        # files we want to exclude from coverage reporting. 
        includes: 