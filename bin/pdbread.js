#!/usr/bin/env node

import { close, open, read } from "node:fs";

const about = `pdbread - read a PDB file and print it to the console
    Moduled after w2k_dump.c, by Sven B. Schreiber
    `;

const PDB_SIGNATURE = "Microsoft C/C++ program database 2.00\r\n\x1AJG\0";
const PDB_SIGNATURE_LENGTH = PDB_SIGNATURE.length;

/**
 * 
 * @param {NodeJS.ErrnoException | null} err 
 * @returns 
 */
function onClose(err) {
    if (err) {
        console.log(`Error closing file: ${err}`);
        return;
    }

    console.log('File closed successfully');
}

/**
 * 
 * @param {Buffer<ArrayBuffer>} buffer 
 * @returns 
 */
function compartSignature(buffer) {
    const signature = buffer.toString('utf8', 0, PDB_SIGNATURE_LENGTH);
    if (signature !== PDB_SIGNATURE) {
        console.log(`Invalid PDB signature: ${signature}`);
        return false;
    }

    return true;
}

/**
 * 
 * @param {NodeJS.ErrnoException | null} err 
 * @param {number} bytesRead 
 * @param {Buffer<ArrayBuffer>} buffer 
 * @returns 
 */
function onRead(err, bytesRead, buffer) {
    if (err) {
        console.log(`Error reading file: ${err}`);
        return;
    }

    console.log(`Read ${bytesRead} bytes: ${buffer.toString('utf8', 0, bytesRead)}`);

    if (!compartSignature(buffer)) {
        return;
    }

    console.log('PDB signature is valid');
}


/**
 * 
 * @param {NodeJS.ErrnoException | null} err 
 * @param {number} fd 
 * @returns 
 */
function onOpen(err, fd) {
    if (err) {
        console.log(`Error opening file: ${err}`);
        return;
    }

    console.log('File opened successfully');

    // Read the first 32 bytes
    const buffer = Buffer.alloc(PDB_SIGNATURE_LENGTH);
    const offset = 0;
    const length = PDB_SIGNATURE_LENGTH;
    const position = 0;

    read(fd, buffer, offset, length, position, onRead);

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