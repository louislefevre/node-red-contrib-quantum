'use strict';

const util = require('util');
const snippets = require('../../snippets');
const shell = require('../../python').PythonShell;

module.exports = function(RED) {
  function ClassicalRegisterNode(config) {
    // Creating node with properties and context
    RED.nodes.createNode(this, config);
    this.name = config.name;
    this.classicalBits = parseInt(config.classicalBits);
    const globalContext = this.context().global;
    const node = this;

    this.on('input', async function(msg, send, done) {
      // Throw a connection error if:
      // - The user did not initialise the quantum circuit using the 'Quantum Circuit' node
      // - The user did not select the 'Registers & Bits' option in the 'Quantum Circuit' node
      // - The user connects the node incorrectly
      if (typeof(globalContext.get('quantumCircuit')) == 'undefined') {
        throw new Error('Quantum circuits must be initialised using the "Quantum Circuit" node.');
      } else if (msg.payload.register === 'no registers' && msg.topic === 'Quantum Circuit') {
        throw new Error('Select "Registers & Bits" in the "Quantum Circuit" node properties to use registers.');
      } else if (typeof(msg.payload.register) !== 'number' && msg.topic === 'Quantum Circuit') {
        throw new Error('Register nodes must be connected to the outputs of the "Quantum Circuit" node.');
      } else if (msg.topic !== 'Quantum Circuit') {
        throw new Error('Register nodes must be connected to nodes from the quantum library only');
      } else { // TODO: Remove redundant else
        // Add arguments to classical register code
        let registerScript = util.format(snippets.CLASSICAL_REGISTER,
            msg.payload.register,
            node.classicalBits + ',' +
            (node.name || ('R' + msg.payload.register.toString())),
        );
        await shell.execute(registerScript, (err) => {
          if (err) node.error(err);
        });

        // Completing the 'structure' global array
        const structure = globalContext.get('quantumCircuit.structure');
        structure[msg.payload.register] = {
          registerType: 'classical',
          registerName: (node.name || ('R' + msg.payload.register.toString())),
          registerVar: 'cr' + msg.payload.register.toString(),
          bits: node.classicalBits,
        };
        globalContext.set('quantumCircuit.structure', structure);

        // Counting the number of registers that were set in the 'structure' array
        let count = 0;
        structure.map((x) => {
          if (typeof(x) !== 'undefined') {
            count += 1;
          }
        });

        // If they are all set: initialise the quantum circuit
        if (count == structure.length) {
          // Add arguments to quantum circuit code
          let circuitScript = util.format(snippets.QUANTUM_CIRCUIT, '%s,'.repeat(count));

          structure.map((register) => {
            circuitScript = util.format(circuitScript, register.registerVar);
          });

          await shell.execute(circuitScript, (err) => {
            if (err) node.error(err);
          });
        }

        // Notify the runtime when the node is done.
        if (done) {
          done();
        }
      }
    });
  }

  RED.nodes.registerType('classical-register', ClassicalRegisterNode);
};
