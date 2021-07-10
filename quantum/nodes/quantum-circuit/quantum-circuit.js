module.exports = function(RED) {
  'use strict';

  function QuantumCircuitNode(config) {
    // Creating node with properties and context
    RED.nodes.createNode(this, config);
    this.name = config.name;
    this.structure = config.structure;
    this.cbits = parseInt(config.cbits);
    this.outputs = parseInt(config.outputs);
    const globalContext = this.context().global;
    const util = require('util');
    const dedent = require('dedent-js');
    const node = this;
    const output = new Array(node.outputs);

    this.on('input', function(msg, send, done) {
      // Storing import script to the 'script' global variable
      let qiskitScript = dedent(`
        import numpy as np
        import qiskit
        from qiskit import *
        \n
      `);
      globalContext.set('script', qiskitScript);

      // If the user wants to use registers
      if (node.structure == 'registers') {
        // Creating an empty 'quantumCircuit' global array
        // This variable represents the quantum circuit structure
        const quantumCircuit = {
          registers: true,
          structure: new Array(node.outputs),
        };
        globalContext.set('quantumCircuit', quantumCircuit);

        // Creating an array of messages to be sent
        // Each message represents a dfifferent register
        for (let i = 0; i < node.outputs; i++) {
          output[i] = {
            topic: 'Quantum Circuit',
            payload: {
              register: i,
            },
          };
        };
      } else { // If the user does not want to use registers
        // Creating an empty 'quantumCircuit' global array
        // This variable represents the quantum circuit structure
        const quantumCircuit = {
          registers: false,
          structure: {
            qbits: node.outputs,
            cbits: node.cbits,
          },
        };
        globalContext.set('quantumCircuit', quantumCircuit);

        // Appending Qiskit script to the 'script' global variable to initiate the quantum circuit
        qiskitScript = dedent(`
          qc = QuantumCircuit(%s, %s)
          \n
        `);
        qiskitScript = util.format(qiskitScript,
            node.outputs,
            node.cbits,
        );

        const oldScript = globalContext.get('script');
        globalContext.set('script', oldScript + qiskitScript);

        // Creating an array of messages to be sent
        // Each message represents a different qubit
        for (let i = 0; i < node.outputs; i++) {
          output[i] = {
            topic: 'Quantum Circuit',
            payload: {
              register: 'no registers',
              qubit: i,
            },
          };
        };
      }

      // Sending one register object per node output
      send(output);
    });
  }

  RED.nodes.registerType('quantum-circuit', QuantumCircuitNode);
};
