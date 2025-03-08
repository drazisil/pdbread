#!/usr/bin/env node

import { close, open } from "node:fs";

const about = `pdbread - read a PDB file and print it to the console
    Moduled after w2k_dump.c, by Sven B. Schreiber
    `;

function onClose(err) {
    if (err) {
        console.log(`Error closing file: ${err}`);
        return;
    }

    console.log('File closed successfully');
}


function onOpen(err, fd) {
    if (err) {
        console.log(`Error opening file: ${err}`);
        return;
    }

    console.log('File opened successfully');
    close(fd, onClose);
}

/**
 * 
 * @param {string[]} argv 
 */
function main(argv) {

        console.log(about);

        if (argv.length < 3) {
            console.log('Usage: pdbread filename');
            return;
        }

        const filename = argv[2];
        console.log(`Reading file: ${filename}`);

        // Open the file
        open(filename, 'r', onOpen);

        console.log('Hello, world!');
    }

main(process.argv);