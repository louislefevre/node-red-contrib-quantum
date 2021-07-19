"use strict";

/*
 * Snippets must be constants, and constants must capitalised with underscores.
 *
 * Remember to export snippets at the end of the file.
 *
 * To use values from JavaScript code within a snippet, insert a '%s' where you want
 * to place the values. You can then use the util.format() function to replace them with
 * the values at runtime.
 */

// Probably shouldn't use wildcard import here for efficiency but whatever will
// worry about it later.
const IMPORTS = 
`import numpy as np
 from qiskit import *`;

const QUANTUM_CIRCUIT = 
`qc = QuantumCircuit(%s)`;

const CLASSICAL_REGISTER = 
`cr%s = ClassicalRegister(%s)`;

const QUANTUM_REGISTER = 
`qr%s = QuantumRegister(%s)`;

const TOFFOLI_GATE = 
`qc.toffoli(%s, %s, %s)`;

const CNOT_GATE = 
`qc.cx(%s, %s)`;

const BARRIER = 
`qc.barrier(%s)`;

const HADAMARD_GATE =
`qc.h(%s)`;

const NOT_GATE =
`qc.x(%s)`;

module.exports = {
  IMPORTS,
  QUANTUM_CIRCUIT,
  CLASSICAL_REGISTER,
  QUANTUM_REGISTER,
  TOFFOLI_GATE,
  CNOT_GATE,
  BARRIER,
  HADAMARD_GATE,
  NOT_GATE,
};
