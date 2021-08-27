'use strict';

const util = require('util');
const snippets = require('../../snippets');
const shell = require('../../python').PythonShell;
const errors = require('../../errors');
const logger = require('../../logger');

module.exports = function(RED) {
  function LocalSimulatorNode(config) {
    RED.nodes.createNode(this, config);
    this.name = config.name;
    this.shots = config.shots || 1;
    this.qubits = [];
    this.qreg = '';
    const node = this;

    // Reset runtime variables upon output or error
    const reset = function() {
      node.qubits = [];
      node.qreg = '';
    };

    logger.trace(this.id, 'Initialised local simulator');

    this.on('input', async function(msg, send, done) {
      logger.trace(node.id, 'Local simulator received input');
      let script = '';
      let qubitsArrived = true;

      // Validate the node input msg: check for qubit object.
      // Return corresponding errors or null if no errors.
      // Stop the node execution upon an error
      let error = errors.validateQubitInput(msg);
      if (error) {
        logger.error(node.id, error);
        done(error);
        reset();
        return;
      }

      // If the quantum circuit does not have registers
      if (typeof msg.payload.register === 'undefined') {
        node.qreg = undefined;
        node.qubits.push(msg);

        // If not all qubits have arrived
        if (node.qubits.length < msg.payload.structure.qubits) {
          qubitsArrived = false;
        }
      } else {
        // If the quantum circuit has registers
        // Keep track of qubits that have arrived and the remaining ones
        if (node.qubits.length == 0) node.qreg = {};

        // Throw an error if too many qubits are received by the simulator node
        // because the user connected qubits from different quantum circuits
        if ((
          !Object.keys(node.qreg).includes(msg.payload.registerVar) &&
          Object.keys(node.qreg).length == msg.payload.structure.qreg
        ) || (
          Object.keys(node.qreg).includes(msg.payload.registerVar) &&
          node.qreg[msg.payload.registerVar].count == node.qreg[msg.payload.registerVar].total
        )) {
          let error = new Error(errors.QUBITS_FROM_DIFFERENT_CIRCUITS);
          logger.error(node.id, error);
          done(error);
          reset();
          return;
        }

        // Storing information about which qubits were received
        if (Object.keys(node.qreg).includes(msg.payload.registerVar)) {
          node.qreg[msg.payload.registerVar].count += 1;
        } else {
          node.qreg[msg.payload.registerVar] = {
            total: msg.payload.totalQubits,
            count: 1,
          };
        }

        node.qubits.push(msg);

        // Checking whether all qubits have arrived or not
        if (Object.keys(node.qreg).length == msg.payload.structure.qreg) {
          Object.keys(node.qreg).map((key) => {
            if (node.qreg[key].count < node.qreg[key].total) {
              qubitsArrived = false;
            }
          });
        } else {
          qubitsArrived = false;
        }
      }

      // If all qubits have arrived,
      // generate the simulator script and run it
      if (qubitsArrived) {
        // Checking that all qubits received as input are from the same quantum circuit
        let error = errors.validateQubitsFromSameCircuit(node.qubits);
        if (error) {
          logger.error(node.id, error);
          done(error);
          reset();
          return;
        }

        const params = node.shots;
        script += util.format(snippets.LOCAL_SIMULATOR, params);
        await shell.execute(script, (err, data) => {
          logger.trace(node.id, 'Executed local simulator command');
          if (err) {
            logger.error(node.id, err);
            done(err);
          } else {
            msg.payload = JSON.parse(data.replace(/'/g, '"'));
            send(msg);
            done();
          }
          reset();
        });
      }
    });
  }

  RED.nodes.registerType('local-simulator', LocalSimulatorNode);
};
