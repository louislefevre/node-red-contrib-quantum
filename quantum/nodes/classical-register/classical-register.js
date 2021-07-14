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
    const flowContext = this.context().flow;
    const node = this;
    this.registerVar = 'cr' + node.id.replace('.', '_');

    this.on('input', async function(msg, send, done) {
      // Throw a connection error if:
      // - The user connects it to a node that is not from the quantum library
      // - The user did not select the 'Registers & Bits' option in the 'Quantum Circuit' node
      // - The user does not connect the register node to the output of the 'Quantum Circuit' node
      if (msg.topic !== 'Quantum Circuit') {
        throw new Error(
            'Register nodes must be connected to nodes from the quantum library only',
        );
      } else if (typeof(msg.payload.register) === 'undefined') {
        throw new Error(
            'Select "Registers & Qubits" in the "Quantum Circuit" node properties to use registers.',
        );
      } else if (typeof(msg.payload.register) !== 'number') {
        throw new Error(
            'Register nodes must be connected to the outputs of the "Quantum Circuit" node.',
        );
      }
      // Add arguments to classical register code
      let registerScript = util.format(snippets.CLASSICAL_REGISTER,
          msg.payload.register.toString(),
          node.classicalBits.toString() + ',' +
            (('"' + node.name + '"') || ('"r' + msg.payload.register.toString() + '"')),
      );
      await shell.execute(registerScript, (err) => {
        if (err) node.error(err);
      });

      // Completing the 'structure' global array
      let structure = flowContext.get('quantumCircuit');
      structure[msg.payload.register] = {
        registerType: 'classical',
        registerName: (node.name || ('r' + msg.payload.register.toString())),
        registerVar: 'cr' + msg.payload.register.toString(),
        bits: node.classicalBits,
      };
      flowContext.set('quantumCircuit', structure);

      // Counting the number of registers that were set in the 'structure' array
      let count = 0;
      structure.map((x) => {
        if (typeof (x) !== 'undefined') {
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

        flowContext.set('quantumCircuit', undefined);
      }

      // Notify the runtime when the node is done.
      if (done) {
        done();
      }
    });
  }
  // Defining post request handler for this node to save its config values
  // to frontend variable
  RED.httpAdmin.post('/classical-register', RED.auth.needsPermission('classical-register.read'), function(req, res) {
    classicalRegister.classicalBits = req.body.cbits;
    res.json({success: true});
  });

  // Defining get request handler for other nodes to get latest data on
  // number of classical bits and variable name;
  RED.httpAdmin.get('/classical-register', RED.auth.needsPermission('classical-register.read'), function(req, res) {
    res.json({
      bits: classicalRegister.classicalBits,
      registerVar: classicalRegister.registerVar,
    });
  });
  RED.nodes.registerType('classical-register', ClassicalRegisterNode);
};
