const util = require('util');
const assert = require('chai').assert;
const testUtil = require('../test-util');
const nodeTestHelper = testUtil.nodeTestHelper;
const {FlowBuilder} = require('../flow-builder');
const localSimulatorNode = require('../../quantum/nodes/local-simulator/local-simulator.js');
const shell = require('../../quantum/python.js').PythonShell;
const snippets = require('../../quantum/snippets.js');


describe('LocalSimulatorNode', function() {
  beforeEach(function(done) {
    nodeTestHelper.startServer(done);
  });

  afterEach(function(done) {
    shell.stop();
    nodeTestHelper.unload();
    nodeTestHelper.stopServer(done);
  });

  it('load node', function(done) {
    testUtil.isLoaded(localSimulatorNode, 'local-simulator', done);
  });

  it('execute script', function(done) {
    const flow = new FlowBuilder();
    flow.add('quantum-circuit', 'n0', ['n1'], {structure: 'qubits', outputs: '1', qbitsreg: '1', cbitsreg: '1'});
    flow.add('hadamard-gate', 'n1', ['n2']);
    flow.add('measure', 'n2', ['n3'], {selectedBit: '0'});
    flow.add('local-simulator', 'n3', ['n4'], {shots: '1'});
    flow.addOutput('n4');

    nodeTestHelper.load(flow.nodes, flow.flow, function() {
      let n0 = nodeTestHelper.getNode('n0');
      let n4 = nodeTestHelper.getNode('n4');

      n4.on('input', function(msg) {
        try {
          let command = util.format(snippets.LOCAL_SIMULATOR, '1');
          assert.strictEqual(shell.lastCommand, command);
          done();
        } catch (err) {
          done(err);
        }
      });

      n0.receive({payload: ''});
    });
  });
});
