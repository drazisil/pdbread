#!/usr/bin/env node

function readBytes(stream, n) {
    return new Promise((resolve, reject) => {
        const bytes = [];
        stream.on('data', (chunk) => {
            for (const byte of chunk) {
                bytes.push(byte);
                if (bytes.length >= n) {
                    stream.destroy();
                    resolve(bytes);
                    return;
                }
            }
        });
        stream.on('error', reject);
        stream.on('end', () => resolve(bytes));
    });
}

class PdbFile {
    /**
     * Creates an instance of the class.
     * 
     * @constructor
     * @param {Uint8Array} bytes - The byte array to be processed.
     */
    constructor(bytes) {
        this.bytes = bytes;
        this.offset = 0;
        this.signature = '';
        this.version = '';
    }

    verifyLength(neededLength) {
        if (this.bytes.length < neededLength) {
            throw new Error(`Expected at least ${neededLength} bytes`);
        }
    }

    /**
     * Converts an unprintable character to its escape sequence.
     * If the character code is less than 32 or greater than 126, it returns the
     * character as a hexadecimal escape sequence (e.g., \x1f).
     * Otherwise, it returns the character itself.
     *
     * @param {number} c - The character code to convert.
     * @returns {string} The escape sequence or the character itself.
     */
    unprintableChar2Escape(c) {
        if (c < 32 || c > 126) {
            return `\\x${c.toString(16).padStart(2, '0')}`;
        }
        return String.fromCharCode(c);

    }

    checkVersionFromSignature() {
        const re = /[0-9]+\.[0-9]{2}/;
        const match = this.signature.match(re);
        if (match) {
            return match[0];
        }
        throw new Error(`Version not found in signature: ${this.signature}`);
    }

    isVersionCompatible() {
        if (this.version !== null) {
            const [major, minor] = this.version.split('.').map(Number);
            if (major === 2 && minor >= 0) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Escapes unprintable characters in a string.
     *
     * This function takes a string and converts each character to its escaped
     * representation if it is an unprintable character.
     *
     * @param {string} s - The input string to be escaped.
     * @returns {string} - The escaped string with unprintable characters converted.
     */
    escapeString(s) {
        return s.split('').map(c => this.unprintableChar2Escape(c.charCodeAt(0))).join('');
    }

    getNextByte() {
        this.verifyLength(this.offset + 1);
        return this.bytes[this.offset++];
    }

    findString(endingMarker = 0) {
        this.verifyLength(this.offset + 1);
        const start = this.offset;
        let end = this.offset;
        while (this.bytes[end] !== endingMarker && end < this.bytes.length) {
            end++;
        }
        this.offset = end + 1;
        const str = this.bytes.slice(start, end).map(c => String.fromCharCode(c)).join('');
        if(str.length <= 0) {
            throw new Error('Empty string');
        }
        return this.escapeString(str);
    }

    checkSignature() {
        this.signature = this.findString(0, 0x1a);
        console.log(`Signature: ${this.signature}`);
        this.version = this.checkVersionFromSignature();
        console.log(`Version: ${this.version}`);
        if (!this.isVersionCompatible()) {
            throw new Error(`Unsupported version: ${this.version}`);
        }
    }
    
    parse() {
        this.checkSignature();
        console.log(`Offset: ${this.offset}`);
    }

}

// ================== Main ==================

// Read pdb file path from environment variable
const pdbFilePath = process.env.PDB_FILE_PATH;

// Verify file exists
if (!pdbFilePath) {
    console.error('PDB_FILE_PATH environment variable not set');
    process.exit(1);
}

// Opem pdb file as a readable stream
import { createReadStream } from 'node:fs';
const read = createReadStream(pdbFilePath);

// Read the first n bytes from the stream as an array of hex values
const bytes = await readBytes(read, 100); // Read the first 100 bytes

// Parse the pdb file
const pdb = new PdbFile(bytes);
pdb.parse();
